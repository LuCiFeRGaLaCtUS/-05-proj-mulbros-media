"""Template OS — outbound @governed tools.

Only include this file if your OS does outbound (sends emails/SMS/calls/notifications).
Brief OS doesn't have one; Sales OS does. Delete if not applicable.

Pattern: every outbound tool checks ctx.sandbox and redirects accordingly.
The @governed decorator handles audit + budget; you handle delivery + threading.
"""
from __future__ import annotations

from governance.middleware import governed


@governed(name="mcp__template_os_outbound__send_thing", cost={"key": "things_sent", "amount": 1})
async def send_thing(tenant_id: str, to: str, body: str) -> dict:
    """Stub. Replace with real outbound implementation.

    Pattern (mirror oses/sales/outbound_tools.py):
    1. Resolve sandbox redirect — if ctx.sandbox.enabled, swap `to` for the operator's contact.
    2. Call the appropriate connector under /platform/tools/.
    3. Return delivery metadata so the caller can persist it.
    """
    raise NotImplementedError
