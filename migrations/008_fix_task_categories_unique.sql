-- migrations/008_fix_task_categories_unique.sql
-- Make task_categories unique per user (user_id, name), not globally by name.

-- Ensure user_id exists
ALTER TABLE public.task_categories
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Drop the old global unique on name, if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'task_categories_name_key'
      AND conrelid = 'public.task_categories'::regclass
  ) THEN
    ALTER TABLE public.task_categories DROP CONSTRAINT task_categories_name_key;
  END IF;
END $$;

-- Create a per-user unique index (case-sensitive; we normalize in API)
CREATE UNIQUE INDEX IF NOT EXISTS uq_task_categories_user_name
  ON public.task_categories(user_id, name);

-- Helpful index for listing by user
CREATE INDEX IF NOT EXISTS idx_task_categories_user
  ON public.task_categories(user_id);
