-- KPI tracking: user_activity event log
-- Captures agent_chat, content_generated, lead_added, pipeline_moved, submission_tracked
-- Referenced by profiles(id) since this app uses Stytch (not Supabase auth.users).
-- Client-side queries filter by profile.id — matches existing pipeline tables pattern.

CREATE TABLE IF NOT EXISTS public.user_activity (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata   jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_activity_user_created_idx
  ON public.user_activity (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_activity_user_type_idx
  ON public.user_activity (user_id, event_type);

-- RLS enabled but permissive; app layer filters by profile.id
-- (matches existing pattern for film_pipeline / music_pipeline / agent_chats)
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_user_activity" ON public.user_activity;
CREATE POLICY "anon_all_user_activity" ON public.user_activity
  FOR ALL TO anon USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
