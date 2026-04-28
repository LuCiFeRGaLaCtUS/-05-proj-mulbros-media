-- Phase 3 chunk 3 — cadence scheduler. Stores pending follow-up touches
-- scheduled by BDR when the first outreach goes out. The scheduler daemon
-- picks up due rows each tick and dispatches them through the orchestrator.

create table if not exists outreach_schedule (
    id             uuid primary key default gen_random_uuid(),
    tenant_id      text not null,
    lead_id        uuid not null,
    cadence_id     uuid not null,                -- groups touches from same first-send
    touch_number   int  not null check (touch_number between 1 and 10),
    pattern        text not null,                 -- 'bump' | 'value' | 'break_up'
    channel        text not null check (channel in ('email','sms','voice')),
    scheduled_for  timestamptz not null,
    status         text not null default 'pending'
                   check (status in ('pending','sent','cancelled','failed')),
    dispatched_at  timestamptz,
    reason         text,                          -- why cancelled/failed, if applicable
    created_at     timestamptz not null default now(),
    -- Cascade deletes when the lead goes away (matches outreach_events behavior)
    constraint outreach_schedule_lead_fk
        foreign key (lead_id) references leads(id) on delete cascade
);

create index if not exists outreach_schedule_due_idx
    on outreach_schedule (scheduled_for)
    where status = 'pending';

create index if not exists outreach_schedule_lead_idx
    on outreach_schedule (tenant_id, lead_id, status);
