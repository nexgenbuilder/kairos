-- transactions → prospects (cascade)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_transactions_prospect'
  ) THEN
    ALTER TABLE public.transactions
    ADD CONSTRAINT fk_transactions_prospect
    FOREIGN KEY (prospect_id)
    REFERENCES public.prospects(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- transactions → deals (cascade)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_transactions_deal'
  ) THEN
    ALTER TABLE public.transactions
    ADD CONSTRAINT fk_transactions_deal
    FOREIGN KEY (deal_id)
    REFERENCES public.deals(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- deals → prospects (cascade)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_deals_prospect'
  ) THEN
    ALTER TABLE public.deals
    ADD CONSTRAINT fk_deals_prospect
    FOREIGN KEY (prospect_id)
    REFERENCES public.prospects(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- prospect_interactions → prospects (cascade)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_interactions_prospect'
  ) THEN
    ALTER TABLE public.prospect_interactions
    ADD CONSTRAINT fk_interactions_prospect
    FOREIGN KEY (prospect_id)
    REFERENCES public.prospects(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- appointments → prospects (cascade)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_appointments_prospect'
  ) THEN
    ALTER TABLE public.appointments
    ADD CONSTRAINT fk_appointments_prospect
    FOREIGN KEY (prospect_id)
    REFERENCES public.prospects(id)
    ON DELETE CASCADE;
  END IF;
END $$;
