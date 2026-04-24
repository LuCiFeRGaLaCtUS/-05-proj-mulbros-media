-- Back-office layer — invoices, contracts, payments.
-- All reference profiles(id). RLS permissive at DB; app filters by user_id (Stytch at server edge).

CREATE TABLE IF NOT EXISTS public.invoices (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_name  text NOT NULL,
  project      text,
  line_items   jsonb DEFAULT '[]'::jsonb,
  total        numeric DEFAULT 0,
  status       text DEFAULT 'Draft',  -- Draft | Sent | Viewed | Paid | Overdue
  due_date     date,
  notes        text,
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoices_user_status_idx ON public.invoices (user_id, status);

CREATE TABLE IF NOT EXISTS public.contracts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project        text NOT NULL,
  client         text,
  contract_type  text,  -- Flat Fee | Royalty | Revenue Share | Work for Hire | License
  value          numeric,
  signed_date    date,
  expiry_date    date,
  status         text DEFAULT 'Pending Signature',  -- Pending Signature | Active | Completed | Expired
  file_url       text,
  notes          text,
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contracts_user_status_idx ON public.contracts (user_id, status);
CREATE INDEX IF NOT EXISTS contracts_user_expiry_idx ON public.contracts (user_id, expiry_date);

CREATE TABLE IF NOT EXISTS public.payments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source         text NOT NULL,  -- Film Project | Sync Placement | Session Work | Grant | Gig | Royalty | Other
  amount         numeric NOT NULL,
  received_date  date NOT NULL,
  notes          text,
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_user_received_idx ON public.payments (user_id, received_date DESC);

ALTER TABLE public.invoices  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_invoices"  ON public.invoices;
DROP POLICY IF EXISTS "anon_all_contracts" ON public.contracts;
DROP POLICY IF EXISTS "anon_all_payments"  ON public.payments;

CREATE POLICY "anon_all_invoices"  ON public.invoices  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_contracts" ON public.contracts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_payments"  ON public.payments  FOR ALL TO anon USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
