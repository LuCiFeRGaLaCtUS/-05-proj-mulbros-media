"""Skills registry loader.

Reads every skills/*.md in the platform and in each OS's skills/ directory.
Indexes by (name, version). Agents reference skills by name in prompts;
the loader splices their markdown body into the system prompt at build time.
"""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import yaml


PLATFORM_ROOT = Path(__file__).resolve().parents[1]
GLOBAL_SKILLS_DIR = PLATFORM_ROOT / "skills"


@dataclass
class Skill:
    name: str
    version: str
    description: str
    applies_to: list[str]
    body: str
    path: Path


def _parse(path: Path) -> Skill | None:
    if path.name.startswith("_"):
        return None
    text = path.read_text()
    if not text.startswith("---"):
        return None
    try:
        _, fm, body = text.split("---", 2)
    except ValueError:
        return None
    meta = yaml.safe_load(fm) or {}
    name = meta.get("name") or path.stem
    return Skill(
        name=name,
        version=str(meta.get("version", "1")),
        description=meta.get("description", ""),
        applies_to=list(meta.get("applies_to", [])),
        body=body.strip(),
        path=path,
    )


def _collect() -> dict[tuple[str, str], Skill]:
    out: dict[tuple[str, str], Skill] = {}
    for root in [GLOBAL_SKILLS_DIR] + list((PLATFORM_ROOT / "oses").glob("*/skills")):
        if not root.exists():
            continue
        for md in sorted(root.glob("*.md")):
            s = _parse(md)
            if s:
                out[(s.name, s.version)] = s
    return out


@lru_cache(maxsize=1)
def catalog() -> dict[tuple[str, str], Skill]:
    return _collect()


def _latest(name: str) -> Skill | None:
    matches = [s for (n, _v), s in catalog().items() if n == name]
    if not matches:
        return None
    return sorted(matches, key=lambda s: s.version)[-1]


def get(name: str, version: str | None = None) -> Skill | None:
    if version:
        return catalog().get((name, version))
    return _latest(name)


def inject(prompt: str, skill_names: list[str], version_pins: dict[str, str] | None = None) -> str:
    """Return `prompt` with skill bodies appended under ## Skills section."""
    pins = version_pins or {}
    bodies: list[str] = []
    for name in skill_names:
        s = get(name, version=pins.get(name))
        if s:
            bodies.append(f"### Skill: `{s.name}` (v{s.version})\n{s.body}")
    if not bodies:
        return prompt
    return prompt + "\n\n## Skills\n\n" + "\n\n".join(bodies)
