Audit findings (12/20/2025) for `/Users/daniellynch/Developer`:
- No broken symlinks; symlink noise mostly from `node_modules`.
- Unexpected `~/` directory at repo root (`/Users/daniellynch/Developer/~`) containing uv cache; likely created by a quoted `~` path (should be removed/moved to `$HOME/.cache/uv`).
- `.git/hooks/pre-commit` (and related hooks) are Lefthook scripts with a hardcoded absolute fallback path to `/Users/daniellynch/.local/share/pnpm/.../lefthook`; portable fix is to re-run `lefthook install` or ensure project-local binary.
- Tasks/automation files present: `Taskfile.yml`, `.mise.toml`, `shared/packages/websocket-server/.mise.toml`; no Makefile/Justfile found.
- Services running: redis + postgres via `mise` and also docker containers (`developer-redis-1`, `developer-postgres-1`), plus Neo4j via Homebrew and docker (`developer-neo4j-1`). This duplication can confuse configs/ports.
- Docker: `developer-kong-1` unhealthy; others healthy. Multiple `mcp-server-docker` and `qdrant-api-mcp` processes from `npm exec` observed.
- Disk usage is high: filesystem 94% used (~63Gi free).