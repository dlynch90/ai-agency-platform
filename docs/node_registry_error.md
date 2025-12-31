Updates in `/Users/daniellynch/Developer/.mise.toml` (and synced `mise.toml`) to fix `mise` tool resolution and make `audit.binaries` usable:

1) **Removed invalid `tool_alias` mapping that broke node registry resolution.** This fixed repeated warnings like `node@22.12.0 not found in mise tool registry` and allowed `mise current node` to work again.

2) **Tightened `audit.binaries` task** to only report true binaries (Mach-O/ELF/PE/shared libs) and to skip common build/cache dirs, avoiding floods of script files.

Updated task block:
```toml
[tasks."audit.binaries"]
  description="Audit repo binaries and version sources"
  run=['''
set -eu
if ! command -v fd >/dev/null 2>&1; then
  echo "❌ fd not found."
  exit 1
fi
if ! command -v file >/dev/null 2>&1; then
  echo "❌ file(1) not found."
  exit 1
fi
fd -t f --hidden \
  -E .git -E node_modules -E vendor-solutions -E vendor-configs -E vendor-catalog -E .venv* \
  -E .ansible -E .git_disabled -E .direnv -E .terraform -E .tox \
  -E dist -E build -E .next -E .turbo -E .cache -E .pnpm-store -E coverage \
  -E .pytest_cache -E .ruff_cache -E .mypy_cache -E .idea -E .vscode \
  . | while IFS= read -r f; do
  if file -b "$f" | rg -q "Mach-O|ELF|PE32|shared object|dynamically linked"; then
    echo "$f"
  fi
done
''']
```

3) **Removed custom governance scripts** (per vendor-only requirement):
- `packages/governance/analyze.py`
- `packages/governance/scan.ts`
- `packages/governance/seed.ts`

Docs updated to reflect removal: `GAP_ANALYSIS_MODERNIZATION_V2.md`, `docs/GAP_ANALYSIS_SECRETS_MCP_V3.md`.

Verification:
- `mise current node` now returns `22.12.0` without registry warnings.
- `mise run audit.binaries` now completes quickly and only reports real binaries (e.g., `packages/@efm/database/generated/client/libquery_engine-darwin-arm64.dylib.node`).