-- Sales OS owned tables. Lives under oses/sales/migrations/ so moving
-- or disabling the OS takes its schema with it.

-- ---------------------------------------------------------------------------
-- Legacy rename: if a pre-platform `leads` table exists without `tenant_id`,
-- rename it to `leads_legacy` so we can create the new tenant-aware one
-- without losing any historical rows. Safe no-op if there's no legacy table.
-- ---------------------------------------------------------------------------
do $$
begin
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'leads' and column_name = 'id'
    ) and not exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'leads' and column_name = 'tenant_id'
    ) then
        alter table leads rename to leads_legacy;
    end if;
end $$;

-- ---------------------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------------------
create table if not exists leads (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       text not null,
    name            text,
    email           text,
    phone           text,
    title           text,
    company         text,
    company_domain  text,
    company_size    text,
    company_revenue text,
    industry        text,
    location        text,
    tech_stack      text[],
    linkedin_url    text,
    source          text,
    status          text not null default 'new'
                    check (status in ('new','enriched','scored','contacted','replied','disqualified','meeting_booked')),
    score           int,
    score_rationale text,
    enrichment      jsonb not null default '{}'::jsonb,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);
create index if not exists leads_tenant_status_idx on leads (tenant_id, status);
create index if not exists leads_tenant_score_idx  on leads (tenant_id, score desc nulls last);

-- ---------------------------------------------------------------------------
-- Outreach log — every email/SMS/call the BDR sends
-- ---------------------------------------------------------------------------
create table if not exists outreach_events (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       text not null,
    lead_id         uuid references leads(id) on delete cascade,
    channel         text not null check (channel in ('email','sms','voice')),
    direction       text not null check (direction in ('outbound','inbound')),
    subject         text,
    body            text,
    original_target text,                -- the actual lead address (before sandbox)
    dispatched_to   text,                -- where it was sent (sandbox redirect target if sandbox)
    sandbox         boolean not null default false,
    provider_id     text,                -- Gmail message_id, Twilio sid, etc.
    status          text not null default 'sent',
    ts              timestamptz not null default now()
);
create index if not exists outreach_events_tenant_lead_idx
    on outreach_events (tenant_id, lead_id, ts desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger for leads (reuse the platform-level function)
-- ---------------------------------------------------------------------------
drop trigger if exists leads_updated_at on leads;
create trigger leads_updated_at before update on leads
    for each row execute function touch_updated_at();
