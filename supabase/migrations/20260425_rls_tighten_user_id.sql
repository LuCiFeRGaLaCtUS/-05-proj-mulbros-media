-- ─────────────────────────────────────────────────────────────────────────────
-- RLS hardening: drop permissive anon/authed policies, replace with
-- per-row `user_id = auth.uid()` enforcement. Requires Stytch -> Supabase JWT
-- bridge (see /api/auth/supabase-token + useSupabaseSession hook).
--
-- Policy model:
--   - All tables: authenticated only, USING + WITH CHECK match user_id column
--   - profiles, user_settings: id IS the user_id (no separate column)
--   - team_invites: inviter_id is the owner column
--   - anon role: NO DML access (was full read/write — closes anon-key public access)
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper: drop all existing policies on each target table, then recreate strict.
DO $$
DECLARE
  r RECORD;
  tables TEXT[] := ARRAY[
    'actor_submissions','agent_chats','artist_artworks','artsorg_grants',
    'calendar_posts','chat_sessions','composer_projects','contracts',
    'crew_applications','film_pipeline','invoices','music_pipeline',
    'notifications','payments','profiles','screenwriter_scripts',
    'team_invites','user_activity','user_integrations','user_roles',
    'user_settings','writer_queries'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR r IN
      SELECT polname FROM pg_policy
      WHERE polrelid = ('public.' || t)::regclass
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.polname, t);
    END LOOP;
  END LOOP;
END $$;

-- ── Tables keyed by user_id (uuid) ───────────────────────────────────────────
CREATE POLICY "owner_all_actor_submissions"   ON public.actor_submissions   FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_agent_chats"         ON public.agent_chats         FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_artist_artworks"     ON public.artist_artworks     FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_artsorg_grants"      ON public.artsorg_grants      FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_calendar_posts"      ON public.calendar_posts      FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_chat_sessions"       ON public.chat_sessions       FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_composer_projects"   ON public.composer_projects   FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_contracts"           ON public.contracts           FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_crew_applications"   ON public.crew_applications   FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_film_pipeline"       ON public.film_pipeline       FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_invoices"            ON public.invoices            FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_music_pipeline"      ON public.music_pipeline      FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_notifications"       ON public.notifications       FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_payments"            ON public.payments            FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_screenwriter_scripts" ON public.screenwriter_scripts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_user_activity"       ON public.user_activity       FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_user_integrations"   ON public.user_integrations   FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_user_roles"          ON public.user_roles          FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_all_writer_queries"      ON public.writer_queries      FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── Tables where id IS the user identity ─────────────────────────────────────
CREATE POLICY "owner_all_profiles"      ON public.profiles      FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "owner_all_user_settings" ON public.user_settings FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ── team_invites: owned by inviter ───────────────────────────────────────────
CREATE POLICY "inviter_all_team_invites" ON public.team_invites FOR ALL TO authenticated USING (inviter_id = auth.uid()) WITH CHECK (inviter_id = auth.uid());

-- ── SECURITY DEFINER functions: revoke from anon, restrict to authenticated ──
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
-- handle_new_user runs on auth.users insert trigger; no app caller needs RPC.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
