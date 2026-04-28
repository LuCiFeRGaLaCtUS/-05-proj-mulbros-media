SHELL := /bin/bash
PY ?= ../.venv/bin/python
TENANT ?= acme-test
OS_NAME ?= sales

.PHONY: help install preflight migrate bootstrap up cli smoke demo-seed demo-reset

help:
	@echo "Setup:"
	@echo "  make install    — install Python deps into ../.venv"
	@echo "  make preflight  — verify .env, Supabase, Mem0 are reachable"
	@echo "  make migrate    — run SQL migrations against Supabase"
	@echo "  make bootstrap  — migrate + create TENANT + seed budgets + seed goal (idempotent)"
	@echo ""
	@echo "Run:"
	@echo "  make cli        — open the CLI for TENANT=$(TENANT) OS=$(OS_NAME)"
	@echo "  make smoke      — run an end-to-end smoke brief"
	@echo ""
	@echo "Demos:"
	@echo "  make demo-seed  — seed TENANT with demo data"
	@echo "  make demo-reset — wipe TENANT rows"

install:
	$(PY) -m pip install -e . --quiet

preflight:
	$(PY) -m shared.db.preflight

migrate:
	$(PY) -m shared.db.migrate

bootstrap: migrate
	$(PY) -m shared.db.bootstrap --tenant $(TENANT)
	@echo ""
	@$(PY) -m shared.db.preflight

cli:
	$(PY) -m apps.cli --tenant $(TENANT) --os $(OS_NAME)

smoke:
	$(PY) -m apps.cli --tenant $(TENANT) --os $(OS_NAME) --brief "Source 3 leads in UK fintech VP-Sales niche; enrich; score; pass top two to BDR for outreach."

# Skip sourcing — use pre-seeded leads to exercise scoring + BDR + real Gmail
demo-smoke:
	$(PY) -m apps.cli --tenant $(TENANT) --os $(OS_NAME) --brief "Score my enriched leads. Then send outreach to the top 2."

onboard:
	$(PY) -m apps.cli.onboard --tenant $(TENANT) --os $(OS_NAME)

# Meta-OS opportunity digest (Phase 2) — scans events + state, writes reports.
meta-digest:
	$(PY) -m apps.cli.meta_digest --tenant $(TENANT)

# Long-running scheduler — fires meta-digest across all tenants on interval.
# INTERVAL defaults to daily (86400). Override for dev, e.g. INTERVAL=60.
INTERVAL ?= 86400
scheduler:
	$(PY) -m apps.scheduler --interval-seconds $(INTERVAL)

scheduler-once:
	$(PY) -m apps.scheduler --once --verbose

# Phase 2 local web UI — FastAPI + plain HTML at localhost:3000
api:
	$(PY) -m apps.api --reload

# One command for a full local stack: scheduler in background + api in foreground.
# Ctrl-C stops the API; the backgrounded scheduler is left running (kill it with
# `pkill -f apps.scheduler` or quit the terminal).
up:
	@echo "— starting scheduler in background, api in foreground at http://127.0.0.1:3000 —"
	@( $(PY) -m apps.scheduler --interval-seconds 3600 --verbose & ) ; \
	  $(PY) -m apps.api

# Config versioning / rollback — see: make config-help
config-list:
	$(PY) -m apps.cli.config_cmd --tenant $(TENANT) --os $(OS_NAME) list

config-show:
	$(PY) -m apps.cli.config_cmd --tenant $(TENANT) --os $(OS_NAME) show

config-help:
	$(PY) -m apps.cli.config_cmd --tenant $(TENANT) --os $(OS_NAME) --help || true

demo-seed:
	$(PY) -m shared.db.demo_seed --tenant $(TENANT) --clear

# Wipe operational state (leads, outreach, chat, events, alerts, budgets reset)
# but preserve tenant config + audit_events. Prompts before running.
demo-reset:
	$(PY) -m shared.db.demo_reset --tenant $(TENANT)

# Export tenant state to ./snapshots/<tenant>-<ts>.json as a leave-behind.
demo-snapshot:
	$(PY) -m shared.db.demo_snapshot --tenant $(TENANT)
