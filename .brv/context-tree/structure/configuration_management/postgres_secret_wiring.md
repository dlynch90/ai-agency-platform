Updated Codex CLI MCP config and env wiring for Postgres.

- ~/.codex/config.toml: removed `[mcp_servers.slack]` block; updated `[mcp_servers.postgres]` to run `op run --env-file=... -- bash -lc 'DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST:-localhost}:${POSTGRES_PORT:-5432}/${POSTGRES_DB}"; npx -y @modelcontextprotocol/server-postgres@0.6.2 "$DATABASE_URL"'` so the server receives a connection string argument while secrets are injected by 1Password.
- /Users/daniellynch/Developer/env.op: added non-secret `POSTGRES_HOST=localhost` and `POSTGRES_PORT=15433` alongside existing `POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB`.
- Validated env availability via `op run --env-file=./env.op -- bash -lc 'test -n "$POSTGRES_USER" ...'` (no secret output).

Pattern: when `op run` is used with secret references, build derived env vars in a subshell after `op run` to avoid premature shell expansion, then pass them as CLI args to MCP servers that expect a connection string.