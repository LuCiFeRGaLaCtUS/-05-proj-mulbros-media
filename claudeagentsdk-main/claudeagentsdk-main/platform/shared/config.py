"""Config loader — .env + YAML. Single entry point for all configuration reads.

Resolution order:
    1. Environment variables (loaded from ../.env at startup)
    2. platform/config/platform.yaml (catalog of OSes, defaults)
    3. platform/config/branding.yaml (display brand — optional)
    4. platform/config/tenants/<slug>.yaml (per-tenant: entitled OSes, sandbox)
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv

PLATFORM_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PLATFORM_ROOT.parent
CONFIG_DIR = PLATFORM_ROOT / "config"


def load_env() -> None:
    """Load .env once. Safe to call repeatedly — load_dotenv is idempotent."""
    load_dotenv(REPO_ROOT / ".env")


@lru_cache(maxsize=1)
def platform_yaml() -> dict[str, Any]:
    path = CONFIG_DIR / "platform.yaml"
    if not path.exists():
        return {"oses": {}}
    return yaml.safe_load(path.read_text()) or {"oses": {}}


@lru_cache(maxsize=1)
def branding() -> dict[str, Any]:
    path = CONFIG_DIR / "branding.yaml"
    if not path.exists():
        return {
            "platform_name": "Platform",
            "platform_tagline": "Your AI operations layer",
            "primary_color": "#5DCAA5",
        }
    return yaml.safe_load(path.read_text()) or {}


@lru_cache(maxsize=32)
def tenant_yaml(tenant_id: str) -> dict[str, Any]:
    path = CONFIG_DIR / "tenants" / f"{tenant_id}.yaml"
    if not path.exists():
        raise FileNotFoundError(f"Tenant config not found: {path}")
    data = yaml.safe_load(path.read_text()) or {}
    if data.get("tenant_id") != tenant_id:
        raise ValueError(f"Tenant file {path} declares tenant_id={data.get('tenant_id')!r} but was loaded as {tenant_id!r}")
    return data


def require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Required environment variable {name!r} is not set. See .env.example.")
    return value


# Eager .env load so importers don't each have to remember.
load_env()


# Environment gate. `dev` (default) | `staging` | `prod`. In `prod`, demo/operator
# routes refuse to mount and the server refuses to start if any tenant has
# sandbox.enabled=true (see governance/sandbox.py).
APP_ENV: str = (os.environ.get("APP_ENV") or "dev").strip().lower()


def is_prod() -> bool:
    return APP_ENV == "prod"
