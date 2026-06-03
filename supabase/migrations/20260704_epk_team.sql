-- Sprint 11 — EPK kits (public/share) + Team chat (Realtime).

CREATE TABLE IF NOT EXISTS public.epk_kits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug            text NOT NULL UNIQUE,
  display_name    text,
  tagline         text,
  bio_md          text,
  hero_image_url  text,
  reel_mux_id     text,
  press_quotes    jsonb DEFAULT '[]'::jsonb,
  contact_email   text,
  public          boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_epk_kits_user ON public.epk_kits (user_id);
ALTER TABLE public.epk_kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_epk_kits" ON public.epk_kits
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "anon_read_published_epk" ON public.epk_kits
  FOR SELECT TO anon USING (public = true);

CREATE TABLE IF NOT EXISTS public.team_channels (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         text NOT NULL,
  type         text NOT NULL DEFAULT 'group' CHECK (type IN ('dm','group')),
  member_ids   uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_team_channels_members ON public.team_channels USING GIN (member_ids);
ALTER TABLE public.team_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_read_channels" ON public.team_channels
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = ANY (member_ids));
CREATE POLICY "owner_write_channels" ON public.team_channels
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.team_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id   uuid NOT NULL REFERENCES public.team_channels(id) ON DELETE CASCADE,
  sender_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body         text NOT NULL,
  attachments  jsonb DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_team_messages_channel ON public.team_messages (channel_id, created_at);
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_rw_messages" ON public.team_messages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_channels c
      WHERE c.id = team_messages.channel_id
        AND (auth.uid() = c.owner_id OR auth.uid() = ANY (c.member_ids))
    )
  )
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.team_channels c
      WHERE c.id = team_messages.channel_id
        AND (auth.uid() = c.owner_id OR auth.uid() = ANY (c.member_ids))
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
