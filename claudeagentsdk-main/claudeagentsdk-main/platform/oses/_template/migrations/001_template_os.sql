-- Template OS — first migration.
--
-- Replace `template_os` with your OS name throughout this file.
-- Every table has tenant_id. Migrations are append-only and numbered.
-- Never modify a shipped migration; add 002_, 003_, etc.

-- Example table — replace with real ones for your OS.
CREATE TABLE IF NOT EXISTS template_os_things (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     text NOT NULL,
    status        text NOT NULL DEFAULT 'new',
    payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS template_os_things_tenant_status_idx
    ON template_os_things (tenant_id, status);
