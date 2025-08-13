-- migrations/009_create_tx_categories.sql
-- Per-user categories for cashflow (idempotent)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.transaction_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- unique per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='uniq_txcat_user_name'
  ) THEN
    CREATE UNIQUE INDEX uniq_txcat_user_name ON public.transaction_categories(user_id, name);
  END IF;
END $$;

-- index by user
CREATE INDEX IF NOT EXISTS idx_txcat_user ON public.transaction_categories(user_id);
