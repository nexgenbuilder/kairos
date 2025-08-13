-- migrations/010_fix_prospects_stage_default.sql
-- Normalize stage to lowercase + safe default; relax/define allowed set.

-- 1) Make everything lowercase so it passes the check
UPDATE public.prospects
SET stage = LOWER(stage)
WHERE stage IS NOT NULL;

-- 2) Drop old constraint if present
ALTER TABLE public.prospects
  DROP CONSTRAINT IF EXISTS prospects_stage_check;

-- 3) Recreate with a clear allowed set (tweak if your app expects a different list)
ALTER TABLE public.prospects
  ADD CONSTRAINT prospects_stage_check
  CHECK (stage IN ('new','lead','qualified','proposal','won','lost'));

-- 4) Set a safe default
ALTER TABLE public.prospects
  ALTER COLUMN stage SET DEFAULT 'lead';
