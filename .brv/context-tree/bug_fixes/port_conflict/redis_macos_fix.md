## Claude Code System Audit Learnings (2025-12-17)

### Critical Discovery: Redis Port Conflict Pattern

**Symptom**: MCP servers failing to connect, port 6379 in use
**Root Cause**: Homebrew launchd service `homebrew.mxcl.redis` auto-starts redis-server
**Solution**: 
```bash
brew services stop redis
brew services list | grep redis  # Verify "none" status
```

**Prevention**: Always check `brew services list` when diagnosing port conflicts on macOS.

### MCP Database Server Configuration Pattern

**Issue**: Database MCP servers configured WITHOUT connection strings in ~/.claude.json

**Correct Configuration Templates**:

```json
// PostgreSQL MCP
"postgres": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://user:pass@localhost:15433/dbname"]
}

// Redis MCP
"redis": {
  "type": "stdio", 
  "command": "npx",
  "args": ["-y", "@gongrzhe/server-redis-mcp", "redis://localhost:6379"]
}

// Qdrant MCP (via smithery)
"qdrant": {
  "args": ["run", "@smithery/qdrant-mcp-server", "--config", "{\"url\":\"http://localhost:16333\"}"]
}

// Neo4j MCP (via smithery)
"neo4j": {
  "args": ["run", "mcp-neo4j", "--config", "{\"uri\":\"bolt://localhost:17687\",\"user\":\"neo4j\",\"password\":\"password\"}"]
}
```

### Docker Port Mapping Reference

For this Developer environment, Docker containers use non-standard ports:

| Service | External Port | Internal Port |
|---------|--------------|---------------|
| PostgreSQL | 15433 | 5432 |
| Redis | 6379 | 6379 |
| Neo4j HTTP | 17474 | 7474 |
| Neo4j Bolt | 17687 | 7687 |
| Qdrant HTTP | 16333 | 6333 |
| Qdrant gRPC | 16334 | 6334 |

### MCP Debugging Workflow

1. Run `claude mcp list` to see connected/failed servers
2. For failed servers, check ~/.claude.json configuration
3. Verify Docker containers: `docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"`
4. Check for port conflicts: `lsof -i :PORT`
5. Verify homebrew services: `brew services list`
6. Test connection manually before MCP

### Key Files for MCP Configuration

- `~/.claude.json` - Main Claude Code MCP server definitions
- `/Users/daniellynch/Developer/.mcp.json` - Project-level MCP config
- `/Users/daniellynch/Developer/shared/configs/mcp.json` - Port registry

### Tags
claude-code, mcp, debugging, redis, postgresql, docker, homebrew, configuration, port-conflict