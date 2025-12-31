#!/usr/bin/env node

/**
 * MCP GitHub Catalog Synchronizer
 * Synchronizes Cursor IDE MCP configuration with GitHub MCP catalog
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CURSOR_MCP_CONFIG = '/Users/daniellynch/.cursor/mcp.json';
const BACKUP_SUFFIX = '.backup.' + new Date().toISOString().replace(/[:.]/g, '-');

// MCP server registry from various sources
const MCP_SOURCES = [
  {
    name: 'modelcontextprotocol',
    query: 'org:modelcontextprotocol+topic:mcp-server',
    baseUrl: 'https://api.github.com/search/repositories?q=org:modelcontextprotocol+topic:mcp-server&sort=stars&order=desc'
  },
  {
    name: 'anthropic',
    query: 'org:anthropic-ai+mcp',
    baseUrl: 'https://api.github.com/search/repositories?q=org:anthropic-ai+mcp&sort=stars&order=desc'
  },
  {
    name: 'community',
    query: 'topic:mcp-server+topic:mcp',
    baseUrl: 'https://api.github.com/search/repositories?q=topic:mcp-server+topic:mcp&sort=stars&order=desc'
  }
];

// Default MCP server configurations
const DEFAULT_MCP_SERVERS = {
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/daniellynch/Developer"],
    "env": { "NODE_ENV": "production" }
  },
  "sequential-thinking": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    "env": {
      "SEQUENTIAL_THINKING_DB_PATH": "/Users/daniellynch/Developer/data/sequential-thinking.db",
      "NODE_ENV": "production"
    }
  },
  "memory": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"],
    "env": {
      "MEMORY_DB_PATH": "/Users/daniellynch/Developer/data/memory.db",
      "NODE_ENV": "production"
    }
  },
  "ollama": {
    "command": "node",
    "args": ["/Users/daniellynch/Developer/mcp-servers/ollama-server.cjs"],
    "env": {
      "OLLAMA_HOST": "http://localhost:11434",
      "NODE_ENV": "production"
    }
  }
};

function fetchGitHubData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'MCP-Catalog-Sync/1.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function extractMCPPackageName(repo) {
  const { name, full_name, description } = repo;

  // Extract package name from description or name
  if (description && description.includes('@')) {
    const match = description.match(/@[\w\-_]+\/[\w\-_]+/);
    if (match) return match[0];
  }

  // Common naming patterns
  if (name.includes('server-')) {
    return `@modelcontextprotocol/${name}`;
  }

  // Fallback to full name
  return full_name;
}

async function fetchMCPCatalog() {
  console.log('🔍 Fetching MCP catalog from GitHub...');

  const allRepos = [];

  for (const source of MCP_SOURCES) {
    try {
      console.log(`📦 Fetching from ${source.name}...`);
      const data = await fetchGitHubData(source.baseUrl);
      const repos = data.items || [];

      repos.forEach(repo => {
        allRepos.push({
          ...repo,
          source: source.name,
          packageName: extractMCPPackageName(repo)
        });
      });

      // Avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.warn(`⚠️ Failed to fetch from ${source.name}:`, error.message);
    }
  }

  // Remove duplicates and sort by stars
  const uniqueRepos = allRepos
    .filter((repo, index, self) =>
      index === self.findIndex(r => r.full_name === repo.full_name)
    )
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));

  console.log(`✅ Found ${uniqueRepos.length} unique MCP repositories`);
  return uniqueRepos;
}

function generateMCPConfig(catalogRepos) {
  console.log('⚙️ Generating MCP configuration...');

  const mcpServers = { ...DEFAULT_MCP_SERVERS };

  // Add top MCP servers from catalog
  const topRepos = catalogRepos.slice(0, 20); // Limit to top 20

  topRepos.forEach((repo, index) => {
    const serverName = repo.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const packageName = repo.packageName;

    // Skip if already in defaults
    if (mcpServers[serverName]) return;

    // Create server configuration
    const serverConfig = {
      command: "npx",
      args: ["-y", packageName],
      env: {
        NODE_ENV: "production"
      }
    };

    // Add API keys for known services
    if (packageName.includes('openai')) {
      serverConfig.env.OPENAI_API_KEY = "op://MCP Servers/OpenAI/api_key";
    } else if (packageName.includes('anthropic')) {
      serverConfig.env.ANTHROPIC_API_KEY = "op://MCP Servers/Anthropic/api_key";
    } else if (packageName.includes('huggingface')) {
      serverConfig.env.HUGGINGFACE_API_KEY = "op://MCP Servers/HuggingFace/api_key";
    } else if (packageName.includes('github')) {
      serverConfig.env.GITHUB_PERSONAL_ACCESS_TOKEN = "op://MCP Servers/GitHub/token";
    } else if (packageName.includes('postgres')) {
      serverConfig.env.DATABASE_URL = "op://MCP Servers/PostgreSQL/connection_string";
    } else if (packageName.includes('redis')) {
      serverConfig.env.REDIS_URL = "redis://localhost:6379";
    }

    mcpServers[serverName] = serverConfig;
  });

  // Always include our core servers
  mcpServers["pixi"] = {
    "command": "pixi",
    "args": ["run", "--manifest-path", "/Users/daniellynch/Developer/pixi.toml", "python"],
    "env": {
      "PIXI_PROJECT_MANIFEST": "/Users/daniellynch/Developer/pixi.toml",
      "NODE_ENV": "production"
    }
  };

  mcpServers["transformers"] = {
    "command": "python",
    "args": ["-c", "import torch; import transformers; print('Transformers ready')"],
    "env": {
      "PYTHONPATH": "/Users/daniellynch/Developer",
      "NODE_ENV": "production"
    }
  };

  const config = {
    "$schema": "https://modelcontextprotocol.io/schema/mcp-config.json",
    "version": "2.0.0",
    "description": `SSOT MCP Configuration - Synchronized with GitHub MCP Catalog (${new Date().toISOString()})`,
    "mcpServers": mcpServers,
    "metadata": {
      "lastSync": new Date().toISOString(),
      "totalServers": Object.keys(mcpServers).length,
      "catalogRepos": catalogRepos.length,
      "sources": MCP_SOURCES.map(s => s.name)
    }
  };

  return config;
}

async function backupCurrentConfig() {
  if (fs.existsSync(CURSOR_MCP_CONFIG)) {
    const backupPath = CURSOR_MCP_CONFIG + BACKUP_SUFFIX;
    fs.copyFileSync(CURSOR_MCP_CONFIG, backupPath);
    console.log(`📋 Backed up current config to ${backupPath}`);
  }
}

async function updateMCPConfig() {
  try {
    console.log('🚀 Starting MCP GitHub catalog synchronization...');

    // Backup current config
    await backupCurrentConfig();

    // Fetch catalog
    const catalogRepos = await fetchMCPCatalog();

    // Generate new config
    const newConfig = generateMCPConfig(catalogRepos);

    // Write new config
    fs.writeFileSync(CURSOR_MCP_CONFIG, JSON.stringify(newConfig, null, 2));
    console.log(`✅ Updated ${CURSOR_MCP_CONFIG} with ${Object.keys(newConfig.mcpServers).length} MCP servers`);

    // Validate config
    const testConfig = JSON.parse(fs.readFileSync(CURSOR_MCP_CONFIG, 'utf8'));
    console.log(`🔍 Configuration validated: ${Object.keys(testConfig.mcpServers).length} servers configured`);

    console.log('🎉 MCP catalog synchronization complete!');

  } catch (error) {
    console.error('❌ MCP synchronization failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  updateMCPConfig();
}

module.exports = { updateMCPConfig, fetchMCPCatalog, generateMCPConfig };