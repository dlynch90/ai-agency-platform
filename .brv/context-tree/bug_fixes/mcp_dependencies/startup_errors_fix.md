MCP startup errors were traced to invalid npm packages and missing local service dependencies. Key fixes applied:

- Updated MCP configs to use published npm packages and removed missing servers:
  - `/Users/daniellynch/.mcp.json`: pinned versions, replaced `@modelcontextprotocol/server-notion` with `@notionhq/notion-mcp-server@1.9.1`, replaced `@anthropic/mcp-server-puppeteer` with `@modelcontextprotocol/server-puppeteer@2025.5.12`, pinned core MCP packages, removed `datahub/mlflow/airflow` entries.
  - `/Users/daniellynch/.config/mcp/mcp-ssot.json`: updated versions, removed missing `server-fetch`, bumped `server-everything` and `server-filesystem`, replaced Notion package, updated `context7`.
  - `/Users/daniellynch/Developer/shared/configs/mcp.json`: replaced `server-fetch` with `server-everything`, updated Notion and Puppeteer packages, pinned core versions.
  - `/Users/daniellynch/.config/mcp/validate-mcp-servers.sh`: switched validation from `server-fetch` to `server-everything`.

- Confirmed local service ports were closed, which can cause MCP servers to exit on startup:
```
for port in 16333 17687 17474 15433; do nc -z localhost "$port" >/dev/null 2>&1 && echo "open $port" || echo "closed $port"; done
```

- Docker MCP failures were tied to the Docker socket being unavailable (`colima`/daemon not running), which can be verified with:
```
docker ps --format 'table {{.Names}}\t{{.Status}}'
```

- npm registry checks confirmed missing packages like `@modelcontextprotocol/server-fetch`, `@modelcontextprotocol/server-notion`, `@anthropic/mcp-server-puppeteer`, `@anthropic/mcp-server-playwright`, `@datahub-project/datahub-mcp`, `mlflow-mcp-server`, and `airflow-mcp`.

These changes ensure MCP clients no longer fail due to 404s and shift reliance to published packages (e.g., `@modelcontextprotocol/server-everything`, `@notionhq/notion-mcp-server`, `@modelcontextprotocol/server-puppeteer`).