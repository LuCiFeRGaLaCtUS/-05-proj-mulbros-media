-- Admin access request + approval workflow (columns on profiles).
-- One request per user, re-requestable. super_admin reviews via Platform Admin.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_request_status text DEFAULT 'none'
    CHECK (admin_request_status IN ('none','pending','approved','denied')),
  ADD COLUMN IF NOT EXISTS admin_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_reviewed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS admin_reviewed_by  uuid REFERENCES public.profiles(id);
