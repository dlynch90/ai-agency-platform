Key fixes for Developer repo infra bring-up:
- Docker Compose plugin is lost when using a custom `DOCKER_CONFIG` (e.g., `/Users/daniellynch/.config/docker-nocreds`), causing `docker compose` failures. Fix by symlinking the compose plugin into the custom config:
```
mkdir -p /Users/daniellynch/.config/docker-nocreds/cli-plugins
ln -sf /Users/daniellynch/.docker/cli-plugins/docker-compose /Users/daniellynch/.config/docker-nocreds/cli-plugins/docker-compose
```
- 1Password item field reality: `POSTGRES_PASSWORD` item stores the secret in the `credential` field (the `password` field is empty). Use:
```
POSTGRES_PASSWORD="op://Development/POSTGRES_PASSWORD/credential"
```
- `LANGFUSE_SECRET_KEY` item also stores the secret in `credential` (not `password`). Add to `.env.op`:
```
LANGFUSE_SECRET_KEY=op://Development/LANGFUSE_SECRET_KEY/credential
```
- Langfuse container failures:
  - P1000 auth errors happen when Postgres password in env does not match persisted DB password.
  - Fix by resetting the Postgres password inside the container using 1Password-injected env, then recreating langfuse:
```
op run --env-file=./.env.op -- bash -lc 'printf "ALTER USER postgres WITH PASSWORD '\''%s'\'';" "$POSTGRES_PASSWORD" | docker exec -i developer-postgres-1 psql -U postgres -d postgres'
DOCKER_CONFIG=/Users/daniellynch/.config/docker-nocreds op run --env-file=./.env.op -- docker compose -f docker-compose.yml -f docker-compose.services.yml --profile core up -d langfuse
```
- Langfuse “Invalid environment variables” resolved by setting `LANGFUSE_SECRET_KEY` in `.env.op` (compose uses it for `NEXTAUTH_SECRET` and `SALT`).