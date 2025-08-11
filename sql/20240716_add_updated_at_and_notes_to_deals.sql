-- Adds updated_at and notes columns to the deals table.
-- This migration aligns the database schema with the API expectations.

-- Add the columns if they do not exist.
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Backfill updated_at for existing rows using created_at.
UPDATE deals
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Ensure updated_at always has a value and defaults to the current time.
ALTER TABLE deals
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
