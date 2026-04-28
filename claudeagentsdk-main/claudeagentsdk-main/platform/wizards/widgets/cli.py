"""CLI widgets for the wizard engine.

Each widget is a callable that prompts the user and returns the typed value.
Signature: widget(field_info, current_value) -> value

Widgets here are the CLI renditions. Phase 2's Web UI consumes the SAME schema
through react-jsonschema-form (or similar) — widgets differ but the contract
(schema → collected value) is preserved.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable


@dataclass
class FieldInfo:
    name: str            # pydantic field name (e.g. "titles")
    title: str           # human label
    help: str            # description text
    type_: str           # "str" | "int" | "float" | "bool" | "list[str]" | "literal"
    widget: str          # "text" | "select" | "multi-select" | "tag-list" | "number" | "toggle" | "url" | "link-list" | "image-upload" | "voice-record"
    required: bool
    default: Any
    tier: str = "basic"  # "basic" | "advanced"
    options: list[str] | None = None    # for select / multi-select
    examples: list[Any] | None = None   # hints


def _prompt(label: str, default_display: str | None = None) -> str:
    suffix = f"  [{default_display}]" if default_display else ""
    try:
        return input(f"  {label}{suffix}: ").strip()
    except EOFError:
        return ""


def w_text(f: FieldInfo, current: Any) -> Any:
    default_display = str(current) if current not in (None, "") else (
        f"e.g. {f.examples[0]}" if f.examples else ("required" if f.required else "optional")
    )
    val = _prompt(f.title, default_display)
    return val or current


def w_url(f: FieldInfo, current: Any) -> Any:
    return w_text(f, current)


def w_image_upload(f: FieldInfo, current: Any) -> Any:
    """CLI fallback: accept a file path or URL."""
    default_display = current or "paste path or URL, blank to skip"
    val = _prompt(f"{f.title} (image path/URL)", default_display)
    return val or current


def w_voice_record(f: FieldInfo, current: Any) -> Any:
    """CLI fallback: accept a file path or URL (recording happens in Web UI)."""
    default_display = current or "paste audio path/URL, blank to skip"
    val = _prompt(f"{f.title} (audio path/URL — recording is Web UI only)", default_display)
    return val or current


def w_number(f: FieldInfo, current: Any) -> Any:
    default_display = str(current) if current not in (None, "") else (
        f"e.g. {f.examples[0]}" if f.examples else ""
    )
    while True:
        val = _prompt(f.title, default_display)
        if not val:
            return current
        try:
            return int(val) if f.type_ == "int" else float(val)
        except ValueError:
            print(f"    → needs to be a {f.type_}, try again")


def w_toggle(f: FieldInfo, current: Any) -> Any:
    default_display = "y" if current else "n"
    while True:
        val = _prompt(f"{f.title} (y/n)", default_display).lower()
        if not val:
            return bool(current)
        if val in ("y", "yes", "true", "1"):
            return True
        if val in ("n", "no", "false", "0"):
            return False


def w_select(f: FieldInfo, current: Any) -> Any:
    opts = f.options or []
    if not opts:
        return w_text(f, current)
    print(f"  {f.title}  (choose one)")
    for i, opt in enumerate(opts, 1):
        marker = " (current)" if opt == current else ""
        print(f"    [{i}] {opt}{marker}")
    while True:
        val = _prompt("Pick number or type value", str(opts.index(current) + 1) if current in opts else "")
        if not val:
            return current
        if val.isdigit() and 1 <= int(val) <= len(opts):
            return opts[int(val) - 1]
        if val in opts:
            return val
        print(f"    → not a valid choice, try again")


def w_multi_select(f: FieldInfo, current: Any) -> Any:
    opts = f.options or []
    cur = list(current or [])
    if not opts:
        return w_tag_list(f, current)
    print(f"  {f.title}  (multi — comma-separated numbers or values)")
    for i, opt in enumerate(opts, 1):
        marker = " ✓" if opt in cur else ""
        print(f"    [{i}] {opt}{marker}")
    default_display = ",".join(str(opts.index(x) + 1) for x in cur if x in opts)
    val = _prompt("Pick", default_display or "e.g. 1,3")
    if not val:
        return cur
    chosen: list[str] = []
    for token in val.split(","):
        token = token.strip()
        if token.isdigit() and 1 <= int(token) <= len(opts):
            chosen.append(opts[int(token) - 1])
        elif token in opts:
            chosen.append(token)
    return chosen


def w_tag_list(f: FieldInfo, current: Any) -> Any:
    """Accept a comma-separated list of free-text tags."""
    cur = list(current or [])
    default_display = ", ".join(cur) if cur else (
        ", ".join(f.examples[:3]) if f.examples else "comma-separated"
    )
    val = _prompt(f"{f.title} (comma-separated)", default_display)
    if not val:
        return cur
    return [t.strip() for t in val.split(",") if t.strip()]


def w_link_list(f: FieldInfo, current: Any) -> Any:
    """Like tag-list, but expects URLs or file paths. One per line until blank."""
    cur = list(current or [])
    if cur:
        print(f"  {f.title}  (current: {len(cur)} item(s))")
        for i, item in enumerate(cur, 1):
            print(f"    [{i}] {item}")
    else:
        print(f"  {f.title}  (paste links/paths one per line, blank to finish)")
    added: list[str] = list(cur)
    while True:
        try:
            line = input("    > ").strip()
        except EOFError:
            break
        if not line:
            break
        added.append(line)
    return added


# Registry — engine looks up widgets by their `widget` key.
REGISTRY: dict[str, Callable[[FieldInfo, Any], Any]] = {
    "text":         w_text,
    "url":          w_url,
    "number":       w_number,
    "toggle":       w_toggle,
    "select":       w_select,
    "multi-select": w_multi_select,
    "tag-list":     w_tag_list,
    "link-list":    w_link_list,
    "image-upload": w_image_upload,
    "voice-record": w_voice_record,
}
