Postgres/MCP debug findings in /Users/daniellynch/Developer:

- Env wiring verified via `op run --env-file=./env.op`: POSTGRES_USER, POSTGRES_DB, POSTGRES_HOST=localhost, POSTGRES_PORT=15433 are present; DATABASE_URL can be composed as postgresql://POSTGRES_USER:POSTGRES_PASSWORD@POSTGRES_HOST:POSTGRES_PORT/POSTGRES_DB.
- Docker Postgres health: `docker compose ps postgres pgbouncer` shows `developer-postgres-1` healthy and `developer-pgbouncer-1` up; `docker exec developer-postgres-1 psql -U postgres -d agency -c "select version();"` succeeded (PostgreSQL 17.7).
- `docker logs --tail 60 developer-postgres-1` shows repeated `LOG: invalid length of startup packet` (non-Postgres traffic hitting port 15433 likely).
- `timeout 5s npx -y @modelcontextprotocol/server-postgres@0.6.2 "$DATABASE_URL"` produced no errors (timeout only), suggesting MCP server starts cleanly.
- `docker compose ps` without op-run emits warnings about missing secrets (AGENCY_POSTGRES_PASSWORD, REDIS_PASSWORD, etc.), so compose should be run via `op run --env-file ./env.op -- docker compose ...`.
- Key config locations:
  - docker-compose.yml: postgres service on ${AGENCY_POSTGRES_PORT:-15433}, env AGENCY_POSTGRES_USER/PASSWORD/DB; healthcheck pg_isready.
  - env.op: AGENCY_POSTGRES_* + POSTGRES_* aliases + POSTGRES_HOST/PORT for host access.
  - .env.template: DATABASE_URL/DIRECT_URL use POSTGRES_* + DB_HOST + AGENCY_POSTGRES_PORT.
  - docker-compose.services.yml: postgrest and langfuse use internal `postgres:5432` URLs.
  - mise.toml: installs postgres=17.2 and defines db:start/db:stop tasks; Taskfile.yml uses `pg_ctl` for local Postgres start.
- Hardcoded path registry exists in `shared/registries/path-registry.toml` with /usr/local and /opt/homebrew paths; Taskfile contains macOS-specific LaunchAgents paths.