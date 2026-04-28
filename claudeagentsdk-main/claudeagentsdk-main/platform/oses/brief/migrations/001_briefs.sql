-- Brief OS owned tables. Lives under oses/brief/migrations/ so dropping
-- the OS from platform.yaml takes its schema with it (via a separate cleanup
-- step — `make migrate` is idempotent and never deletes).

create table if not exists briefs (
    id           uuid primary key default gen_random_uuid(),
    tenant_id    text not null,
    generated_at timestamptz not null default now(),
    sections     jsonb not null default '[]'::jsonb,
    content_md   text,
    emailed_to   text
);

create index if not exists briefs_tenant_idx
    on briefs (tenant_id, generated_at desc);
