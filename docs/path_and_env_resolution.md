Taskfile vars use `~/Developer` for CONFIG_DIR/DEVELOPER_DIR, which does not expand in Taskfile commands when not run via shell. This caused `task llm:proxy` and `task eval:router` to fail with `open ~/Developer/config/env.op.template: no such file or directory`. Workaround: run with absolute path and explicit cwd, e.g.
```
op run --env-file /Users/daniellynch/Developer/config/env.op.template -- bash -lc 'cd /Users/daniellynch/Developer && uv run python - <<"PY"\n...\nPY'
```

Also, `uv run` must be executed from repo root to pick up `.venv`; otherwise `ModuleNotFoundError` for packages like `litellm` can occur.