#!/bin/bash

# GitHub MCP Catalog Synchronization Script
# Syncs MCP server catalog data from GitHub modelcontextprotocol/servers repository

set -e

echo "🔄 Syncing GitHub MCP Catalog..."

# Ensure data directory exists
mkdir -p /Users/daniellynch/Developer/data

# Sync repository contents
echo "📡 Fetching MCP servers catalog from GitHub..."

# Get repository contents
gh api repos/modelcontextprotocol/servers/contents > /Users/daniellynch/Developer/data/github-mcp-catalog-raw.json

# Get src directory contents (where MCP servers are located)
gh api repos/modelcontextprotocol/servers/contents/src > /Users/daniellynch/Developer/data/github-mcp-servers-raw.json

# Get package.json for version info
gh api repos/modelcontextprotocol/servers/contents/package.json > /tmp/package.json
PACKAGE_VERSION=$(jq -r '.version' /tmp/package.json)

# Process catalog data
echo "🔧 Processing catalog data..."

# Create catalog JSON with proper structure
cat > /Users/daniellynch/Developer/data/github-mcp-catalog.json << EOF
{
  "version": "$PACKAGE_VERSION",
  "lastSync": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "repository": "modelcontextprotocol/servers",
  "servers": $(jq '[.[] | select(.type == "dir") | {name: .name, type: "server", url: .html_url, path: .path, sha: .sha}]' /Users/daniellynch/Developer/data/github-mcp-servers-raw.json)
}
EOF

echo "✅ GitHub MCP catalog synced successfully"

# Display summary
echo "📊 Catalog Summary:"
jq '.servers | length' /Users/daniellynch/Developer/data/github-mcp-catalog.json
echo " MCP servers found"

echo "🕒 Last sync: $(jq -r '.lastSync' /Users/daniellynch/Developer/data/github-mcp-catalog.json)"

echo "📁 Catalog saved to: /Users/daniellynch/Developer/data/github-mcp-catalog.json"

# Update canonical MCP config with sync timestamp
if [ -f ~/.cursor/mcp.json ]; then
    jq --arg lastSync "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       '.githubSync.lastSync = $lastSync' ~/.cursor/mcp.json > ~/.cursor/mcp.json.tmp && \
    mv ~/.cursor/mcp.json.tmp ~/.cursor/mcp.json
    echo "⏰ Updated canonical MCP config sync timestamp"
fi

echo "🎉 GitHub MCP catalog synchronization complete!"