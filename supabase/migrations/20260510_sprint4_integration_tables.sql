-- Sprint 4 integration tables — all per-row RLS user_id=auth.uid()

-- ── self_tapes: Mux video uploads metadata
CREATE TABLE IF NOT EXISTS public.self_tapes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  audition_id     uuid REFERENCES public.auditions(id) ON DELETE SET NULL,
  title           text NOT NULL,
  notes           text,
  mux_upload_id   text,
  mux_asset_id    text,
  mux_playback_id text,
  duration_seconds integer,
  status          text NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading','processing','ready','errored')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_self_tapes_user_id ON public.self_tapes (user_id);
CREATE INDEX IF NOT EXISTS idx_self_tapes_audition_id ON public.self_tapes (audition_id) WHERE audition_id IS NOT NULL;
ALTER TABLE public.self_tapes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_self_tapes" ON public.self_tapes
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── income_records: Plaid-synced + manual income for talent tax tracking
CREATE TABLE IF NOT EXISTS public.income_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id      uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  source          text NOT NULL,
  amount          numeric(12,2) NOT NULL,
  currency        text NOT NULL DEFAULT 'USD',
  received_at     date,
  tax_year        integer,
  category        text CHECK (category IN ('w2_session','1099_indie','residual','royalty','holding_fee','voiceover','other')),
  deductible      boolean DEFAULT false,
  notes           text,
  plaid_transaction_id text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_income_records_user_id ON public.income_records (user_id);
CREATE INDEX IF NOT EXISTS idx_income_records_tax_year ON public.income_records (user_id, tax_year);
ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_income_records" ON public.income_records
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── docusign_envelopes: track sent contracts
CREATE TABLE IF NOT EXISTS public.docusign_envelopes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contract_id     uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  envelope_id     text NOT NULL,
  signer_email    text,
  signer_name     text,
  subject         text,
  status          text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','delivered','viewed','signed','completed','declined','voided')),
  sent_at         timestamptz NOT NULL DEFAULT now(),
  signed_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_docusign_envelopes_user_id ON public.docusign_envelopes (user_id);
CREATE INDEX IF NOT EXISTS idx_docusign_envelopes_status ON public.docusign_envelopes (user_id, status);
ALTER TABLE public.docusign_envelopes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_docusign_envelopes" ON public.docusign_envelopes
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
