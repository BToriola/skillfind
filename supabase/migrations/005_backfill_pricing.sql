-- ============================================================
-- SkillFind — backfill the 14 existing free-text rates
--
-- Run AFTER 004_structured_pricing.sql.
--
-- >>> READ THIS BEFORE RUNNING <<<
-- Two kinds of row below:
--
--   FAITHFUL  — the original text stated its unit, so it is carried
--               over exactly as written, even where the number looks
--               wrong. Changing someone's advertised price is not a
--               migration's job.
--
--   JUDGEMENT — the original had NO unit (e.g. just "400000"), so a
--               unit had to be chosen. 'project' is used, as a lump
--               sum with no unit reads as per-project in this market.
--               These are guesses. Ask the freelancer to confirm.
--
-- Two FAITHFUL rows are almost certainly 100x data-entry errors by
-- the freelancer (marked SUSPICIOUS). They are migrated unchanged on
-- purpose — reach out and have them corrected in the app instead.
-- ============================================================

begin;

-- ---------- FAITHFUL: unit was explicit in the original ----------

-- "Depends on the types of work" — the only honest entry in the set.
update public.freelancers set rate_type = 'negotiable', rate_min = null, rate_max = null
  where slug = 'ajiroba-olusegun-61d37b';

-- "50000 per shoe" — invented its own unit; 'item' is the structured equivalent.
update public.freelancers set rate_type = 'item', rate_min = 50000, rate_max = null
  where slug = 'noah-agirinya-3b7049';

-- "₦15,000 - ₦30,000/hr"
update public.freelancers set rate_type = 'hourly', rate_min = 15000, rate_max = 30000
  where slug = 'damilare-olawoyin-4b0bdc';

-- "10,000-30,000/hr"
update public.freelancers set rate_type = 'hourly', rate_min = 10000, rate_max = 30000
  where slug = 'saku-kehinde-f07f14';

-- "20,000/hr"
update public.freelancers set rate_type = 'hourly', rate_min = 20000, rate_max = null
  where slug = 'simeon-oni-3827e5';

-- "Hourly: ₦20,000 - ₦50,000/hr" (said hourly twice)
update public.freelancers set rate_type = 'hourly', rate_min = 20000, rate_max = 50000
  where slug = 'babatunde-adenrele-a0cb21';

-- SUSPICIOUS — "₦75,000 - ₦150,000/hr" for a Product Designer.
-- ₦150k/hr is ~₦24m/month at 40h/wk. Very likely meant per project.
update public.freelancers set rate_type = 'hourly', rate_min = 75000, rate_max = 150000
  where slug = 'damilola-olawoyin-9705a1';

-- SUSPICIOUS — "1000000/hr" = ₦1,000,000 per hour.
update public.freelancers set rate_type = 'hourly', rate_min = 1000000, rate_max = null
  where slug = 'crown-interactive-limited-77576f';


-- ---------- JUDGEMENT: original had no unit, 'project' assumed ----------

-- "15,000-200,000"
update public.freelancers set rate_type = 'project', rate_min = 15000, rate_max = 200000
  where slug = 'johnson-oluwadamilola-ojo-2a2ade';

-- "400000"
update public.freelancers set rate_type = 'project', rate_min = 400000, rate_max = null
  where slug = 'ruth-salau-8517a8';

-- "200,000"
update public.freelancers set rate_type = 'project', rate_min = 200000, rate_max = null
  where slug = 'iyanuoluwa-rachael-oladele-69d79b';

-- "10000"
update public.freelancers set rate_type = 'project', rate_min = 10000, rate_max = null
  where slug = 'batue-socials-fdfd40';

-- "5000-500,000" — a 100x range, migrated as-is but worth a conversation.
update public.freelancers set rate_type = 'project', rate_min = 5000, rate_max = 500000
  where slug = 'bodunde-taiwo-peter-63058e';

-- "₦50,000/100, 000" — malformed; reading the "/" as a range separator.
update public.freelancers set rate_type = 'project', rate_min = 50000, rate_max = 100000
  where slug = 'tunde-bakare-66d216';

commit;


-- ---------- verify: every row should now have a rate_type ----------
--
--   select slug, skill, rate as legacy_text, rate_type, rate_min, rate_max
--   from public.freelancers
--   order by rate_type, rate_min desc nulls last;
--
-- Anything still showing rate_type = null was missed and will keep
-- falling back to its legacy free-text `rate` in the UI.
