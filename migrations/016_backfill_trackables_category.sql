-- 016_backfill_trackables_category.sql
-- Backfill existing rows and set a default for category so it won't be NULL.

-- 1) Add default if not present
ALTER TABLE public.fitness_trackables
  ALTER COLUMN category SET DEFAULT 'Uncategorized';

-- 2) Backfill known activities into sensible categories
UPDATE public.fitness_trackables
SET category = CASE
  WHEN activity IN ('Running','Jogging','Walking','Cycling','Rowing','Swimming') THEN 'Cardio'
  WHEN activity IN ('Pushups','Push-up','Situps','Sit-ups','Pull-ups','Lunges','Planks') THEN 'Strength'
  WHEN activity IN ('Squat','Deadlift','Bench Press','Overhead Press','Barbell Row') THEN 'Lifting'
  WHEN activity IN ('Stretching','Yoga') THEN 'Flexibility'
  WHEN activity IN ('Pilates','Tai Chi') THEN 'Mind-Body'
  WHEN activity IN ('Basketball','Soccer','Tennis') THEN 'Sports'
  ELSE 'Uncategorized'
END
WHERE category IS NULL;

-- 3) If you want to enforce non-null going forward:
ALTER TABLE public.fitness_trackables
  ALTER COLUMN category SET NOT NULL;

-- 4) Keep an index for quick lookups
CREATE INDEX IF NOT EXISTS fitness_trackables_user_category_idx
  ON public.fitness_trackables (user_id, category);
