Updated Developer project setup to fix mise + MCP install issues.

- `mise` task `init:verify` failed in non-interactive shells because shims were not on PATH. Fixed by adding PATH prefix in `.mise.toml`:
```
"init:verify" = "PATH=\"$HOME/.local/share/mise/shims:$PATH\" mise doctor && uv --version && op account list"
```
This ensures `mise doctor` reports `shims_on_path: yes` during task runs.

- `install_mcp_servers.py` incorrectly looked for `config/mcp.json` via `get_config_file`, causing `mcp:install` to fail. Fixed to use project root `mcp.json`:
```
self.mcp_config_path = Path(mcp_config_path) if mcp_config_path else self.config.get_project_file("mcp.json")
```
Now `mise run mcp:install` reads the same `mcp.json` that `mcp:status`/`mcp:validate` use.

- MCP install run shows many `@modelcontextprotocol/server-*` entries 404 on npm; only a subset currently resolves. Root cause is invalid/unpublished package names in `mcp.json`.