-- Composer projects — sync + scoring pipeline
-- Stages: Pitching → In Consideration → Contract → Scoring → Delivered → Archived
-- References profiles(id). Client-side filters by user_id; RLS permissive (Stytch auth at app layer).

CREATE TABLE IF NOT EXISTS public.composer_projects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        text NOT NULL,
  director     text,
  platform     text,
  genre        text,
  budget_range text,
  status       text DEFAULT 'Pitching',
  notes        text,
  created_at   timestamptz DEFAULT now(),
  metadata     jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS composer_projects_user_status_idx
  ON public.composer_projects (user_id, status);

CREATE INDEX IF NOT EXISTS composer_projects_user_created_idx
  ON public.composer_projects (user_id, created_at DESC);

ALTER TABLE public.composer_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_composer_projects" ON public.composer_projects;
CREATE POLICY "anon_all_composer_projects" ON public.composer_projects
  FOR ALL TO anon USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
