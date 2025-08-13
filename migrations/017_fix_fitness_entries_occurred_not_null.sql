-- 017_fix_fitness_entries_occurred_not_null.sql
-- Clean up accidental rows and prevent recurrence.

BEGIN;

-- Remove earlier ghost rows created during the bug (no timestamp).
DELETE FROM public.fitness_entries
WHERE occurred_at IS NULL;

-- Make sure occurred_at has a default now and is not null going forward.
ALTER TABLE public.fitness_entries
  ALTER COLUMN occurred_at SET DEFAULT NOW();

-- In case any rows still have NULL (e.g., future seeds), backfill then enforce NOT NULL.
UPDATE public.fitness_entries
SET occurred_at = COALESCE(occurred_at, created_at, NOW())
WHERE occurred_at IS NULL;

ALTER TABLE public.fitness_entries
  ALTER COLUMN occurred_at SET NOT NULL;

COMMIT;
