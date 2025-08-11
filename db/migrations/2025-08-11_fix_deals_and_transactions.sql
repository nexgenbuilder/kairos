-- Enable UUID helpers (safe if already installed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

------------------------------------------------------------
-- Fix deals schema the API expects
------------------------------------------------------------
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS notes       TEXT,
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT now();

-- Keep updated_at current on any update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_trigger
    WHERE  tgname = 'deals_set_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $f$
    BEGIN
      NEW.updated_at := now();
      RETURN NEW;
    END
    $f$ LANGUAGE plpgsql;

    CREATE TRIGGER deals_set_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- For existing rows created before updated_at existed, ensure it's not older than created_at
UPDATE deals SET updated_at = GREATEST(updated_at, created_at);

------------------------------------------------------------
-- Create transactions table (used by /, /api/transactions, /api/cashflow)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id   UUID NULL,
  deal_id       UUID NULL,
  type          TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount        NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  description   TEXT NULL,
  category      TEXT NULL
);

-- Optional: wire FK’s if those tables exist (ignore if they don't)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='prospects') THEN
    ALTER TABLE transactions
      DROP CONSTRAINT IF EXISTS transactions_prospect_id_fkey,
      ADD  CONSTRAINT transactions_prospect_id_fkey
      FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='deals') THEN
    ALTER TABLE transactions
      DROP CONSTRAINT IF EXISTS transactions_deal_id_fkey,
      ADD  CONSTRAINT transactions_deal_id_fkey
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON transactions(occurred_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type        ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_deal_id     ON transactions(deal_id);

------------------------------------------------------------
-- Backfill revenue transactions from already-won deals
-- (so cashflow and home stop looking "empty")
------------------------------------------------------------
INSERT INTO transactions (deal_id, prospect_id, type, amount, occurred_at, description, category)
SELECT
  d.id,
  d.prospect_id,
  'income'::text,
  COALESCE(NULLIF(d.actual_amount, 0), d.amount),     -- if you don’t have actual_amount this still works
  COALESCE(NULLIF(d.won_at, TIMESTAMPTZ 'epoch'), d.updated_at, d.created_at),
  d.name,
  'deal'
FROM deals d
WHERE d.stage = 'won'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t WHERE t.deal_id = d.id
  );
