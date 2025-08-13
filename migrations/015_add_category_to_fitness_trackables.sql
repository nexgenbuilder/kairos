-- 015_add_category_to_fitness_trackables.sql

-- Add category column if missing
ALTER TABLE IF EXISTS public.fitness_trackables
ADD COLUMN IF NOT EXISTS category text;

-- Default any NULLs to "Uncategorized"
UPDATE public.fitness_trackables
SET category = COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized')
WHERE category IS NULL OR TRIM(category) = '';

-- Make it NOT NULL going forward
ALTER TABLE public.fitness_trackables
ALTER COLUMN category SET NOT NULL;

-- Keep uniqueness by user+activity (activity names stay unique for that user)
-- If a previous unique existed we keep it. If not, create it idempotently.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'fitness_trackables_user_activity_key'
  ) THEN
    ALTER TABLE public.fitness_trackables
    ADD CONSTRAINT fitness_trackables_user_activity_key UNIQUE (user_id, activity);
  END IF;
END$$;

-- Helpful index for category lookups
CREATE INDEX IF NOT EXISTS idx_fitness_trackables_user_category
  ON public.fitness_trackables (user_id, category);
