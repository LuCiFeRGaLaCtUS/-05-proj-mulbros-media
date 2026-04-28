"""Mem0 client — namespaced by tenant + scope.

Conventions:
    user_id = f"{tenant_id}:{scope}"
    scope ∈ {"platform", f"os:{os_name}", f"agent:{agent_name}"}

Using filters={"user_id": ...} on search (mem0ai v2 API).
"""
from __future__ import annotations

from functools import lru_cache
from typing import Any

from mem0 import MemoryClient

from shared import config


@lru_cache(maxsize=1)
def client() -> MemoryClient:
    config.load_env()
    return MemoryClient(api_key=config.require_env("MEM0_API_KEY"))


def _user_id(tenant_id: str, scope: str) -> str:
    return f"{tenant_id}:{scope}"


def remember(tenant_id: str, scope: str, content: str, category: str = "general") -> None:
    client().add(
        messages=[{"role": "user", "content": content}],
        user_id=_user_id(tenant_id, scope),
        metadata={"category": category, "tenant_id": tenant_id, "scope": scope},
    )


def recall(tenant_id: str, scope: str, query: str, limit: int = 5) -> list[str]:
    result: Any = client().search(
        query=query,
        filters={"user_id": _user_id(tenant_id, scope)},
        limit=limit,
    )
    items = result.get("results", result) if isinstance(result, dict) else result
    if not items:
        return []
    out: list[str] = []
    for r in items:
        if isinstance(r, dict):
            out.append(str(r.get("memory", r)))
        else:
            out.append(str(r))
    return out
