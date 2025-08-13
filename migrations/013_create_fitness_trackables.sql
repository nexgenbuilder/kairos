-- migrations/013_create_fitness_trackables.sql
-- Per-user tracked fitness activities (for dashboard focus)

CREATE TABLE IF NOT EXISTS public.fitness_trackables (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, activity)
);
