-- Safe seed: only insert if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM transactions) THEN
    INSERT INTO transactions (type, amount, date, notes)
    VALUES 
      ('income', 250.00, CURRENT_DATE - INTERVAL '1 day', 'seed: income'),
      ('expense', 75.00,  CURRENT_DATE - INTERVAL '1 day', 'seed: expense');
  END IF;
END $$;
