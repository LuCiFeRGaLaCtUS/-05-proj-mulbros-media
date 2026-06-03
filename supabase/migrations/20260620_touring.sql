-- Sprint 9 — Touring + events module
-- Per-row RLS (user_id = auth.uid()) across all 3 tables.

CREATE TABLE IF NOT EXISTS public.tours (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        text NOT NULL,
  status      text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','active','complete','cancelled')),
  start_date  date,
  end_date    date,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tours_user_id ON public.tours (user_id, created_at DESC);
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_tours" ON public.tours
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.shows (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tour_id       uuid REFERENCES public.tours(id) ON DELETE SET NULL,
  venue_name    text NOT NULL,
  city          text,
  country       text,
  show_date     timestamptz,
  status        text NOT NULL DEFAULT 'hold' CHECK (status IN ('hold','confirmed','cancelled','complete')),
  capacity      integer,
  gross_offer   numeric(12,2),
  deal_terms    jsonb DEFAULT '{}'::jsonb,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shows_user_id ON public.shows (user_id, show_date);
CREATE INDEX IF NOT EXISTS idx_shows_tour_id ON public.shows (tour_id) WHERE tour_id IS NOT NULL;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_shows" ON public.shows
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.show_logistics (
  show_id     uuid PRIMARY KEY REFERENCES public.shows(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doors_at    timestamptz,
  soundcheck  timestamptz,
  set_time    timestamptz,
  hotel       text,
  transport   text,
  contacts    jsonb DEFAULT '{}'::jsonb,
  notes       text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.show_logistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_show_logistics" ON public.show_logistics
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
