"""CLI wizard runner — iterates the Step sequence and renders each field.

Progressive disclosure: for each step, prompt basic fields first; then ask
'show advanced settings?' and optionally render advanced fields too.

Edit mode: if an existing config is passed, its values become each field's
"current" so users can Enter-through to keep what's there.
"""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ValidationError

from wizards.engine import Step, build_steps
from wizards.widgets.cli import REGISTRY, FieldInfo


def _render_field(f: FieldInfo, current: Any) -> Any:
    widget = REGISTRY.get(f.widget)
    if widget is None:
        print(f"  (unknown widget {f.widget!r} for {f.name}; skipping)")
        return current
    if f.help:
        print(f"  ℹ {f.help}")
    return widget(f, current)


def _yesno(label: str, default_yes: bool = False) -> bool:
    suffix = "Y/n" if default_yes else "y/N"
    try:
        val = input(f"\n{label} ({suffix}) ").strip().lower()
    except EOFError:
        return default_yes
    if not val:
        return default_yes
    return val in ("y", "yes", "true", "1")


def _apply_to_dict(target: dict[str, Any], key: str, value: Any) -> None:
    target[key] = value


def _render_step(step: Step, existing: dict[str, Any]) -> dict[str, Any]:
    print(f"\n━━━ {step.title} ━━━")
    step_cur = dict(existing.get(step.id) or {})
    collected: dict[str, Any] = dict(step_cur)

    for f in step.fields_basic:
        collected[f.name] = _render_field(f, step_cur.get(f.name, f.default))

    if step.fields_advanced and _yesno("Show advanced settings for this section?", default_yes=False):
        for f in step.fields_advanced:
            collected[f.name] = _render_field(f, step_cur.get(f.name, f.default))

    return collected


def run(
    config_model: type[BaseModel],
    existing: dict[str, Any] | None = None,
) -> tuple[BaseModel, dict[str, Any]]:
    """Run the full wizard over `config_model`. Returns (validated instance, raw dict)."""
    existing = existing or {}
    steps = build_steps(config_model)
    print(f"\nOnboarding — {len(steps)} steps. Enter to keep defaults; Ctrl-C to cancel.\n")

    assembled: dict[str, Any] = dict(existing)
    for step in steps:
        step_value = _render_step(step, assembled)
        assembled[step.id] = step_value

    # Validate via pydantic. If the user left required fields blank, surface
    # the validation errors and re-prompt for that step.
    while True:
        try:
            instance = config_model(**assembled)
            return instance, assembled
        except ValidationError as e:
            print("\n Some fields need attention:")
            # Collect the field paths that failed.
            failing_roots: set[str] = set()
            for err in e.errors():
                loc = err.get("loc") or ()
                root = str(loc[0]) if loc else ""
                msg = err.get("msg", "")
                print(f"   - {'.'.join(str(p) for p in loc)}: {msg}")
                if root:
                    failing_roots.add(root)
            print("")
            if not _yesno("Re-prompt those sections?", default_yes=True):
                raise
            for step in steps:
                if step.id in failing_roots:
                    assembled[step.id] = _render_step(step, assembled)
