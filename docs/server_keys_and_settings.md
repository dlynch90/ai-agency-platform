Zed MCP extension IDs / context server keys (from each extension's extension.toml):
- ByteRover MCP Server: `mcp-server-byterover`
- Brave Search MCP Server: `mcp-server-brave-search`
- Tavily MCP Server: `mcp-server-tavily`
- Master-Go MCP Server: `mcp-server-master-go`
- Postgres Context Server: `postgres-context-server`
- Serena Context Server: `serena-context-server`
These keys can be added under `context_servers` in `~/.config/zed/settings.json` to disable servers (e.g. `"enabled": false`) or provide required settings.