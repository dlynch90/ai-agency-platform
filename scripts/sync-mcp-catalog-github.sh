#!/bin/bash
# GitHub MCP Catalog Synchronization - Automatic Sync
# Syncs MCP server definitions from GitHub MCP Catalog API via GitHub CLI

set -e

CANONICAL_CONFIG="/Users/daniellynch/.cursor/mcp.json"
GITHUB_CATALOG_URL="https://raw.githubusercontent.com/modelcontextprotocol/servers/main/.mcp.json"

echo "🔄 Syncing MCP catalog from GitHub..."

# Fetch catalog using GitHub CLI
CATALOG_JSON=$(gh api repos/modelcontextprotocol/servers/contents/.mcp.json --jq '.content' | base64 -d)

# Update canonical config with sync timestamp
if [ -f "$CANONICAL_CONFIG" ]; then
    node -e "
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync('$CANONICAL_CONFIG', 'utf8'));
        const catalog = JSON.parse(process.argv[1]);
        
        // Update sync metadata
        config.githubSync.lastSync = new Date().toISOString();
        
        // Merge new servers from catalog
        if (catalog.mcpServers) {
            Object.keys(catalog.mcpServers).forEach(name => {
                if (!config.mcpServers[name]) {
                    config.mcpServers[name] = catalog.mcpServers[name];
                }
            });
        }
        
        fs.writeFileSync('$CANONICAL_CONFIG', JSON.stringify(config, null, 2));
    " "$CATALOG_JSON"
fi

echo "✅ MCP catalog synchronized from GitHub"
echo "📊 Canonical config: $CANONICAL_CONFIG"
