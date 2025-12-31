Added asyncpg to workspace DB dependency group and synced env to include all ML/AI/eval/db deps. Updated `pyproject.toml`:
```
[dependency-groups]

db = [
    "asyncpg>=0.30.0",
    "psycopg>=3.3.0",
    "sqlalchemy>=2.0.0",
    "sqlmodel>=0.0.27",
    "redis>=7.1.0",
]
```
Installed with `uv sync --group ml --group ai --group evaluation --group db` and verified `asyncpg` import (0.31.0).