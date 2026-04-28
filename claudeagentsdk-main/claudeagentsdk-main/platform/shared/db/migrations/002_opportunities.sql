-- Meta-OS opportunity reports. Two audiences:
--   'customer' — shown to the tenant user in the relevant OS's chat
--   'operator' — shown to the platform operator (you) as pitch reports for
--                non-entitled OSes, or cross-OS patterns worth knowing.

create table if not exists opportunity_reports (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       text not null,
    os_name         text,                -- null for cross-OS/platform reports
    audience        text not null check (audience in ('customer','operator')),
    pattern         text not null,       -- e.g. 'pipeline_gap', 'stale_contacted'
    severity        text not null check (severity in ('info','opportunity','warning')),
    headline        text not null,
    body            text,
    payload         jsonb not null default '{}'::jsonb,
    created_at      timestamptz not null default now(),
    acknowledged_at timestamptz
);

create index if not exists opp_tenant_audience_idx
    on opportunity_reports (tenant_id, audience, created_at desc)
    where acknowledged_at is null;

create index if not exists opp_pattern_idx
    on opportunity_reports (pattern, created_at desc);
