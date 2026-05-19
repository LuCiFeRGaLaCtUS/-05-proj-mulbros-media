-- Ensure Plaid transaction sync is idempotent — unique constraint enables
-- PostgREST `resolution=merge-duplicates` on /rest/v1/income_records.
CREATE UNIQUE INDEX IF NOT EXISTS ux_income_records_plaid_txn
  ON public.income_records (plaid_transaction_id)
  WHERE plaid_transaction_id IS NOT NULL;
