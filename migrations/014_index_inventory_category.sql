-- migrations/014_index_inventory_category.sql
-- Helpful indexes for category/SKU lookups and dashboard rollups

CREATE INDEX IF NOT EXISTS idx_inventory_user_category
  ON public.inventory_items(user_id, category);

CREATE INDEX IF NOT EXISTS idx_inventory_user_sku
  ON public.inventory_items(user_id, sku);
