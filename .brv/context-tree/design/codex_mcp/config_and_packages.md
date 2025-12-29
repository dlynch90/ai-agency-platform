Codex config docs and MCP package verification findings for this repo:

- Codex config defaults live in `$CODEX_HOME/config.toml` (defaults to `~/.codex/config.toml`). Key settings:
  - `approval_policy = "untrusted"|"on-failure"|"on-request"|"never"`.
  - `sandbox_mode = "read-only"|"workspace-write"|"danger-full-access"`.
  - `[sandbox_workspace_write].network_access = true` enables outbound network inside sandbox.
  - Feature flags live under `[features]`: `web_search_request`, `rmcp_client`, `apply_patch_freeform`, `unified_exec`, `view_image_tool` (default true). Legacy `[tools]` is deprecated (Codex docs config.md).
  - MCP servers are configured under `[mcp_servers.<name>]` with `command/args` (stdio) or `url` (HTTP).

- MCP server packages verified via npm/PyPI:
  - npm latests: `@modelcontextprotocol/server-filesystem@2025.12.18`, `server-github@2025.4.8`, `server-postgres@0.6.2`, `server-brave-search@0.6.2`, `server-redis@2025.4.25`, `server-slack@2025.4.25`, `server-memory@2025.11.25`, `server-sequential-thinking@2025.12.18`, `server-puppeteer@2025.5.12`, `server-everything@2025.12.18`.
  - npm latests: `octocode-mcp@9.0.0`, `mcp-linear@0.1.8`, `exa-mcp-server@3.1.3`, `tavily-mcp@0.2.11`, `firecrawl-mcp@3.6.2`, `jina-mcp-tools@1.2.0`, `@notionhq/notion-mcp-server@1.9.1`, `mcp-server-docker@1.0.0`, `mcp-server-kubernetes@3.0.4`, `mcp-remote@0.1.37`.
  - PyPI: `mcp-server-fetch@2025.4.7`, `mcp-server-git@2025.12.18`, `mcp-server-time@2025.9.25`.
  - `@modelcontextprotocol/server-fetch` does NOT exist on npm; use `uvx mcp-server-fetch`.

- 1Password CLI local validation: `op run --help` confirms `--env-file` support (Dotenv integration), useful for `op run --env-file ./env.op -- <command>` injection.

- MCP JSON `$schema` URL `https://raw.githubusercontent.com/modelcontextprotocol/servers/main/schema/mcp.json` returns 404; schema endpoint not publicly reachable in this session.

Repo changes applied:
- `mcp.json` and `shared/configs/mcp.json` now pin MCP server versions, use `op run` for secret-required servers (including redis), and fix ByteRover endpoint to `https://mcp.byterover.dev/v2/mcp`.
- `docs/CODEX-MCP-OPTIMIZATION-REPORT.md` documents Codex config recommendations and env alignment gaps.