## Python UV Migration Pattern - 2025-12-18

### Successfully Migrated from requirements.txt to pyproject.toml with uv

**Pattern for workspace-level Python management:**

1. Create `pyproject.toml` with dependency-groups for modular installs:
```toml
[project]
name = "workspace-name"
requires-python = ">=3.12"
dependencies = ["httpx", "pydantic", "structlog", "rich", "typer"]

[dependency-groups]
dev = ["pytest", "ruff", "mypy", "pre-commit"]
ml = ["torch", "transformers"]
mcp = ["mcp", "fastmcp", "uvicorn"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/package_name"]
```

2. Commands:
- `uv sync` - Install core dependencies
- `uv sync --group dev` - Add dev tools
- `uv run python` - Run in managed env
- `uv run ruff check src/` - Lint
- `uv run mypy src/` - Type check

3. Key learnings:
- hatch needs actual package directory (create `src/package_name/__init__.py`)
- Use `tool.uv.managed = true` for uv to manage the project
- mise manages Python versions, uv manages packages
- uv.lock provides reproducible builds