-- Crew job applications — Kanban pipeline for below-the-line film/TV crew
-- Columns: applied_at (submitted date), status (pipeline stage),
--          production_title, role, location, union_status, notes, metadata.
-- References profiles(id) — app uses Stytch not Supabase auth.

CREATE TABLE IF NOT EXISTS public.crew_applications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  production_title text NOT NULL,
  role             text NOT NULL,
  location         text,
  union_status     text,
  status           text DEFAULT 'Applied',
  applied_at       timestamptz DEFAULT now(),
  notes            text,
  metadata         jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS crew_applications_user_status_idx
  ON public.crew_applications (user_id, status);

CREATE INDEX IF NOT EXISTS crew_applications_user_applied_idx
  ON public.crew_applications (user_id, applied_at DESC);

ALTER TABLE public.crew_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_crew_applications" ON public.crew_applications;
CREATE POLICY "anon_all_crew_applications" ON public.crew_applications
  FOR ALL TO anon USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
