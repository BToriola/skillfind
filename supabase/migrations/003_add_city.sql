-- ============================================================
-- SkillFind — add an optional City/Area field
--
-- State alone (36 values) is too coarse for a "find someone near
-- you" directory — two freelancers on opposite ends of Lagos look
-- identically local. This adds free-text city/neighbourhood
-- alongside state, e.g. "Bodija, Ibadan".
--
-- No RLS changes needed: the existing freelancers UPDATE policy
-- covers the whole row, and this column isn't moderation-sensitive
-- like is_approved/is_verified, so the protect_freelancer_columns
-- trigger from 001 doesn't need to know about it — a freelancer can
-- set their own city freely, same as their bio or rate.
-- ============================================================

alter table public.freelancers
  add column if not exists city text;
