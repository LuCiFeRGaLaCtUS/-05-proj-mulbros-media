-- Sprint 10 — Catalogue + royalties + settlement parsing
-- 4 tables, all RLS-enforced (user_id = auth.uid()).
-- share_bps in basis points: 5000 = 50%, 10000 = 100%.

CREATE TABLE IF NOT EXISTS public.releases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         text NOT NULL,
  type          text NOT NULL DEFAULT 'single' CHECK (type IN ('single','EP','album','compilation','sync_cue')),
  release_date  date,
  isrc          text,
  upc           text,
  artwork_url   text,
  mux_audio_id  text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_releases_user_id ON public.releases (user_id, release_date DESC NULLS LAST);
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_releases" ON public.releases
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.tracks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id    uuid NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         text NOT NULL,
  duration_sec  integer,
  isrc          text,
  position      integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tracks_release_id ON public.tracks (release_id, position);
CREATE INDEX IF NOT EXISTS idx_tracks_user_id   ON public.tracks (user_id);
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_tracks" ON public.tracks
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.royalty_splits (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id          uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payee_profile_id  uuid REFERENCES public.profiles(id),
  payee_name        text NOT NULL,
  role              text,
  share_bps         integer NOT NULL CHECK (share_bps BETWEEN 0 AND 10000),
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_royalty_splits_track ON public.royalty_splits (track_id);
CREATE INDEX IF NOT EXISTS idx_royalty_splits_user  ON public.royalty_splits (user_id);
ALTER TABLE public.royalty_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_royalty_splits" ON public.royalty_splits
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.royalty_statements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source       text NOT NULL CHECK (source IN ('spotify','apple','youtube','mlc','soundexchange','publisher','sync','distributor','other')),
  period_start date,
  period_end   date,
  gross_usd    numeric(12,2),
  net_usd      numeric(12,2),
  raw_text     text,
  raw_pdf_url  text,
  parsed_json  jsonb DEFAULT '[]'::jsonb,
  anomalies    jsonb DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_royalty_statements_user ON public.royalty_statements (user_id, period_end DESC NULLS LAST);
ALTER TABLE public.royalty_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_royalty_statements" ON public.royalty_statements
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
