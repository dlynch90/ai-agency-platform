Developer workspace is already a Turborepo/PNPM monorepo at `/Users/daniellynch/Developer` with `pnpm-workspace.yaml`, `turbo.json`, and root `package.json`. Key structure:
- `apps/`: `api` (has nested `.git`), `api-gateway`, `dashboard`, `ml-inference`.
- `services/`: `mcp-gateway`, `event-orchestrator`, `event-worker`, `evaluation-pipeline`, `llm-evaluation` (all have `pyproject.toml`).
- `packages/`: JS/TS libs (`core`, `rate-limiter`, `governance`, `@efm/database`, etc.) plus Python packages (`config-governance`, `config-singleton`, `eval-pipeline`).
- `shared/vendor-configs/google-ai/*` contains nested vendor git repos.
Found nested git dirs: `/Users/daniellynch/Developer/apps/api/.git`, `/Users/daniellynch/Developer/mcp-gateway/ansible-mcp/.git`, `/Users/daniellynch/Developer/shared/vendor-configs/google-ai/*/.git`.
Event-driven infra already defined in compose: Redis, RabbitMQ, Kafka, Kafka Connect/UI in `docker-compose.services.yml` and Redis + event worker/orchestrator in `docker-compose.yml`.