-- chat_sessions previously had only anon role policy → authenticated users blocked silently.
-- Add ALL policy for authenticated role to match agent_chats pattern.
CREATE POLICY "authed_all_chat_sessions"
  ON public.chat_sessions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
