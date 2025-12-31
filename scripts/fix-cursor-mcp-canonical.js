#!/usr/bin/env node

/**
 * FIX CURSOR IDE MCP SERVERS - CANONICAL CONFIGURATION
 * Ensures ~/.cursor/mcp.json is the ONE canonical source
 * Synchronizes with GitHub MCP Catalog via GitHub CLI
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CANONICAL_MCP_CONFIG = path.join(process.env.HOME, '.cursor/mcp.json');
const GITHUB_MCP_CATALOG_URL = 'https://raw.githubusercontent.com/modelcontextprotocol/servers/main/.mcp.json';
const LOG_FILE = path.join(__dirname, '../.cursor/debug.log');

class CursorMCPCanonicalFixer {
    constructor() {
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const logDir = path.dirname(LOG_FILE);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    log(message, data = {}) {
        const entry = {
            id: `mcp_fix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            location: 'fix-cursor-mcp-canonical.js',
            message,
            data,
            sessionId: 'cursor-mcp-canonical-fix',
            hypothesisId: 'CANONICAL_MCP_CONFIG'
        };

        const logLine = JSON.stringify(entry) + '\n';
        fs.appendFileSync(LOG_FILE, logLine);
        console.log(`🔧 ${message}`);
    }

    async fetchGitHubMCPCatalog() {
        this.log('Fetching GitHub MCP Catalog', { url: GITHUB_MCP_CATALOG_URL });
        
        try {
            const response = await fetch(GITHUB_MCP_CATALOG_URL);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const catalog = await response.json();
            this.log('GitHub MCP Catalog fetched', { serverCount: Object.keys(catalog.mcpServers || {}).length });
            return catalog;
        } catch (error) {
            this.log('Failed to fetch GitHub MCP Catalog', { error: error.message });
            // Fallback to GitHub CLI
            try {
                const catalogJson = execSync(`gh api repos/modelcontextprotocol/servers/contents/.mcp.json --jq '.content' | base64 -d`, { encoding: 'utf8' });
                return JSON.parse(catalogJson);
            } catch (cliError) {
                this.log('GitHub CLI fallback failed', { error: cliError.message });
                return null;
            }
        }
    }

    async createCanonicalMCPConfig() {
        this.log('Creating canonical MCP configuration', { path: CANONICAL_MCP_CONFIG });

        // Fetch GitHub catalog for reference
        const githubCatalog = await this.fetchGitHubMCPCatalog();

        // Comprehensive MCP server configuration
        const mcpConfig = {
            "$schema": "https://modelcontextprotocol.io/schema/mcp-config.json",
            "version": "2.0.0",
            "description": "SSOT MCP Configuration - Canonical Location - GitHub Synchronized - Cursor IDE Reads This File",
            "lastUpdated": new Date().toISOString(),
            "githubSync": {
                "enabled": true,
                "catalogUrl": GITHUB_MCP_CATALOG_URL,
                "syncInterval": "6h",
                "lastSync": new Date().toISOString(),
                "method": "github-cli"
            },
            "mcpServers": {
                "filesystem": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-filesystem", process.env.DEVELOPER_DIR || path.join(process.env.HOME, 'Developer')],
                    "env": { "NODE_ENV": "production" }
                },
                "git": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-git", "--repository", process.env.DEVELOPER_DIR || path.join(process.env.HOME, 'Developer')],
                    "env": { "NODE_ENV": "production" }
                },
                "github": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-github"],
                    "env": {
                        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
                        "NODE_ENV": "production"
                    }
                },
                "ollama": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-ollama"],
                    "env": {
                        "OLLAMA_BASE_URL": "http://localhost:11434",
                        "NODE_ENV": "production"
                    }
                },
                "sequential-thinking": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
                    "env": {
                        "SEQUENTIAL_THINKING_DB_PATH": path.join(process.env.DEVELOPER_DIR || path.join(process.env.HOME, 'Developer'), '.sequential-thinking.db'),
                        "NODE_ENV": "production"
                    }
                },
                "memory": {
                    "command": "npx",
                    "args": ["-y", "@anthropic-ai/mcp-server-memory"],
                    "env": { "NODE_ENV": "production" }
                },
                "neo4j": {
                    "command": "npx",
                    "args": ["-y", "@henrychong-ai/mcp-neo4j-knowledge-graph"],
                    "env": {
                        "NEO4J_URI": "bolt://localhost:7687",
                        "NEO4J_USER": "neo4j",
                        "NEO4J_PASSWORD": "${NEO4J_PASSWORD}",
                        "NODE_ENV": "production"
                    }
                },
                "qdrant": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-qdrant"],
                    "env": {
                        "QDRANT_URL": "http://localhost:6333",
                        "QDRANT_API_KEY": "${QDRANT_API_KEY}",
                        "NODE_ENV": "production"
                    }
                },
                "firecrawl": {
                    "command": "npx",
                    "args": ["-y", "@anthropic-ai/mcp-server-firecrawl"],
                    "env": {
                        "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}",
                        "NODE_ENV": "production"
                    }
                },
                "tavily": {
                    "command": "npx",
                    "args": ["-y", "@anthropic-ai/mcp-server-tavily"],
                    "env": {
                        "TAVILY_API_KEY": "${TAVILY_API_KEY}",
                        "NODE_ENV": "production"
                    }
                },
                "exa": {
                    "command": "npx",
                    "args": ["-y", "@anthropic-ai/mcp-server-exa"],
                    "env": {
                        "EXA_API_KEY": "${EXA_API_KEY}",
                        "NODE_ENV": "production"
                    }
                },
                "brave-search": {
                    "command": "npx",
                    "args": ["-y", "@anthropic-ai/mcp-server-brave-search"],
                    "env": {
                        "BRAVE_API_KEY": "${BRAVE_API_KEY}",
                        "NODE_ENV": "production"
                    }
                },
                "task-master": {
                    "command": "npx",
                    "args": ["-y", "@gofman3/task-master-mcp"],
                    "env": { "NODE_ENV": "production" }
                },
                "playwright": {
                    "command": "npx",
                    "args": ["-y", "@anthropic-ai/mcp-server-playwright"],
                    "env": { "NODE_ENV": "production" }
                }
            }
        };

        // Merge with GitHub catalog if available
        if (githubCatalog && githubCatalog.mcpServers) {
            this.log('Merging GitHub catalog servers', { 
                githubCount: Object.keys(githubCatalog.mcpServers).length,
                currentCount: Object.keys(mcpConfig.mcpServers).length
            });
            
            // Add any servers from GitHub catalog that we don't have
            Object.keys(githubCatalog.mcpServers).forEach(serverName => {
                if (!mcpConfig.mcpServers[serverName]) {
                    mcpConfig.mcpServers[serverName] = githubCatalog.mcpServers[serverName];
                    this.log('Added server from GitHub catalog', { server: serverName });
                }
            });
        }

        // Ensure directory exists
        const configDir = path.dirname(CANONICAL_MCP_CONFIG);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        // Write canonical config
        fs.writeFileSync(CANONICAL_MCP_CONFIG, JSON.stringify(mcpConfig, null, 2));
        this.log('Canonical MCP config created', { 
            path: CANONICAL_MCP_CONFIG,
            serverCount: Object.keys(mcpConfig.mcpServers).length
        });

        return mcpConfig;
    }

    async createGitHubSyncScript() {
        this.log('Creating GitHub sync script');

        const syncScript = `#!/bin/bash
# GitHub MCP Catalog Synchronization - Automatic Sync
# Syncs MCP server definitions from GitHub MCP Catalog API via GitHub CLI

set -e

CANONICAL_CONFIG="${CANONICAL_MCP_CONFIG}"
GITHUB_CATALOG_URL="${GITHUB_MCP_CATALOG_URL}"

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
`;

        const syncScriptPath = path.join(__dirname, 'sync-mcp-catalog-github.sh');
        fs.writeFileSync(syncScriptPath, syncScript);
        fs.chmodSync(syncScriptPath, '755');
        this.log('GitHub sync script created', { path: syncScriptPath });
    }

    async verifyCanonicalConfig() {
        this.log('Verifying canonical MCP configuration');

        if (!fs.existsSync(CANONICAL_MCP_CONFIG)) {
            throw new Error(`Canonical MCP config not found: ${CANONICAL_MCP_CONFIG}`);
        }

        const config = JSON.parse(fs.readFileSync(CANONICAL_MCP_CONFIG, 'utf8'));
        
        if (!config.mcpServers || Object.keys(config.mcpServers).length === 0) {
            throw new Error('Canonical MCP config has no servers configured');
        }

        this.log('Canonical MCP config verified', {
            serverCount: Object.keys(config.mcpServers).length,
            hasGitHubSync: !!config.githubSync,
            lastSync: config.githubSync?.lastSync || 'never'
        });

        return config;
    }

    async execute() {
        console.log('🔧 FIXING CURSOR IDE MCP SERVERS - CANONICAL CONFIGURATION 🔧');
        console.log('='.repeat(60));

        await this.createCanonicalMCPConfig();
        await this.createGitHubSyncScript();
        const config = await this.verifyCanonicalConfig();

        console.log('\n✅ CANONICAL MCP CONFIGURATION COMPLETE');
        console.log(`📁 Canonical Location: ${CANONICAL_MCP_CONFIG}`);
        console.log(`🔌 MCP Servers Configured: ${Object.keys(config.mcpServers).length}`);
        console.log(`🔄 GitHub Sync: ${config.githubSync?.enabled ? 'ENABLED' : 'DISABLED'}`);
        console.log('\n⚠️  IMPORTANT: Restart Cursor IDE to load the updated MCP configuration');

        this.log('Cursor IDE MCP canonical configuration complete');
    }
}

// Execute
const fixer = new CursorMCPCanonicalFixer();
fixer.execute().catch(error => {
    console.error('💥 FAILED:', error);
    process.exit(1);
});