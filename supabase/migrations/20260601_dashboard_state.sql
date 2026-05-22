-- Dashboard day counter + phone column on profiles.
-- dashboard_day drives day-locked card progression (FSZT v2 pattern).
-- phone optional; Stytch stores it canonically but having it here enables queries.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dashboard_day integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS phone text;
