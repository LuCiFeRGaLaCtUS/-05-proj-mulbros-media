create extension if not exists "pgcrypto";

create table if not exists leads (
    id uuid primary key default gen_random_uuid(),
    name text,
    email text,
    phone text,
    title text,
    company text,
    company_domain text,
    company_size text,
    company_revenue text,
    industry text,
    location text,
    tech_stack text[],
    linkedin_url text,
    source text,
    status text not null default 'new',
    score int,
    score_rationale text,
    enrichment jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists leads_status_idx on leads (status);
create index if not exists leads_score_idx on leads (score desc nulls last);

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists leads_updated_at on leads;
create trigger leads_updated_at
    before update on leads
    for each row execute function touch_updated_at();
