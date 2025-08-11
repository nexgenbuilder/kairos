require('dotenv').config();
const { Pool } = require('pg');

const sql = `
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  prospect_id UUID NULL,
  deal_id UUID NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM transactions) THEN
    INSERT INTO transactions (type, amount, date, notes)
    VALUES 
      ('income', 250.00, CURRENT_DATE - INTERVAL '1 day', 'seed: income'),
      ('expense', 75.00,  CURRENT_DATE - INTERVAL '1 day', 'seed: expense');
  END IF;
END $$;
`;

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log('Creating transactions table (if missing) and seeding...');
    await pool.query(sql);
    console.log('✅ Done.');
  } catch (e) {
    console.error('❌ Failed:', e);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();
