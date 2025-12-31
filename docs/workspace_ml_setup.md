Added FastAPI instrumentation deps to the workspace ML group and validated toolchain. Root `pyproject.toml` now includes:
```
ml = [
    "fastapi>=0.124.0",
    "prometheus-fastapi-instrumentator>=7.1.0",
    "torch>=2.9.0",
    "transformers>=4.57.0",
    "sentence-transformers>=5.1.0",
    "huggingface-hub>=0.36.0",
]
```

Environment actions:
- `uv sync --group ml --group ai --group evaluation` to ensure ML + AI + evaluation deps are installed together (torch/transformers, litellm/langchain, evaluate/mlflow).
- `task test` now runs ML inference device tests successfully; remaining skips are archived `atuin_export`/`huggingface-gpu-inference` and DB tests lacking asyncpg.
- `task health:tools` reports missing mise shims (websockets), recommends `mise reshim`.
- `task secrets:validate` confirms 1Password connection.
- `chezmoi --version` verified installed.
