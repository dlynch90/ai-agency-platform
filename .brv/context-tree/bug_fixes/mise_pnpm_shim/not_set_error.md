Verified vendor-only stack using existing SSOT configs (no code changes). MCP SSOT at `~/.config/mcp/ssot.json` already contains >10 MCP servers; `task config:validate` confirms SSOT and symlinks are valid, and `task registry:status` shows MCP/LiteLLM/Mise SSOT registered.

Observed CLI tool issue: `pnpm` shim not set; `pnpm --version` fails with `mise ERROR No version is set for shim: pnpm` and suggests:
```
mise use -g pnpm@10.15.0
# or
mise use -g pnpm@10.15.1
```
Use this to fix pnpm in future vendor-only runs if needed.