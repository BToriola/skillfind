-- ============================================================
-- SkillFind — read-only audit. Run this FIRST.
-- Nothing here changes data. Paste into the Supabase SQL Editor
-- and read the output before applying 001_harden_rls.sql.
-- ============================================================


-- 1. Is RLS actually enabled? Any table with rowsecurity = false
--    is fully readable AND writable by anyone holding the anon key,
--    which is shipped to every browser.
select
  relname            as table_name,
  relrowsecurity     as rls_enabled,
  relforcerowsecurity as rls_forced
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
order by relname;


-- 2. Every policy currently in place, and what it actually allows.
--    Read the `qual` (USING) and `with_check` (WITH CHECK) columns closely:
--    a policy of `true` grants that operation to everyone.
select
  tablename,
  policyname,
  cmd,
  roles,
  qual       as using_expr,
  with_check as check_expr
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;


-- 3. Column defaults — decides whether a new listing is live immediately.
--    Look at freelancers.is_approved: `false` = moderated, `true` = auto-publish.
select
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('profiles','freelancers','reviews','portfolio_items')
order by table_name, ordinal_position;


-- 4. Existing constraints (unique / check / FK).
select
  conrelid::regclass as table_name,
  conname            as constraint_name,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where connamespace = 'public'::regnamespace
order by conrelid::regclass::text, conname;


-- 5. Storage buckets. Both must be public for getPublicUrl() to work.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets;


-- 6. Storage policies.
select policyname, cmd, qual as using_expr, with_check as check_expr
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;


-- ============================================================
-- 7. Data that would BLOCK the constraints in 001_harden_rls.sql.
--    Each of these must return zero rows before that file will apply.
-- ============================================================

-- Freelancers with more than one listing (blocks the unique index on user_id)
select user_id, count(*) as listings
from public.freelancers
group by user_id having count(*) > 1;

-- Duplicate slugs (blocks the unique index on slug)
select slug, count(*) from public.freelancers
where slug is not null
group by slug having count(*) > 1;

-- Someone who reviewed the same freelancer twice
select freelancer_id, reviewer_id, count(*)
from public.reviews
group by freelancer_id, reviewer_id having count(*) > 1;

-- Ratings outside 1–5 (blocks the CHECK constraint)
select id, freelancer_id, rating from public.reviews
where rating is null or rating < 1 or rating > 5;

-- Self-reviews already in the table
select r.id, r.reviewer_id, f.user_id
from public.reviews r
join public.freelancers f on f.id = r.freelancer_id
where r.reviewer_id = f.user_id;

-- Freelancers with more than 6 portfolio items
select freelancer_id, count(*) from public.portfolio_items
group by freelancer_id having count(*) > 6;

-- Auth users missing a profiles row (the signUp update silently fails
-- under RLS when email confirmation is on and there's no session yet)
select u.id, u.email, u.created_at
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Who currently holds admin
select id, email, role from public.profiles where role = 'admin';
