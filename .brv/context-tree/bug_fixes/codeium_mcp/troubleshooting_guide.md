## Windsurf/Codeium (“codemium”) error + MCP config audit (macOS)

### Key paths
- Windsurf app data:
  - `~/Library/Application Support/Windsurf/`
  - Logs: `~/Library/Application Support/Windsurf/logs/<timestamp>/window1/exthost/exthost.log`
  - Codeium extension logs: `~/Library/Application Support/Windsurf/logs/<timestamp>/window1/exthost/codeium.windsurf/Windsurf.log`
- Codeium/Windsurf MCP config file (source of many MCP startup errors):
  - `~/.codeium/windsurf/mcp_config.json`
- Example machine-level MCP configs (reference):
  - `/Users/daniellynch/Developer/shared/configs/windsurf/mcp_config.recommended.json`
  - `/Users/daniellynch/Developer/shared/configs/windsurf/mcp_config.gateway.json`

### Common errors observed
- Extension host crash/error:
  - `ExtensionError: Error in extension codeium.windsurf: FAILED to handle event`
  - Frequent: `Error: Language server has not been started!`
  - SpecStory extension incompatibility: `Unknown editor type: unknown`

- MCP server refresh failures (from `codeium.windsurf/Windsurf.log`):
  - npm package missing:
    - `npm error 404 Not Found - GET https://registry.npmjs.org/@modelcontextprotocol%2fserver-<name>`
    - Seen for `server-sqlite`, `server-time`, `server-git`, `server-playwright`, `server-ollama`
  - 1Password secret resolution failures:
    - `could not resolve item UUID for item mcp-<name>: could not find item ... in vault <vaultId>`
  - npx cache/extract issues:
    - `npm warn tar TAR_ENTRY_ERROR ENOENT ...`
    - `sh: mcp-remote: command not found` (often after failed `npx -y mcp-remote@...` extraction)

### Practical remediation strategy
- If MCP servers aren’t needed: set `"disabled": true` for the failing servers in `~/.codeium/windsurf/mcp_config.json`.
- If MCP servers are needed: create the referenced 1Password items/fields in the expected vault and ensure `op` CLI is signed in.
- If npx extraction errors occur: clear/refresh npm cache (e.g., remove `~/.npm/_npx/*`) and retry.
- To isolate extension-host crashes: temporarily disable `codeium.windsurf` and incompatible extensions (e.g., SpecStory) to confirm root cause.

### Repo-level artifacts noticed during audit
- `dr-sosa/.swarm/memory.db` with `-shm`/`-wal` (SQLite-style). Consider gitignore if it’s local-only.
- `dr-sosa/undefined/` directory contains tool-like subdirs; may be accidental and cause indexing/perf issues.