-- migrations/011_fix_deals_stage_default.sql
-- Normalize stage values to lowercase and enforce allowed set for deals.

-- 1) Lowercase existing values
UPDATE public.deals
SET stage = LOWER(stage)
WHERE stage IS NOT NULL;

-- 2) Drop old constraint if present
ALTER TABLE public.deals
  DROP CONSTRAINT IF EXISTS deals_stage_check;

-- 3) Recreate with a clean allowed set (adjust if you use more)
ALTER TABLE public.deals
  ADD CONSTRAINT deals_stage_check
  CHECK (stage IN ('open','won','lost'));

-- 4) Safe default
ALTER TABLE public.deals
  ALTER COLUMN stage SET DEFAULT 'open';
