"""`apps.cli config ...` — manage OS config versions without a UI.

Subcommands:
    list      — show version history for a tenant+OS
    show      — print the currently-active config
    restore   — flip back to a prior version (linear history preserved)
    pin-prompt — set a prompt_pin (e.g. freeze lead_sourcer at v1 for this tenant)
    unpin-prompt
    pin-skill — set a skill_pin
    unpin-skill

All edits go through shared.db.os_config.save(), so every change is a new
version that can be rolled back.
"""
from __future__ import annotations

import argparse
import json
import sys

from shared import config, logging as plog
from shared.db import os_config as cfgdb


def _cmd_list(args: argparse.Namespace) -> int:
    rows = cfgdb.list_versions(args.tenant, args.os)
    if not rows:
        print(f"(no config versions for {args.tenant}/{args.os})")
        return 0
    print(f"{'v':>3}  {'active':<6}  {'created':<25}  {'by':<12}  note")
    for r in rows:
        act = "●" if r["is_active"] else " "
        print(f"{r['version_number']:>3}  {act:<6}  {r['created_at']:<25}  "
              f"{(r.get('created_by') or '-'):<12}  {r.get('change_note') or ''}")
    return 0


def _cmd_show(args: argparse.Namespace) -> int:
    row = cfgdb.active(args.tenant, args.os)
    if row is None:
        print(f"(no active config for {args.tenant}/{args.os})")
        return 1
    print(f"# {args.tenant} / {args.os}   v{row['version_number']}   "
          f"active since {row['created_at']}")
    print(json.dumps(row["config_json"], indent=2, sort_keys=True))
    return 0


def _cmd_restore(args: argparse.Namespace) -> int:
    try:
        new_row = cfgdb.restore(args.tenant, args.os, args.version,
                                created_by=f"cli:{args.actor or 'operator'}")
    except ValueError as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    print(f"restored {args.tenant}/{args.os} from v{args.version} "
          f"→ new active version v{new_row['version_number']}")
    return 0


def _load_or_empty(args: argparse.Namespace) -> dict:
    row = cfgdb.active(args.tenant, args.os)
    return (row["config_json"] if row else {}) or {}


def _save(cfg: dict, args: argparse.Namespace, note: str) -> None:
    new = cfgdb.save(args.tenant, args.os, cfg, change_note=note,
                     created_by=f"cli:{args.actor or 'operator'}")
    print(f"saved new config version v{new['version_number']}")


def _cmd_pin_prompt(args: argparse.Namespace) -> int:
    cfg = _load_or_empty(args)
    pins = dict(cfg.get("prompt_pins") or {})
    pins[args.agent] = args.version
    cfg["prompt_pins"] = pins
    _save(cfg, args, f"pin prompt {args.agent}=v{args.version}")
    return 0


def _cmd_unpin_prompt(args: argparse.Namespace) -> int:
    cfg = _load_or_empty(args)
    pins = dict(cfg.get("prompt_pins") or {})
    pins.pop(args.agent, None)
    cfg["prompt_pins"] = pins
    _save(cfg, args, f"unpin prompt {args.agent}")
    return 0


def _cmd_pin_skill(args: argparse.Namespace) -> int:
    cfg = _load_or_empty(args)
    pins = dict(cfg.get("skill_pins") or {})
    pins[args.skill] = args.version
    cfg["skill_pins"] = pins
    _save(cfg, args, f"pin skill {args.skill}=v{args.version}")
    return 0


def _cmd_unpin_skill(args: argparse.Namespace) -> int:
    cfg = _load_or_empty(args)
    pins = dict(cfg.get("skill_pins") or {})
    pins.pop(args.skill, None)
    cfg["skill_pins"] = pins
    _save(cfg, args, f"unpin skill {args.skill}")
    return 0


def build_parser(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--tenant", required=True)
    parser.add_argument("--os", dest="os", default="sales")
    parser.add_argument("--actor", default=None, help="Name shown in change log (default: 'operator')")
    sub = parser.add_subparsers(dest="sub", required=True)

    sub.add_parser("list", help="List config version history").set_defaults(func=_cmd_list)
    sub.add_parser("show", help="Show active config").set_defaults(func=_cmd_show)

    p_restore = sub.add_parser("restore", help="Restore a prior version")
    p_restore.add_argument("--version", type=int, required=True)
    p_restore.set_defaults(func=_cmd_restore)

    p_pin = sub.add_parser("pin-prompt", help="Pin a subagent's prompt at a version")
    p_pin.add_argument("--agent", required=True, help="e.g. lead_sourcer")
    p_pin.add_argument("--version", required=True, help="e.g. 1 or 2")
    p_pin.set_defaults(func=_cmd_pin_prompt)

    p_unpin = sub.add_parser("unpin-prompt", help="Remove a prompt pin")
    p_unpin.add_argument("--agent", required=True)
    p_unpin.set_defaults(func=_cmd_unpin_prompt)

    p_pin_s = sub.add_parser("pin-skill", help="Pin a skill at a version")
    p_pin_s.add_argument("--skill", required=True)
    p_pin_s.add_argument("--version", required=True)
    p_pin_s.set_defaults(func=_cmd_pin_skill)

    p_unpin_s = sub.add_parser("unpin-skill", help="Remove a skill pin")
    p_unpin_s.add_argument("--skill", required=True)
    p_unpin_s.set_defaults(func=_cmd_unpin_skill)


def main() -> None:
    config.load_env()
    parser = argparse.ArgumentParser(prog="platform-cli config")
    build_parser(parser)
    args = parser.parse_args()
    sys.exit(args.func(args))


if __name__ == "__main__":
    main()
