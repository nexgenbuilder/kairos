ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS probability double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS heat text,
  ADD COLUMN IF NOT EXISTS won_at timestamptz;

UPDATE deals SET stage = 'open' WHERE stage IS NULL;
UPDATE deals SET probability = 0 WHERE probability IS NULL;
