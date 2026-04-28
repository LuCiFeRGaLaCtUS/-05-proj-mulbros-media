"""Serialize the wizard engine's Step sequence into JSON for the web UI.

The same `Step[]` that wizards/runner_cli.py consumes gets turned into a
plain-dict tree the browser renders. Keeps one source of truth: pydantic
schema → engine.Step → (CLI widgets) or (JSON → React/HTML widgets).

The JSON shape is deliberately small:

    {
      "os_name": "sales",
      "title":   "Sales OS",
      "current_values": {...},        # existing config for edit mode (or {})
      "active_version": 3 | null,
      "steps": [
        {
          "id": "identity", "title": "Identity",
          "fields_basic":    [FieldSpec, ...],
          "fields_advanced": [FieldSpec, ...]
        },
        ...
      ]
    }

Where FieldSpec =
    {
      "name":     "display_name",
      "title":    "What should we call this workspace?",
      "help":     "...",
      "widget":   "text" | "number" | "toggle" | "select" | "multi-select"
                | "tag-list" | "link-list" | "url"
                | "image-upload" | "voice-record",
      "type":     "str" | "int" | "float" | "bool" | "list[str]" | "literal",
      "required": bool,
      "default":  any | null,
      "tier":     "basic" | "advanced",
      "options":  [..] | null,
      "examples": [..] | null
    }
"""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from wizards.engine import FieldInfo, Step, build_steps


def _field_to_dict(f: FieldInfo) -> dict[str, Any]:
    return {
        "name":     f.name,
        "title":    f.title,
        "help":     f.help or "",
        "widget":   f.widget,
        "type":     f.type_,
        "required": f.required,
        "default":  f.default,
        "tier":     f.tier,
        "options":  f.options,
        "examples": f.examples,
    }


def _step_to_dict(s: Step) -> dict[str, Any]:
    return {
        "id":              s.id,
        "title":           s.title,
        "fields_basic":    [_field_to_dict(f) for f in s.fields_basic],
        "fields_advanced": [_field_to_dict(f) for f in s.fields_advanced],
    }


def serialize_schema(
    os_name: str,
    os_title: str,
    config_model: type[BaseModel],
    current_values: dict[str, Any] | None = None,
    active_version: int | None = None,
) -> dict[str, Any]:
    return {
        "os_name":        os_name,
        "title":          os_title,
        "current_values": current_values or {},
        "active_version": active_version,
        "steps":          [_step_to_dict(s) for s in build_steps(config_model)],
    }
