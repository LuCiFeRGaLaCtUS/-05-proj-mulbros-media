-- Fix Supabase advisor: Security Definer View on public.cost_ledger_today.
-- Default Postgres views run with the creator's privileges (definer), bypassing
-- the base table's RLS. Setting security_invoker=on makes the view execute as
-- the querying user, so the cost_ledger owner_select policy (user_id=auth.uid())
-- is enforced — each user sees only their own cost rows.
ALTER VIEW public.cost_ledger_today SET (security_invoker = on);
