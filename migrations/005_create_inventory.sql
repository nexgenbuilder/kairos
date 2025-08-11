-- migrations/005_create_inventory.sql
-- Idempotent: create/repair inventory_items with user scope + indexes

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Create table shell if missing
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- 2) Add missing columns (safe to re-run)
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS user_id    UUID;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS name       TEXT;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS sku        TEXT;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS qty        INTEGER;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS unit_cost  NUMERIC(12,2);
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2);
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS category   TEXT;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS location   TEXT;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS notes      TEXT;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- 3) Backfill sane defaults for timestamps, then enforce NOT NULL on timestamps only
UPDATE public.inventory_items
SET created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL OR updated_at IS NULL;

ALTER TABLE public.inventory_items
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

-- 4) Optional FK (keep user_id nullable to avoid failures; add if you want strict ownership later)
-- DO NOT re-add if it already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inventory_items_user_fk'
  ) THEN
    ALTER TABLE public.inventory_items
      ADD CONSTRAINT inventory_items_user_fk
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END$$;

-- 5) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_inventory_user ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON public.inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory_items(category);
