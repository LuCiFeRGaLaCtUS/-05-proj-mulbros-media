"""Run the API + web bundle locally.

    make api                           -> localhost:3000
    python -m apps.api --port 3000
"""
from __future__ import annotations

import argparse

import uvicorn

from shared import config


def main() -> None:
    config.load_env()
    p = argparse.ArgumentParser(prog="platform-api")
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", type=int, default=3000)
    p.add_argument("--reload", action="store_true", help="Auto-reload on code changes (dev)")
    args = p.parse_args()
    uvicorn.run(
        "apps.api.server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info",
    )


if __name__ == "__main__":
    main()
