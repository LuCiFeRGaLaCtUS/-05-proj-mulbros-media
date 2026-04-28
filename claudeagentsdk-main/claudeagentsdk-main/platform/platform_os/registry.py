"""OS registry — the platform's catalog of installed OSes.

Loads platform.yaml, imports each enabled OS module, and exposes
`get(name)` for intake/classifier consumers.
"""
from __future__ import annotations

import importlib
from functools import lru_cache

from oses._protocol import OS
from shared import config


@lru_cache(maxsize=1)
def catalog() -> dict[str, OS]:
    """Loads every OS listed in config/platform.yaml."""
    out: dict[str, OS] = {}
    spec = config.platform_yaml().get("oses", {})
    for name, meta in spec.items():
        if meta.get("status") == "roadmap":
            continue
        module_path = meta.get("module") or f"oses.{name}"
        module = importlib.import_module(module_path)
        os_instance = getattr(module, "OS_INSTANCE", None)
        if os_instance is None:
            raise RuntimeError(
                f"OS module {module_path} does not expose OS_INSTANCE — "
                f"add one in {module_path.replace('.', '/')}/__init__.py"
            )
        out[name] = os_instance
    return out


def get(name: str) -> OS:
    try:
        return catalog()[name]
    except KeyError as e:
        available = ", ".join(sorted(catalog().keys())) or "<none>"
        raise KeyError(f"OS {name!r} is not registered. Available: {available}") from e


def names() -> list[str]:
    return sorted(catalog().keys())
