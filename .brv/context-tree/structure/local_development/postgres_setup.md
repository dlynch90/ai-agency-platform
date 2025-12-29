Postgres configuration + health in /Users/daniellynch/Developer:

- docker-compose.yml defines `postgres` service using image `pgvector/pgvector:pg17`, port mapping `${AGENCY_POSTGRES_PORT:-15433}:5432`, env `AGENCY_POSTGRES_USER/AGENCY_POSTGRES_PASSWORD/AGENCY_POSTGRES_DB`, and healthcheck `pg_isready -U ${AGENCY_POSTGRES_USER:-postgres} -d ${AGENCY_POSTGRES_DB:-agency}`.
- docker-compose.yml also defines `pgbouncer` on `${AGENCY_PGBOUNCER_PORT:-16433}` with `DB_HOST=postgres` (container network) and `DB_PASSWORD` from `AGENCY_POSTGRES_PASSWORD`.
- .env.template and .env.example build `DATABASE_URL`/`DIRECT_URL` as `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DB_HOST:-localhost}:${AGENCY_POSTGRES_PORT}/${POSTGRES_DB}` (host access default localhost:15433). env.template (non-dot) defaults `DATABASE_URL` to `postgresql://postgres:changeme@localhost:15433/agency` and sets `DB_HOST/DB_PORT/DB_NAME/DB_USER`.
- mise.toml installs local `postgres = "17.2"` and includes tasks `db:start` / `db:stop` using `docker compose up -d postgres redis`.
- Taskfile.yml `startup:services` uses `mise exec -- pg_ctl ... start` (local Postgres), and hygiene tasks target Docker container name `developer-postgres-1`.
- Health check observed: `developer-postgres-1` healthy and `pg_isready` accepted connections.