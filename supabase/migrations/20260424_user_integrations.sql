-- user_integrations — OAuth tokens for third-party services (Spotify, later YouTube, etc.)
-- Unique per (user_id, service) — one connection per service per user.
-- References profiles(id). Client-filtered by user_id (Stytch auth at app layer).

CREATE TABLE IF NOT EXISTS public.user_integrations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service       text NOT NULL,
  access_token  text,
  refresh_token text,
  expires_at    timestamptz,
  metadata      jsonb DEFAULT '{}'::jsonb,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, service)
);

CREATE INDEX IF NOT EXISTS user_integrations_user_idx
  ON public.user_integrations (user_id);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_user_integrations" ON public.user_integrations;
CREATE POLICY "anon_all_user_integrations" ON public.user_integrations
  FOR ALL TO anon USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
