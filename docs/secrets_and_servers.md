Updated MCP configs to align with 1Password-injected envs and a consistent server list.

- Root `mcp.json` now includes op-run wrappers for secret-required servers and standardizes versions/keys; example wrapper pattern:
```
op run --env-file="${MCP_OP_ENV_FILE:-$HOME/.config/1password/secrets.env.tpl}" -- npx -y @modelcontextprotocol/server-github
```
- `shared/configs/mcp.json` updated ByteRover endpoint to v2 and aligned Octocode env file to the shared `MCP_OP_ENV_FILE` default.
- `config.toml` `[mcp].servers` list now reflects the actual keys configured in `mcp.json` (filesystem variants + core + web/search + remote).

These changes ensure MCP servers rely on a consistent 1Password secrets template and a single, accurate server inventory.