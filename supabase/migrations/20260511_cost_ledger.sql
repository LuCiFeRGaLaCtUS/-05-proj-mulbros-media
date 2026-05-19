-- Per-user cost ledger for AI + integration spend tracking
CREATE TABLE IF NOT EXISTS public.cost_ledger (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  endpoint        text NOT NULL,
  provider        text NOT NULL CHECK (provider IN ('openai','anthropic','mux','stripe','docusign','plaid','twilio','firecrawl','apify','resend','other')),
  model           text,
  tokens_in       integer DEFAULT 0,
  tokens_out      integer DEFAULT 0,
  usd_cost        numeric(12,6) NOT NULL DEFAULT 0,
  metadata        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cost_ledger_user_created ON public.cost_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_ledger_provider_created ON public.cost_ledger (provider, created_at DESC);

ALTER TABLE public.cost_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select_cost_ledger" ON public.cost_ledger
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE VIEW public.cost_ledger_today AS
SELECT
  user_id,
  provider,
  SUM(usd_cost)::numeric(12,4) AS total_usd
FROM public.cost_ledger
WHERE created_at >= date_trunc('day', now())
GROUP BY user_id, provider;
