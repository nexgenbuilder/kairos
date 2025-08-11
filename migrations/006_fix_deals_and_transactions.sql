-- Ensure UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add missing column for actual collected amount on deals
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS actual_amount NUMERIC(12,2);

-- Recreate transactions table with proper schema
DROP TABLE IF EXISTS transactions;
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NULL,
  deal_id UUID NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  description TEXT NULL,
  category TEXT NULL
);

-- Foreign keys
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='prospects') THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_prospect_id_fkey
      FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE SET NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='deals') THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_deal_id_fkey
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON transactions(occurred_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_deal_id ON transactions(deal_id);

-- Backfill transactions for already won deals
INSERT INTO transactions (deal_id, prospect_id, type, amount, occurred_at, description, category)
SELECT d.id,
       d.prospect_id,
       'income',
       COALESCE(NULLIF(d.actual_amount, 0), d.amount),
       COALESCE(NULLIF(d.won_at, TIMESTAMPTZ 'epoch'), d.updated_at, d.created_at),
       d.name,
       'deal'
FROM deals d
WHERE d.stage = 'won'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t WHERE t.deal_id = d.id
  );
