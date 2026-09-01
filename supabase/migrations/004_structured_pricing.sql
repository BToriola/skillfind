-- ============================================================
-- SkillFind — structured pricing
--
-- The single free-text `rate` column produced 14 mutually
-- incompatible formats across 14 freelancers: four bare numbers
-- with no unit at all ("400000"), a malformed range
-- ("₦50,000/100, 000"), an invented unit ("50000 per shoe"),
-- a 100x range ("5000-500,000"), and two entries almost certainly
-- off by 100x ("1000000/hr").
--
-- Splitting it into (type, min, max) makes listings comparable and
-- makes "Negotiable" an honest first-class answer rather than a
-- workaround — which matters because quote-per-job is the norm for
-- the local trades this directory is aimed at, not an edge case.
--
-- `rate` is deliberately NOT dropped here. It stays as a fallback
-- the app reads whenever rate_type is null, so this migration is
-- safe to run before the backfill (005) and leaves a recovery path.
-- ============================================================

begin;

alter table public.freelancers
  add column if not exists rate_type text,
  add column if not exists rate_min  numeric,
  add column if not exists rate_max  numeric;

-- Every constraint below tolerates rate_type IS NULL, so existing
-- un-backfilled rows stay valid and this can be applied first.

alter table public.freelancers drop constraint if exists freelancers_rate_type_valid;
alter table public.freelancers add constraint freelancers_rate_type_valid
  check (
    rate_type is null
    or rate_type in ('hourly', 'daily', 'project', 'item', 'negotiable')
  );

-- "Negotiable" must not carry an amount, and any priced type must
-- have at least a minimum — otherwise a listing can claim a pricing
-- model while showing no actual figure.
alter table public.freelancers drop constraint if exists freelancers_rate_coherent;
alter table public.freelancers add constraint freelancers_rate_coherent
  check (
    rate_type is null
    or (rate_type = 'negotiable' and rate_min is null and rate_max is null)
    or (rate_type <> 'negotiable' and rate_min is not null)
  );

alter table public.freelancers drop constraint if exists freelancers_rate_range_valid;
alter table public.freelancers add constraint freelancers_rate_range_valid
  check (
    rate_min is null
    or rate_min >= 0
  );

alter table public.freelancers drop constraint if exists freelancers_rate_max_gte_min;
alter table public.freelancers add constraint freelancers_rate_max_gte_min
  check (
    rate_max is null
    or rate_min is null
    or rate_max >= rate_min
  );

commit;
