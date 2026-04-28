"""Wizard engine — walks a pydantic config schema and produces a step sequence.

A pydantic model like `SalesConfig` is a nested dict of submodels (identity,
icp, pricing, etc.). The engine treats each top-level submodel as a "step"
and each field inside as a widget to render. Field metadata in
`json_schema_extra` drives widget selection, tier (basic/advanced), examples,
and options.

Consumers:
    - wizards/runner_cli.py renders this via CLI widgets.
    - Phase 2 Web UI will render it via JSON-schema-driven React widgets.
"""
from __future__ import annotations

import typing as t
from dataclasses import dataclass, field
from typing import Any, get_args, get_origin

from pydantic import BaseModel

from wizards.widgets.cli import FieldInfo


# ---------------------------------------------------------------------------
# Schema walker
# ---------------------------------------------------------------------------
@dataclass
class Step:
    """One step in the wizard sequence — maps to a top-level submodel."""
    id: str                        # submodel attribute name ("identity", "icp", ...)
    title: str                     # display title
    model: type[BaseModel]
    fields_basic: list[FieldInfo] = field(default_factory=list)
    fields_advanced: list[FieldInfo] = field(default_factory=list)


def _type_str(annotation: Any) -> str:
    """Coarse string type name used for widget selection fallbacks."""
    origin = get_origin(annotation)
    if origin is None:
        if annotation is int:
            return "int"
        if annotation is float:
            return "float"
        if annotation is bool:
            return "bool"
        if annotation is str:
            return "str"
        return str(getattr(annotation, "__name__", annotation))
    if origin is list:
        inner = get_args(annotation)[0] if get_args(annotation) else str
        return f"list[{_type_str(inner)}]"
    if origin is t.Literal:
        return "literal"
    # Union / Optional
    args = [a for a in get_args(annotation) if a is not type(None)]
    if len(args) == 1:
        return _type_str(args[0])
    return "union"


def _literal_options(annotation: Any) -> list[str] | None:
    """Extract Literal['a','b',...] options, including through Optional[Literal[...]]."""
    origin = get_origin(annotation)
    if origin is t.Literal:
        return [str(v) for v in get_args(annotation)]
    # Optional[Literal[...]]
    for inner in get_args(annotation):
        if get_origin(inner) is t.Literal:
            return [str(v) for v in get_args(inner)]
    return None


def _default_widget(type_str: str, options: list[str] | None) -> str:
    if options:
        return "select"
    if type_str.startswith("list["):
        return "tag-list"
    if type_str in ("int", "float"):
        return "number"
    if type_str == "bool":
        return "toggle"
    return "text"


def _walk_fields(model: type[BaseModel]) -> tuple[list[FieldInfo], list[FieldInfo]]:
    basic: list[FieldInfo] = []
    advanced: list[FieldInfo] = []
    for name, f in model.model_fields.items():
        annotation = f.annotation
        options = _literal_options(annotation)
        type_str = _type_str(annotation)
        extra = (f.json_schema_extra or {}) if isinstance(f.json_schema_extra, dict) else {}
        widget = extra.get("widget") or _default_widget(type_str, options)
        tier = extra.get("tier", "basic")
        examples = extra.get("examples")

        # If a field points at another BaseModel, the caller handles it as a nested step.
        if isinstance(annotation, type) and issubclass(annotation, BaseModel):
            continue

        info = FieldInfo(
            name=name,
            title=f.title or name.replace("_", " ").capitalize(),
            help=f.description or "",
            type_=type_str,
            widget=widget,
            required=f.is_required(),
            default=f.default if f.default is not None else (
                f.default_factory() if f.default_factory else None
            ),
            tier=tier,
            options=options or extra.get("options"),
            examples=list(examples) if examples else None,
        )
        (basic if tier == "basic" else advanced).append(info)
    return basic, advanced


def build_steps(config_model: type[BaseModel]) -> list[Step]:
    """Return one Step per top-level submodel. Top-level non-submodel fields
    become a synthetic 'settings' step at the end."""
    steps: list[Step] = []
    top_fields: list[FieldInfo] = []

    for name, f in config_model.model_fields.items():
        ann = f.annotation
        if isinstance(ann, type) and issubclass(ann, BaseModel):
            basic, advanced = _walk_fields(ann)
            steps.append(Step(
                id=name,
                title=f.title or name.replace("_", " ").title(),
                model=ann,
                fields_basic=basic,
                fields_advanced=advanced,
            ))
        else:
            # Promote the field into a synthetic step with one field.
            extra = (f.json_schema_extra or {}) if isinstance(f.json_schema_extra, dict) else {}
            # Resolve default_factory() the same way _walk_fields does — otherwise
            # fields declared with `default_factory=...` ship PydanticUndefined,
            # which json.dumps refuses to serialize.
            from pydantic_core import PydanticUndefined as _Undef
            _default_val: Any = None
            if f.default is not None and f.default is not _Undef:
                _default_val = f.default
            elif f.default_factory:
                try:
                    _default_val = f.default_factory()
                except Exception:
                    _default_val = None
            top_fields.append(FieldInfo(
                name=name,
                title=f.title or name,
                help=f.description or "",
                type_=_type_str(ann),
                widget=extra.get("widget") or _default_widget(_type_str(ann), _literal_options(ann)),
                required=f.is_required(),
                default=_default_val,
                tier=extra.get("tier", "basic"),
                options=_literal_options(ann) or extra.get("options"),
                examples=list(extra["examples"]) if extra.get("examples") else None,
            ))
    if top_fields:
        steps.append(Step(
            id="settings",
            title="Other Settings",
            model=config_model,
            fields_basic=[f for f in top_fields if f.tier == "basic"],
            fields_advanced=[f for f in top_fields if f.tier == "advanced"],
        ))
    return steps
