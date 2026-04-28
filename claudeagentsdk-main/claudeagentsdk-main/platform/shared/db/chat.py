"""Chat session + message CRUD over the Phase 0 migration tables.

Session shape (chat_sessions):
    id, tenant_id, os_name, title, created_at, last_active_at

Message shape (chat_messages):
    id, session_id, tenant_id, role ∈ {user, assistant, system, tool},
    content, attachments (jsonb), created_at

Attachments carry non-primary content with a `kind` field so the UI can
render inline widgets:
    {kind: "tool-trace", tool_name: "send_email", human_label: "Sending email"}
    {kind: "inline-widget", schema_name: "approval", ...}
    {kind: "report", severity: "opportunity", headline: "9 leads ..."}
    {kind: "result", cost_usd: 0.29, turns: 5}
"""
from __future__ import annotations

from typing import Any

from shared.db.supabase import client, table


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------
def list_sessions(tenant_id: str, os_name: str, limit: int = 50) -> list[dict]:
    res = (
        table("chat_sessions")
        .select("id,os_name,title,created_at,last_active_at")
        .eq("tenant_id", tenant_id)
        .eq("os_name", os_name)
        .order("last_active_at", desc=True)
        .limit(limit)
        .execute()
    )
    sessions = res.data or []
    if not sessions:
        return []
    # Hide orphans — sessions that were created (pre-lazy-creation fix, or from
    # a crash between create and first message) but never had a message posted.
    # We only physically delete orphans older than the safety window, because a
    # session can legitimately sit in a just-created state for ~1 second while
    # the first user message is being persisted. Fresh orphans are hidden from
    # the response but left in the DB — they'll either graduate to real
    # sessions (once a message posts) or be swept on a later list call.
    from datetime import datetime, timedelta, timezone
    safety_window = timedelta(minutes=5)
    cutoff = datetime.now(timezone.utc) - safety_window

    ids = [s["id"] for s in sessions]
    msg_res = (
        table("chat_messages")
        .select("session_id")
        .in_("session_id", ids)
        .execute()
    )
    with_messages = {m["session_id"] for m in (msg_res.data or [])}

    def _is_stale(s: dict) -> bool:
        ts = s.get("created_at") or s.get("last_active_at")
        if not ts:
            return False
        try:
            return datetime.fromisoformat(ts.replace("Z", "+00:00")) < cutoff
        except Exception:
            return False

    stale_orphans = [s["id"] for s in sessions
                     if s["id"] not in with_messages and _is_stale(s)]
    if stale_orphans:
        client().table("chat_sessions").delete().in_("id", stale_orphans).execute()
    return [s for s in sessions if s["id"] in with_messages]


def create_session(tenant_id: str, os_name: str, title: str | None = None) -> dict:
    row = {"tenant_id": tenant_id, "os_name": os_name, "title": title}
    res = client().table("chat_sessions").insert(row).execute()
    return (res.data or [{}])[0]


def get_session(session_id: str) -> dict | None:
    res = table("chat_sessions").select("*").eq("id", session_id).limit(1).execute()
    return (res.data or [None])[0]


def touch_session(session_id: str) -> None:
    from datetime import datetime, timezone
    table("chat_sessions").update(
        {"last_active_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", session_id).execute()


def rename_session_if_default(
    session_id: str,
    new_title: str,
    default_titles: tuple[str, ...] = ("New chat", "Untitled", "New chat "),
) -> None:
    """Only rename if the current title is one of the defaults, so we don't
    overwrite a title the user set deliberately."""
    s = get_session(session_id)
    if s is None:
        return
    if (s.get("title") or "").strip() not in [t.strip() for t in default_titles]:
        return
    title = new_title.strip().replace("\n", " ")
    if len(title) > 60:
        title = title[:57].rstrip() + "…"
    if not title:
        return
    table("chat_sessions").update({"title": title}).eq("id", session_id).execute()


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------
def list_messages(session_id: str, after: str | None = None, limit: int = 500) -> list[dict]:
    """Messages in a session, ordered by creation time. `after` is an ISO
    timestamp — if set, only newer messages are returned (for polling)."""
    q = (
        table("chat_messages")
        .select("id,role,content,attachments,created_at")
        .eq("session_id", session_id)
    )
    if after:
        q = q.gt("created_at", after)
    return (q.order("created_at").limit(limit).execute()).data or []


def append_message(
    *,
    session_id: str,
    tenant_id: str,
    role: str,
    content: str | None = None,
    attachments: list[dict[str, Any]] | None = None,
) -> dict:
    row = {
        "session_id":  session_id,
        "tenant_id":   tenant_id,
        "role":        role,
        "content":     content,
        "attachments": attachments or [],
    }
    res = client().table("chat_messages").insert(row).execute()
    return (res.data or [{}])[0]
