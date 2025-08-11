-- Automatically maintain updated_at on deals updates
CREATE OR REPLACE FUNCTION deals_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deals_set_updated_at ON deals;

CREATE TRIGGER deals_set_updated_at
BEFORE UPDATE ON deals
FOR EACH ROW
EXECUTE FUNCTION deals_set_updated_at();
