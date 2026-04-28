-- Run this ONCE in the Supabase SQL Editor before `make migrate` / `make bootstrap`.
-- It installs the `exec_sql` RPC that our migration runner uses to execute DDL
-- from Python. Security: `security definer` lets it run with the owner's
-- privileges. Only call it from a trusted server-side context using the
-- service role key — never expose to client apps.

create or replace function exec_sql(sql text) returns void
language plpgsql security definer as $$
begin
    execute sql;
end
$$;
