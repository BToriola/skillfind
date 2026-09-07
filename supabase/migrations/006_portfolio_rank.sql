-- ============================================================
-- SkillFind — rank listings by whether they show real work
--
-- The directory was ordered by created_at alone, so a listing with
-- six projects sat exactly where an empty one did and the grid gave
-- freelancers no reason to ever fill their portfolio in. This adds a
-- maintained count plus a boolean bucket to order by.
--
-- Counting portfolio_items on every directory load would mean
-- fetching every portfolio row in the table for every visitor, so
-- the count is denormalised onto freelancers and kept honest by a
-- trigger. sync_portfolio_count() recomputes with count(*) rather
-- than doing +1/-1 arithmetic, which makes it self-healing: any
-- drift (a backfill, a manual admin edit, a restore) is corrected
-- by the next insert or delete on that listing.
--
-- has_portfolio is a stored generated column, not a second thing to
-- keep in sync. Ordering buckets on it rather than on portfolio_count
-- is deliberate: *having* work on show is what earns the top of the
-- grid, and one project is enough to get there. Ordering by the raw
-- count instead would pay a freelancer to pad six thin entries to
-- outrank someone with one strong one.
--
-- SECURITY NOTE — the important half of this migration is the
-- protect_freelancer_columns() change at the bottom. portfolio_count
-- now drives ranking, and the freelancers UPDATE policy from 001
-- lets an owner write their own row, so without that guard any
-- signed-in freelancer could PATCH {"portfolio_count": 9999} to the
-- REST API and pin themselves to the top of the directory
-- permanently — the same class of hole the is_approved/is_verified
-- guards in 001 were added to close.
-- ============================================================

begin;

alter table public.freelancers
  add column if not exists portfolio_count integer not null default 0;

-- Generated, so it can never disagree with the count and can't be
-- written by a client at all — Postgres rejects any INSERT or UPDATE
-- naming a generated column, which is why this one needs no guard in
-- protect_freelancer_columns() below.
alter table public.freelancers
  drop column if exists has_portfolio;
alter table public.freelancers
  add column has_portfolio boolean
  generated always as (portfolio_count > 0) stored;

-- Backfill existing listings.
--
-- The protect_freelancer_columns trigger has to come off for this. On a first
-- run the guard below doesn't exist yet and the backfill would pass anyway —
-- but on a re-run (or a re-run after drift) the installed guard sees a direct
-- UPDATE at trigger depth 1 and reverts portfolio_count to its old value,
-- silently turning the backfill into a no-op. Disabling it makes this
-- migration genuinely re-runnable, which is the only way it's any use as a
-- repair tool.
alter table public.freelancers disable trigger protect_freelancer_columns;

update public.freelancers f
   set portfolio_count = (
     select count(*)
       from public.portfolio_items p
      where p.freelancer_id = f.id
   );

alter table public.freelancers enable trigger protect_freelancer_columns;


-- ============================================================
-- Keeping the count true
-- ============================================================

-- security definer so the count is maintained no matter who caused
-- the change — an admin deleting someone else's project, or a
-- cascade from a listing being removed — rather than only when the
-- owner's own RLS policies happen to permit the write.
create or replace function public.sync_portfolio_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  if tg_op = 'DELETE' then
    target := old.freelancer_id;
  else
    target := new.freelancer_id;
  end if;

  update public.freelancers f
     set portfolio_count = (
       select count(*)
         from public.portfolio_items p
        where p.freelancer_id = f.id
     )
   where f.id = target;

  -- An item reassigned between listings leaves the old owner's count
  -- too high, so that side needs recomputing as well. Nothing in the
  -- app does this today; the trigger shouldn't depend on that.
  if tg_op = 'UPDATE' and old.freelancer_id is distinct from new.freelancer_id then
    update public.freelancers f
       set portfolio_count = (
         select count(*)
           from public.portfolio_items p
          where p.freelancer_id = f.id
       )
     where f.id = old.freelancer_id;
  end if;

  -- Return value is ignored for an AFTER ... FOR EACH ROW trigger.
  -- Deleting a listing cascades to its items and fires this trigger,
  -- at which point the UPDATE above simply matches no rows.
  return null;
end;
$$;

drop trigger if exists sync_portfolio_count on public.portfolio_items;
create trigger sync_portfolio_count
after insert or update or delete on public.portfolio_items
for each row execute function public.sync_portfolio_count();


-- ============================================================
-- Directory ordering index
--
-- Mirrors the ORDER BY getFreelancers() now sends, in the same
-- order. is_verified needs an explicit NULLS LAST: it's nullable,
-- and DESC in Postgres defaults to NULLS FIRST, which would rank
-- every legacy row with a null flag above genuinely verified ones.
-- ============================================================

drop index if exists public.freelancers_directory_rank_idx;
create index freelancers_directory_rank_idx
  on public.freelancers (
    is_approved,
    has_portfolio desc,
    is_verified desc nulls last,
    created_at desc
  );


-- ============================================================
-- Close the rank-boost hole
--
-- Same function as 001, with one clause added. Reproduced whole
-- because create or replace needs the full body.
-- ============================================================

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
    new.user_id         := auth.uid();
    new.is_approved     := false;   -- <<< MODERATION: flip to true to auto-publish
    new.is_verified     := false;
    new.portfolio_count := 0;       -- a new listing has no projects yet
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

  -- portfolio_count is derived state owned by sync_portfolio_count(),
  -- and it decides where a listing sits in the directory. Reverted
  -- rather than raised, unlike the moderation columns above: a client
  -- echoing a derived column back is not necessarily an attack, and
  -- silently ignoring the value can't break a legitimate profile save
  -- the way an exception would. The trigger is the only source of
  -- truth either way.
  --
  -- pg_trigger_depth() > 1 means this UPDATE was issued from inside
  -- another trigger — i.e. sync_portfolio_count(), the one writer
  -- allowed to move this column. A direct call from the REST API or
  -- the client library always arrives at depth 1.
  if pg_trigger_depth() <= 1 then
    new.portfolio_count := old.portfolio_count;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_freelancer_columns on public.freelancers;
create trigger protect_freelancer_columns
before insert or update on public.freelancers
for each row execute function public.protect_freelancer_columns();

commit;
