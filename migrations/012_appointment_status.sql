-- migrations/012_add_appointment_status.sql
-- Add a status column to appointments for better lifecycle control.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS status TEXT
  CHECK (status IN ('scheduled','completed','missed','rescheduled')) ;

UPDATE public.appointments
SET status = COALESCE(status, 'scheduled');

ALTER TABLE public.appointments
  ALTER COLUMN status SET DEFAULT 'scheduled';

CREATE INDEX IF NOT EXISTS idx_appt_user_status
  ON public.appointments(user_id, status);
