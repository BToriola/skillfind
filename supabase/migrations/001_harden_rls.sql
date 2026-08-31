-- ============================================================
-- SkillFind — RLS hardening
--
-- Run supabase/inspect.sql FIRST and clear any blocking rows it
-- reports (section 7), otherwise the constraints here will fail.
--
-- Safe to re-run: every statement is idempotent.
--
-- ONE DECISION BEFORE YOU RUN THIS — see section 4, MODERATION.
-- ============================================================

begin;

-- ============================================================
-- 1. HELPERS
--
-- Both are SECURITY DEFINER on purpose: they bypass RLS.
-- A policy on `profiles` that itself SELECTs from `profiles`
-- recurses infinitely and every query on the table starts
-- erroring. Routing the lookup through a definer function is
-- the standard way out.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.owns_freelancer(fid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.freelancers
    where id = fid and user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public, anon, authenticated;
revoke all on function public.owns_freelancer(uuid) from public, anon, authenticated;

-- anon needs EXECUTE too: the public directory policy below is granted
-- `to anon` and calls is_admin() in its USING clause. Postgres evaluates
-- that expression as the anon role, so without this grant every logged-out
-- visitor gets "permission denied for function is_admin" and the whole
-- directory 500s. It returns false for anon (auth.uid() is null) and
-- reveals nothing but the caller's own role.
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.owns_freelancer(uuid) to authenticated;


-- ============================================================
-- 2. TURN RLS ON
--
-- Anything left off here is wide open to the anon key, which
-- ships in the browser bundle of every visitor.
-- ============================================================

alter table public.profiles        enable row level security;
alter table public.freelancers     enable row level security;
alter table public.reviews         enable row level security;
alter table public.portfolio_items enable row level security;


-- ============================================================
-- 3. PROFILES
--
-- The important one is the UPDATE trigger. Without it any signed-in
-- user can PATCH their own row with {"role":"admin"} straight to the
-- REST API and take over the admin dashboard. A policy alone can't
-- stop this — USING/WITH CHECK can't compare old vs new values.
-- ============================================================

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
on public.profiles for delete
to authenticated
using (public.is_admin());

-- Block self-promotion to admin.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only an admin can change a role';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before update on public.profiles
for each row execute function public.protect_profile_role();


-- Guard for the trigger below, which inserts a profile without naming `role`.
-- If that column is NOT NULL with no default, signup would break for every
-- new user. Check inspect.sql section 3 first: if `role` is an enum type
-- rather than text, change 'user' to whatever your non-admin value is.
alter table public.profiles alter column role set default 'user';

-- Create the profile row from a DB trigger instead of from the client.
-- src/utils/auth.ts signUp() currently UPDATEs profiles immediately after
-- signUp(); with email confirmation on there is no session yet, so RLS
-- rejects it and the code never checks the error — full_name and
-- business_name are silently lost. signUp passes them as user metadata,
-- so read them here where it always works.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, business_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    ),
    coalesce(new.raw_user_meta_data->>'business_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill anyone who signed up before this trigger existed.
insert into public.profiles (id, email, full_name, business_name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
  coalesce(u.raw_user_meta_data->>'business_name', '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;


-- ============================================================
-- 4. FREELANCERS
-- ============================================================

-- This column does not exist yet. Confirmed 2026-08-31: PostgREST returns
--   "Could not find the 'is_verified' column of 'freelancers'"
-- even though FreelancerCard, ProfileModal and FreelancerProfileClient all
-- render a "✓ Verified" badge on it, and types/index.ts declares it. The
-- badge has therefore never appeared for anyone. The trigger below also
-- references it, so it has to exist before that trigger can run.
alter table public.freelancers
  add column if not exists is_verified boolean not null default false;

-- Public directory reads. Note `to anon, authenticated` and the
-- is_approved filter: this is what makes admin's Suspend button
-- actually take a listing down instead of just hiding it from the grid.
drop policy if exists "freelancers_select_approved" on public.freelancers;
create policy "freelancers_select_approved"
on public.freelancers for select
to anon, authenticated
using (
  is_approved = true
  or user_id = auth.uid()      -- always see your own, approved or not
  or public.is_admin()
);

drop policy if exists "freelancers_insert_own" on public.freelancers;
create policy "freelancers_insert_own"
on public.freelancers for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "freelancers_update_own_or_admin" on public.freelancers;
create policy "freelancers_update_own_or_admin"
on public.freelancers for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "freelancers_delete_own_or_admin" on public.freelancers;
create policy "freelancers_delete_own_or_admin"
on public.freelancers for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

-- Stop a freelancer approving or verifying themselves, or reassigning
-- ownership of a listing. Again: needs a trigger, not a policy, because
-- it's about what CHANGED.
--
-- >>> MODERATION DECISION <<<
-- As written, a new listing starts is_approved = false and stays hidden
-- until an admin approves it in /admin. That matches the Pending/Approved
-- UI you already have.
-- If you'd rather listings go live instantly, change the marked line to:
--     new.is_approved := true;
create or replace function public.protect_freelancer_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.user_id     := auth.uid();
    new.is_approved := false;   -- <<< MODERATION: flip to true to auto-publish
    new.is_verified := false;
    return new;
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'Cannot reassign a listing to another user';
  end if;
  if new.is_approved is distinct from old.is_approved then
    raise exception 'Only an admin can change approval status';
  end if;
  if new.is_verified is distinct from old.is_verified then
    raise exception 'Only an admin can change verified status';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_freelancer_columns on public.freelancers;
create trigger protect_freelancer_columns
before insert or update on public.freelancers
for each row execute function public.protect_freelancer_columns();

-- One listing per user. The app only checks this client-side
-- (alreadyListed), which two tabs or a double-click defeats — and
-- getUserFreelancerProfile() uses .single(), so a duplicate makes the
-- profile page start erroring for that user.
create unique index if not exists freelancers_user_id_key
  on public.freelancers (user_id);

create unique index if not exists freelancers_slug_key
  on public.freelancers (slug)
  where slug is not null;


-- ============================================================
-- 5. REVIEWS
-- ============================================================

drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public"
on public.reviews for select
to anon, authenticated
using (true);

-- owns_freelancer() blocks reviewing your own listing at the DB level.
-- ProfileModal checks this client-side and FreelancerProfileClient
-- doesn't check at all — neither stops a direct API call.
drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own"
on public.reviews for insert
to authenticated
with check (
  reviewer_id = auth.uid()
  and not public.owns_freelancer(freelancer_id)
);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own"
on public.reviews for update
to authenticated
using (reviewer_id = auth.uid())
with check (reviewer_id = auth.uid());

drop policy if exists "reviews_delete_own_or_admin" on public.reviews;
create policy "reviews_delete_own_or_admin"
on public.reviews for delete
to authenticated
using (reviewer_id = auth.uid() or public.is_admin());

-- One review per person per freelancer. The UI relies on !userReview,
-- which is client-side only.
create unique index if not exists reviews_one_per_reviewer
  on public.reviews (freelancer_id, reviewer_id);

alter table public.reviews drop constraint if exists reviews_rating_range;
alter table public.reviews add constraint reviews_rating_range
  check (rating between 1 and 5);


-- ============================================================
-- 6. PORTFOLIO ITEMS
-- ============================================================

drop policy if exists "portfolio_select_public" on public.portfolio_items;
create policy "portfolio_select_public"
on public.portfolio_items for select
to anon, authenticated
using (true);

-- The client passes freelancerId as a prop. Without this, any signed-in
-- user can POST a portfolio item onto anyone else's listing.
drop policy if exists "portfolio_insert_own" on public.portfolio_items;
create policy "portfolio_insert_own"
on public.portfolio_items for insert
to authenticated
with check (public.owns_freelancer(freelancer_id));

drop policy if exists "portfolio_update_own" on public.portfolio_items;
create policy "portfolio_update_own"
on public.portfolio_items for update
to authenticated
using (public.owns_freelancer(freelancer_id))
with check (public.owns_freelancer(freelancer_id));

drop policy if exists "portfolio_delete_own_or_admin" on public.portfolio_items;
create policy "portfolio_delete_own_or_admin"
on public.portfolio_items for delete
to authenticated
using (public.owns_freelancer(freelancer_id) or public.is_admin());

-- The "Maximum 6 projects" cap is UI-only today.
create or replace function public.enforce_portfolio_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from public.portfolio_items
    where freelancer_id = new.freelancer_id
  ) >= 6 then
    raise exception 'Maximum 6 portfolio items per freelancer';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_portfolio_limit on public.portfolio_items;
create trigger enforce_portfolio_limit
before insert on public.portfolio_items
for each row execute function public.enforce_portfolio_limit();


-- ============================================================
-- 7. STORAGE
--
-- Both uploads write to `<user-id>/...`, so the first path segment
-- is the ownership check. Without these, any signed-in user can
-- overwrite someone else's avatar.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('portfolio', 'portfolio', true)
on conflict (id) do update set public = true;

drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id in ('avatars','portfolio'));

-- uploadAvatar() uses upsert, so INSERT and UPDATE are both needed.
drop policy if exists "storage_insert_own_folder" on storage.objects;
create policy "storage_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('avatars','portfolio')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "storage_update_own_folder" on storage.objects;
create policy "storage_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id in ('avatars','portfolio')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "storage_delete_own_folder" on storage.objects;
create policy "storage_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('avatars','portfolio')
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;


-- ============================================================
-- AFTER RUNNING — grant yourself admin (RLS now blocks doing this
-- from the app, which is the point). Replace the email:
--
--   update public.profiles set role = 'admin'
--   where email = 'you@example.com';
--
-- The trigger allows it here because the SQL Editor runs as postgres,
-- which bypasses RLS.
-- ============================================================
