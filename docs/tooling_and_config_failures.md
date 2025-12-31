Found local tooling failure: `mise doctor` and `uv run ...` panic on macOS with `system-configuration` crate (`Attempted to create a NULL object`). This breaks Taskfile commands that rely on `uv run` or `mise doctor`.

Workaround: bypass `uv run` and call the repo venv directly; `./.venv/bin/python -m pytest -q tests/unit` succeeds (22 passed, 9 skipped). `uv --version` works, but any `uv run` triggers the panic.

Also observed environment/default mismatches vs docker-compose ports:
- `shared/services/mcp-gateway/main.py` defaults `NEO4J_URI=bolt://localhost:7687` but compose maps 17687.
- `services/event-orchestrator/orchestrator.py` defaults `REDIS_URL=redis://localhost:16379` while compose maps 6379 with password.
- `services/event-orchestrator/health_monitor.py` defaults `QDRANT_PORT=6333` while host maps 16333.
- `validate_services.py` uses `PGPASSWORD=changeme` while compose default password is `${AGENCY_POSTGRES_PASSWORD:-AgencyDev2025!Secure}` unless overridden.
These mismatches cause health checks to fail even when services are up unless env vars are set.