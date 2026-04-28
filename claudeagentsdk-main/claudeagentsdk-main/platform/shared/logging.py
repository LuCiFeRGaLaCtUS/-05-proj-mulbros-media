"""Run-scoped logging. Phase 0 = stdout. Phase 1 swaps in Langfuse.

A run_id is a UUID that ties together all events (agent calls, tool calls,
audit rows, mem0 reads/writes) that came from a single user brief. Every
log line and audit record carries it.
"""
from __future__ import annotations

import json
import logging
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime

_RUN_ID: ContextVar[str | None] = ContextVar("run_id", default=None)


def new_run_id() -> str:
    rid = str(uuid.uuid4())
    _RUN_ID.set(rid)
    return rid


def current_run_id() -> str | None:
    return _RUN_ID.get()


class _JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:  # noqa: D401
        payload: dict = {
            "ts": datetime.utcfromtimestamp(record.created).isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        if rid := _RUN_ID.get():
            payload["run_id"] = rid
        extras = getattr(record, "extras", None)
        if isinstance(extras, dict):
            payload.update(extras)
        return json.dumps(payload, default=str)


_configured = False


def setup(level: str = "INFO") -> None:
    global _configured
    if _configured:
        return
    root = logging.getLogger()
    root.setLevel(level)
    for h in list(root.handlers):
        root.removeHandler(h)
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(_JSONFormatter())
    root.addHandler(handler)
    _configured = True


def get(name: str) -> logging.Logger:
    setup()
    return logging.getLogger(name)


def event(logger: logging.Logger, msg: str, **fields) -> None:
    """Structured info log with arbitrary extra fields serialized into JSON."""
    logger.info(msg, extra={"extras": fields})
