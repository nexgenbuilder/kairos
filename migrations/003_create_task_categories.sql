-- migrations/003_create_task_categories.sql
-- Idempotent creation of task_categories and FK on tasks(category_id)

-- UUID helper for DEFAULT gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure table exists (won't overwrite if present)
CREATE TABLE IF NOT EXISTS public.task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for scoped queries
CREATE INDEX IF NOT EXISTS idx_task_categories_user ON public.task_categories(user_id);

-- Ensure tasks.category_id FK exists ON DELETE SET NULL (only if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tasks_category_id_fkey'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_category_id_fkey
      FOREIGN KEY (category_id)
      REFERENCES public.task_categories(id)
      ON DELETE SET NULL;
  END IF;
END $$;
