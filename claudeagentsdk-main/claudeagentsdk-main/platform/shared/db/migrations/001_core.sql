-- Core platform tables — tenant-aware from day one.
-- Every table carries tenant_id (slug). RLS scaffolded as trivially-permissive;
-- hardened in Phase 4 when multi-tenant deploy happens.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tenants
-- ---------------------------------------------------------------------------
create table if not exists tenants (
    tenant_id       text primary key,
    display_name    text not null,
    locale          text not null default 'en-US',
    timezone        text not null default 'UTC',
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- OS configs — append-only versioning. Latest is_active=true is current.
-- ---------------------------------------------------------------------------
create table if not exists os_config_versions (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       text not null references tenants(tenant_id) on delete cascade,
    os_name         text not null,
    version_number  int  not null,
    config_json     jsonb not null,
    change_note     text,
    created_by      text,
    created_at      timestamptz not null default now(),
    is_active       boolean not null default false
);
create index if not exists os_config_versions_active_idx
    on os_config_versions (tenant_id, os_name)
    where is_active;
create unique index if not exists os_config_versions_number_uniq
    on os_config_versions (tenant_id, os_name, version_number);

-- ---------------------------------------------------------------------------
-- Chat sessions + messages
-- ---------------------------------------------------------------------------
create table if not exists chat_sessions (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       text not null references tenants(tenant_id) on delete cascade,
    os_name         text not null,           -- or 'platform' for platform-level chat
    title           text,
    created_at      timestamptz not null default now(),
    last_active_at  timestamptz not null default now()
);
create index if not exists chat_sessions_tenant_os_idx
    on chat_sessions (tenant_id, os_name, last_active_at desc);

create table if not exists chat_messages (
    id              uuid primary key default gen_random_uuid(),
    session_id      uuid not null references chat_sessions(id) on delete cascade,
    tenant_id       text not null,            -- denormalized for tenant filter
    role            text not null check (role in ('user','assistant','system','tool')),
    content         text,
    attachments     jsonb not null default '[]'::jsonb,
    created_at      timestamptz not null default now()
);
create index if not exists chat_messages_session_idx
    on chat_messages (session_id, created_at);

-- ---------------------------------------------------------------------------
-- HITL requests — paired with a chat message when the agent needs input
-- ---------------------------------------------------------------------------
create table if not exists hitl_requests (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       text not null,
    session_id      uuid references chat_sessions(id) on delete cascade,
    message_id      uuid references chat_messages(id) on delete cascade,
    schema_name     text not null,
    schema_json     jsonb not null,
    context_json    jsonb not null default '{}'::jsonb,
    status          text not null default 'pending'
                    check (status in ('pending','answered','cancelled')),
    answer_json     jsonb,
    created_at      timestamptz not null default now(),
    answered_at     timestamptz
);

-- ---------------------------------------------------------------------------
-- Audit events — one row per @governed tool call
-- ---------------------------------------------------------------------------
create table if not exists audit_events (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       text not null,
    run_id          uuid not null,
    os_name         text,
    agent_name      text,
    tool_name       text not null,
    args_hash       text,
    result_hash     text,
    policy_decision text not null,     -- 'allow' | 'deny' | 'deferred'
    policy_reason   text,
    token_id        text,               -- stytch agent token id (stub in Phase 0)
    version_manifest jsonb,             -- prompts/skills/config versions used
    cost_usd        numeric(10,6),
    latency_ms      int,
    resource_key    text,               -- billable resource consumed (if any)
    units_consumed  numeric(12,4),
    sandbox         boolean not null default false,
    ts              timestamptz not null default now()
);
create index if not exists audit_events_tenant_ts_idx
    on audit_events (tenant_id, ts desc);
create index if not exists audit_events_run_idx
    on audit_events (run_id);

-- ---------------------------------------------------------------------------
-- OS events — the event bus meta-OS reads from
-- ---------------------------------------------------------------------------
create table if not exists os_events (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       text not null,
    os_name         text not null,
    event_type      text not null,      -- e.g. 'lead.sourced', 'outreach.sent'
    payload         jsonb not null default '{}'::jsonb,
    agent_name      text,
    ts              timestamptz not null default now()
);
create index if not exists os_events_tenant_type_ts_idx
    on os_events (tenant_id, event_type, ts desc);

-- ---------------------------------------------------------------------------
-- External budgets — caps on external services (Apollo credits, SMS sends…)
-- ---------------------------------------------------------------------------
create table if not exists external_budgets (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       text not null,
    os_name         text not null,
    resource_key    text not null,       -- 'apollo_credits', 'gmail_sends', 'twilio_sms'
    period          text not null check (period in ('day','week','month')),
    period_start    date not null,
    period_end      date not null,
    limit_value     numeric(12,4) not null,
    consumed        numeric(12,4) not null default 0,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);
create unique index if not exists external_budgets_active_uniq
    on external_budgets (tenant_id, os_name, resource_key, period_start);

-- ---------------------------------------------------------------------------
-- Goals — north-star metrics per OS, per period
-- ---------------------------------------------------------------------------
create table if not exists goals (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       text not null,
    os_name         text not null,
    metric_name     text not null,       -- 'new_leads', 'qualified_trials', 'new_mrr_usd'
    target_value    numeric(14,4) not null,
    current_value   numeric(14,4) not null default 0,
    period          text not null check (period in ('day','week','month','quarter')),
    period_start    date not null,
    period_end      date not null,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);
create unique index if not exists goals_active_uniq
    on goals (tenant_id, os_name, metric_name, period_start);

-- ---------------------------------------------------------------------------
-- Pace state — derived, updated by scheduler or on-read
-- ---------------------------------------------------------------------------
create table if not exists pace_state (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       text not null,
    os_name         text not null,
    metric_name     text not null,
    status          text not null check (status in ('ahead','on_pace','behind','at_risk','over_budget')),
    ideal_pace_per_day numeric(14,4),
    projected_final  numeric(14,4),
    computed_at     timestamptz not null default now()
);
create index if not exists pace_state_tenant_idx
    on pace_state (tenant_id, os_name, metric_name, computed_at desc);

-- ---------------------------------------------------------------------------
-- Variance alerts — "you're behind / near-cap / over-budget" notifications
-- ---------------------------------------------------------------------------
create table if not exists variance_alerts (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       text not null,
    os_name         text not null,
    alert_type      text not null,       -- 'behind_goal' | 'near_budget_cap' | 'over_budget'
    severity        text not null check (severity in ('info','warn','critical')),
    message         text not null,
    payload         jsonb not null default '{}'::jsonb,
    acked_at        timestamptz,
    created_at      timestamptz not null default now()
);
create index if not exists variance_alerts_tenant_idx
    on variance_alerts (tenant_id, created_at desc) where acked_at is null;

-- ---------------------------------------------------------------------------
-- updated_at touch trigger (shared)
-- ---------------------------------------------------------------------------
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

do $$
declare
    t text;
begin
    for t in select unnest(array['tenants','external_budgets','goals']) loop
        execute format('drop trigger if exists %I_updated_at on %I', t, t);
        execute format('create trigger %I_updated_at before update on %I '
                       'for each row execute function touch_updated_at()', t, t);
    end loop;
end $$;
