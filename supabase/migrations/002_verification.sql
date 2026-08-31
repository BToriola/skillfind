-- ============================================================
-- SkillFind — freelancer identity verification
--
-- Run AFTER 001_harden_rls.sql (this depends on is_admin() and
-- owns_freelancer() from that file, and on freelancers.is_verified).
--
-- Design note: the badge promises "we checked a government ID matching
-- this person's name" and nothing more. To keep that promise without
-- becoming a store of Nigerian identity data, ID *numbers* are never
-- recorded and the uploaded files are deleted the moment a reviewer
-- decides. What survives a review is: who reviewed it, when, and which
-- kind of document they looked at.
-- ============================================================

begin;

-- When the badge was granted, so profiles can show "Verified since ..."
alter table public.freelancers
  add column if not exists verified_at timestamptz;


-- ============================================================
-- 1. REQUESTS
-- ============================================================

create table if not exists public.verification_requests (
  id               uuid primary key default gen_random_uuid(),
  freelancer_id    uuid not null references public.freelancers(id) on delete cascade,
  user_id          uuid not null references auth.users(id)         on delete cascade,
  id_type          text not null,
  -- Storage object paths in the PRIVATE `verification` bucket.
  -- Never public URLs: these are viewed through short-lived signed URLs.
  document_path    text,
  selfie_path      text,
  status           text not null default 'pending',
  rejection_reason text,
  reviewed_by      uuid references auth.users(id),
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now()
);

alter table public.verification_requests
  drop constraint if exists verification_status_valid;
alter table public.verification_requests
  add constraint verification_status_valid
  check (status in ('pending', 'approved', 'rejected'));

alter table public.verification_requests
  drop constraint if exists verification_id_type_valid;
alter table public.verification_requests
  add constraint verification_id_type_valid
  check (id_type in (
    'NIN Slip',
    'Driver''s License',
    'Voter''s Card',
    'International Passport'
  ));

-- One open request at a time — stops someone flooding the review queue.
create unique index if not exists verification_one_pending_per_freelancer
  on public.verification_requests (freelancer_id)
  where status = 'pending';

create index if not exists verification_status_idx
  on public.verification_requests (status, created_at desc);

alter table public.verification_requests enable row level security;


-- ============================================================
-- 2. POLICIES
-- ============================================================

-- A freelancer sees only their own history; admins see everything.
drop policy if exists "verification_select_own_or_admin" on public.verification_requests;
create policy "verification_select_own_or_admin"
on public.verification_requests for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

-- Submit only for yourself, only for a listing you own, only as pending.
drop policy if exists "verification_insert_own" on public.verification_requests;
create policy "verification_insert_own"
on public.verification_requests for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.owns_freelancer(freelancer_id)
  and status = 'pending'
);

-- Only an admin may move a request out of pending. Deliberately no
-- self-update policy: otherwise an applicant could approve themselves.
drop policy if exists "verification_update_admin" on public.verification_requests;
create policy "verification_update_admin"
on public.verification_requests for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "verification_delete_own_or_admin" on public.verification_requests;
create policy "verification_delete_own_or_admin"
on public.verification_requests for delete
to authenticated
using ((user_id = auth.uid() and status = 'pending') or public.is_admin());


-- Stamp the reviewer automatically so it can't be forged or forgotten.
create or replace function public.stamp_verification_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and new.status <> 'pending' then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists stamp_verification_review on public.verification_requests;
create trigger stamp_verification_review
before update on public.verification_requests
for each row execute function public.stamp_verification_review();


-- ============================================================
-- 3. PRIVATE STORAGE BUCKET
--
-- `public => false`, unlike avatars and portfolio. These files are
-- government ID documents: if this bucket were public, every one of
-- them would be downloadable by anyone who guessed the URL.
-- Reads happen only through short-lived signed URLs an admin creates.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verification', 'verification', false, 5242880,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'];

-- Upload into your own folder only.
drop policy if exists "verification_upload_own_folder" on storage.objects;
create policy "verification_upload_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'verification'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Only admins can read. Note this deliberately excludes the applicant:
-- they already hold the original, and it keeps the blast radius of a
-- leaked non-admin session to nothing.
drop policy if exists "verification_read_admin" on storage.objects;
create policy "verification_read_admin"
on storage.objects for select
to authenticated
using (bucket_id = 'verification' and public.is_admin());

-- Admins delete after review; applicants can clear an unreviewed upload.
drop policy if exists "verification_delete_own_or_admin" on storage.objects;
create policy "verification_delete_own_or_admin"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'verification'
  and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
);

commit;


-- ============================================================
-- RETENTION SWEEP
--
-- Files are deleted by the app as each review is decided. This catches
-- anything orphaned by a failed request. Worth running periodically —
-- Supabase's Cron extension can schedule it.
--
--   select id, document_path, selfie_path
--   from public.verification_requests
--   where status <> 'pending'
--     and (document_path is not null or selfie_path is not null)
--     and reviewed_at < now() - interval '7 days';
--
-- Anything listed still has files in storage that should have been
-- removed; delete the objects, then null the two path columns.
-- ============================================================
