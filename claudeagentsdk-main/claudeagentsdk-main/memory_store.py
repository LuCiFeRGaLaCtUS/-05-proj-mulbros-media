import os
from functools import lru_cache

from mem0 import MemoryClient

MEM0_USER = "lead-team"


@lru_cache(maxsize=1)
def get_mem0() -> MemoryClient:
    return MemoryClient(api_key=os.environ["MEM0_API_KEY"])
