Cache/lock/log refresh playbook executed (2025-12-21) on macOS with mise+uv toolchain.

Key safe actions (regenerable):
- npm caches: remove `~/.cache/npm/_npx` (can be multi-GB) by clearing `~/.cache/npm/*` and prune `~/.npm/{_logs,_npx,_cacache}`.
- uv caches: `uv cache prune --force` and `uv cache clean --force`. Note: this may conflict with running `uv tool uvx` processes (e.g., MCP servers) that execute from `~/.cache/uv/archive-v0/...`; if you wipe uv cache while those are running, they may need restart.
- mise caches: `mise cache prune -y`, `mise cache clear -y`, and `mise prune --configs --tools -y` (removes unused tool versions + stale tracked/trusted config links).
- pre-commit: `pre-commit clean` clears `~/.cache/pre-commit`.
- pnpm store: `pnpm store prune` (safe; may slow next install). pnpm also writes to `~/.cache/pnpm` which can be removed.
- Homebrew: `brew cleanup` removes stale lock files/outdated downloads.
- Repo caches: remove `__pycache__`, `.pytest_cache`, `.ruff_cache`, `.mypy_cache`, `node_modules/.cache`, `.turbo`, `.next/cache`, `.vite`, `.parcel-cache`, `coverage/`, `.coverage` in a repo root to reduce technical debt (regenerable).

Lockfiles:
- Avoid deleting repo lockfiles (`pnpm-lock.yaml`, `package-lock.json`, etc.).
- Safe stale lock cleanup targets: cache/state dirs. Example used: delete `*.lock` older than 30 days under `~/.local/share/{cargo,rustup,go,mise,pnpm}`; this removed hundreds of old `~/.local/share/cargo/*.lock` safely.

Logs:
- Large 'log explosion' often comes from tool caches (`npm/_logs`, `pipx/logs`). Prefer clearing cache/log directories rather than truncating app/system logs.

Temp hygiene:
- Chezmoi diffs live under `/var/folders/.../T/chezmoi-diff*` on macOS; safe to delete old ones. Kept the currently-open diff dir and removed the rest.

Gotcha (macOS):
- `mktemp` only replaces trailing `XXXXXX`. Templates like `/tmp/foo.XXXXXX.txt` may not randomize. Use `/tmp/foo.XXXXXX` then append `.txt`, or rename with a timestamp.
