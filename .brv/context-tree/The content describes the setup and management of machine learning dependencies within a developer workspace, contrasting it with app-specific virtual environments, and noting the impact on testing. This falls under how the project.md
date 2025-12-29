Installed ML dependency group in the Developer workspace via `uv sync --group ml`, which pulled torch/transformers/sentence-transformers and related transitive deps. Root tests still skip ML inference device tests because `fastapi` and `prometheus_fastapi_instrumentator` are not installed in the workspace env; those deps live in `apps/ml-inference/pyproject.toml` (app-specific venv).

Key reference:
```
/Users/daniellynch/Developer/apps/ml-inference/pyproject.toml
```
This app declares its own runtime deps (fastapi, prometheus-client, torch, transformers, etc.), so root-level tests that import `apps/ml-inference/main.py` need those packages installed in the workspace env or must be run in the app’s env.