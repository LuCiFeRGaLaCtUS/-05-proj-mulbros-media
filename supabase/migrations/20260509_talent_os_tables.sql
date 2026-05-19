-- ── Talent OS core tables ─────────────────────────────────────────────────────
-- All per-row RLS: user_id = auth.uid()
-- All FK -> profiles(id) ON DELETE CASCADE

-- ── industry_contacts: casting directors, producers, agents, managers, scouts
CREATE TABLE IF NOT EXISTS public.industry_contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            text NOT NULL,
  contact_type    text NOT NULL CHECK (contact_type IN ('casting_director','producer','director','agent','manager','scout','other')),
  email           text,
  phone           text,
  company         text,
  notes           text,
  credits         jsonb DEFAULT '[]'::jsonb,
  last_outreach_at timestamptz,
  reply_rate      numeric(5,2),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_industry_contacts_user_id ON public.industry_contacts (user_id);
CREATE INDEX IF NOT EXISTS idx_industry_contacts_type ON public.industry_contacts (user_id, contact_type);
ALTER TABLE public.industry_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_industry_contacts" ON public.industry_contacts
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── roster: agency's signed talents (lightweight directory)
CREATE TABLE IF NOT EXISTS public.roster (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  talent_name     text NOT NULL,
  email           text,
  phone           text,
  union_status    text CHECK (union_status IN ('SAG-AFTRA','Equity','ACTRA','AFM','Non-union',NULL)),
  disciplines     text[] DEFAULT '{}',
  skills          text[] DEFAULT '{}',
  rates           jsonb DEFAULT '{}'::jsonb,
  availability    text,
  headshot_url    text,
  reel_url        text,
  bio             text,
  imdb_url        text,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','dropped')),
  signed_at       timestamptz NOT NULL DEFAULT now(),
  commission_rate numeric(5,2) DEFAULT 10.00,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_roster_user_id ON public.roster (user_id);
CREATE INDEX IF NOT EXISTS idx_roster_status ON public.roster (user_id, status);
ALTER TABLE public.roster ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_roster" ON public.roster
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── auditions: per-talent submission tracking
CREATE TABLE IF NOT EXISTS public.auditions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  talent_id       uuid REFERENCES public.roster(id) ON DELETE SET NULL,
  project_title   text NOT NULL,
  role_name       text,
  casting_director text,
  audition_type   text CHECK (audition_type IN ('self_tape','in_person','callback','chemistry_read','screen_test')),
  audition_at     timestamptz,
  status          text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','callback','booked','pass','no_response')),
  notes           text,
  attachments     jsonb DEFAULT '[]'::jsonb,
  source          text,
  source_url      text,
  paying_rate     text,
  deadline        timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auditions_user_id ON public.auditions (user_id);
CREATE INDEX IF NOT EXISTS idx_auditions_status ON public.auditions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_auditions_audition_at ON public.auditions (user_id, audition_at);
ALTER TABLE public.auditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_auditions" ON public.auditions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── submissions: agency-side submission tracking (multi-talent per casting)
CREATE TABLE IF NOT EXISTS public.submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  talent_id       uuid REFERENCES public.roster(id) ON DELETE SET NULL,
  casting_director_id uuid REFERENCES public.industry_contacts(id) ON DELETE SET NULL,
  project_title   text NOT NULL,
  role_name       text,
  source          text,
  source_url      text,
  draft_content   text,
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','sent','viewed','responded','no_response')),
  hitl_approved_at timestamptz,
  sent_at         timestamptz,
  viewed_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions (user_id, status);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_submissions" ON public.submissions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── bookings: confirmed work (booked from audition)
CREATE TABLE IF NOT EXISTS public.bookings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  talent_id       uuid REFERENCES public.roster(id) ON DELETE SET NULL,
  audition_id     uuid REFERENCES public.auditions(id) ON DELETE SET NULL,
  project_title   text NOT NULL,
  role_name       text,
  rate            numeric(12,2),
  rate_basis      text CHECK (rate_basis IN ('day','week','project','session','hour')),
  start_date      date,
  end_date        date,
  gross_pay       numeric(12,2),
  net_to_talent   numeric(12,2),
  agency_commission numeric(12,2),
  commission_rate numeric(5,2) DEFAULT 10.00,
  status          text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','in_progress','wrapped','paid','cancelled')),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings (user_id, status);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_bookings" ON public.bookings
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── commissions: agency commission tracker (1-to-1 with booking)
CREATE TABLE IF NOT EXISTS public.commissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id      uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  talent_id       uuid REFERENCES public.roster(id) ON DELETE SET NULL,
  amount_due      numeric(12,2) NOT NULL,
  amount_collected numeric(12,2) DEFAULT 0,
  due_date        date,
  collected_at    timestamptz,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','invoiced','collected','overdue','written_off')),
  invoice_id      uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON public.commissions (user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_due_date ON public.commissions (user_id, due_date);
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_commissions" ON public.commissions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── hitl_approvals: human-in-the-loop approval queue for high-stakes actions
CREATE TABLE IF NOT EXISTS public.hitl_approvals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type     text NOT NULL CHECK (action_type IN ('outbound_email','crm_write','contract_redline','budget_import','stripe_charge','voice_call','calendar_book','other')),
  payload         jsonb NOT NULL,
  preview         text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  decided_at      timestamptz,
  decision_reason text,
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hitl_approvals_user_status ON public.hitl_approvals (user_id, status);
CREATE INDEX IF NOT EXISTS idx_hitl_approvals_expires ON public.hitl_approvals (status, expires_at) WHERE status = 'pending';
ALTER TABLE public.hitl_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_hitl_approvals" ON public.hitl_approvals
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.industry_contacts IS 'Casting directors, producers, agents, managers, scouts — not sales leads.';
COMMENT ON TABLE public.roster IS 'Agency-side: signed talent directory.';
COMMENT ON TABLE public.auditions IS 'Talent-side: per-audition status tracking.';
COMMENT ON TABLE public.submissions IS 'Agency-side: agency-to-casting-director submissions.';
COMMENT ON TABLE public.bookings IS 'Confirmed work from auditions/submissions.';
COMMENT ON TABLE public.commissions IS 'Agency commission receivables tied to bookings.';
COMMENT ON TABLE public.hitl_approvals IS 'Human-in-the-loop approval queue for high-stakes actions.';
