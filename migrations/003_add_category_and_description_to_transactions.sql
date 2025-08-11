ALTER TABLE IF EXISTS public.transactions
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_transactions_category' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_transactions_category ON public.transactions(category);
  END IF;
END $$;
