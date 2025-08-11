-- migrations/007_create_fitness.sql
-- Fitness entries (user-scoped): reps/sets/distance/time

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.fitness_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- when the workout happened
  activity TEXT NOT NULL,                          -- e.g., 'pushups', 'run', 'walk', 'pilates'
  sets INTEGER,                                    -- optional
  reps INTEGER,                                    -- optional
  distance NUMERIC(10,2),                          -- miles/km etc.
  duration_minutes NUMERIC(10,2),                  -- time in minutes
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fit_user ON public.fitness_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_fit_when ON public.fitness_entries(occurred_at);
CREATE INDEX IF NOT EXISTS idx_fit_activity ON public.fitness_entries(activity);
