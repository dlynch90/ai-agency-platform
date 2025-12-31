#!/usr/bin/env node

/**
 * CANONICAL MCP SYNCHRONIZER
 * Single source of truth for MCP server configuration
 *
 * Synchronizes MCP servers from GitHub catalog and updates Cursor IDE
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CANONICAL_MCP_CONFIG = path.join(process.env.HOME, '.canonical-mcp.json');
const CURSOR_SETTINGS = path.join(process.env.HOME, 'Library/Application Support/Cursor/User/settings.json');

class CanonicalMCPSynchronizer {
  constructor() {
    this.canonicalConfig = {
      version: "1.0.0",
      lastSync: new Date().toISOString(),
      source: "github-catalog",
      mcpServers: {},
      dockerServices: {},
      networkHealth: {},
      metadata: {
        synchronized: false,
        cursorUpdated: false,
        dockerChecked: false
      }
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '🔴' : level === 'success' ? '✅' : level === 'warning' ? '⚠️' : '🔵';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async fetchGitHubMCPCatalog() {
    this.log('Fetching MCP servers from GitHub catalog...');

    try {
      // Fetch from GitHub API for MCP servers
      const ghQuery = execSync('gh api graphql -f query=\'query { search(query: "topic:mcp-server", type: REPOSITORY, first: 50) { nodes { nameWithOwner description url topics } } }\'', {
        encoding: 'utf8'
      });

      const ghData = JSON.parse(ghQuery);
      this.log('GitHub MCP catalog fetched successfully', 'success');

      return ghData.data.search.nodes;
    } catch (error) {
      this.log(`GitHub catalog fetch failed: ${error.message}`, 'warning');

      // Fallback to known MCP servers
      return this.getKnownMCPServers();
    }
  }

  getKnownMCPServers() {
    return [
      {
        nameWithOwner: "modelcontextprotocol/server-filesystem",
        description: "File system operations MCP server",
        url: "https://github.com/modelcontextprotocol/server-filesystem",
        topics: ["mcp", "mcp-server", "filesystem"]
      },
      {
        nameWithOwner: "modelcontextprotocol/server-github",
        description: "GitHub API MCP server",
        url: "https://github.com/modelcontextprotocol/server-github",
        topics: ["mcp", "mcp-server", "github"]
      },
      {
        nameWithOwner: "modelcontextprotocol/server-sequential-thinking",
        description: "Sequential thinking MCP server",
        url: "https://github.com/modelcontextprotocol/server-sequential-thinking",
        topics: ["mcp", "mcp-server", "ai"]
      }
    ];
  }

  async checkDockerServices() {
    this.log('Checking Docker services health...');

    try {
      const dockerPs = execSync('docker ps --format json', { encoding: 'utf8' });
      const containers = dockerPs.trim().split('\n').filter(line => line.trim()).map(line => JSON.parse(line));

      const services = {};
      for (const container of containers) {
        const name = container.Names?.[0] || container.ID.substring(0, 12);
        const ports = container.Ports || [];

        services[name] = {
          id: container.ID,
          image: container.Image,
          status: container.Status,
          ports: ports.map(p => p.PublicPort || p.PrivatePort),
          healthy: container.Status.includes('healthy') || container.Status.includes('running')
        };
      }

      this.canonicalConfig.dockerServices = services;
      this.canonicalConfig.metadata.dockerChecked = true;

      this.log(`Found ${Object.keys(services).length} Docker services`, 'success');
    } catch (error) {
      this.log(`Docker check failed: ${error.message}`, 'warning');
      this.canonicalConfig.dockerServices = {};
    }
  }

  async checkNetworkHealth() {
    this.log('Checking network connectivity...');

    const endpoints = [
      { name: 'GitHub API', url: 'https://api.github.com', required: true },
      { name: 'Docker Hub', url: 'https://registry-1.docker.io', required: true },
      { name: 'NPM Registry', url: 'https://registry.npmjs.org', required: true },
      { name: 'PyPI', url: 'https://pypi.org', required: true },
      { name: 'Ollama', url: 'http://localhost:11434', required: false },
      { name: 'PostgreSQL', url: 'http://localhost:5432', required: false },
      { name: 'Redis', url: 'http://localhost:6379', required: false },
      { name: 'Neo4j', url: 'http://localhost:7474', required: false },
      { name: 'Qdrant', url: 'http://localhost:6333', required: false }
    ];

    const health = {};

    for (const endpoint of endpoints) {
      try {
        const curlCmd = endpoint.required ?
          `curl -s --max-time 5 -o /dev/null -w "%{http_code}" "${endpoint.url}"` :
          `timeout 3 bash -c "</dev/tcp/${endpoint.url.replace('http://', '').replace('https://', '').split(':')[0]}/${endpoint.url.split(':')[1] || 80}" && echo "000" || echo "999"`;

        const result = execSync(curlCmd, { encoding: 'utf8' }).trim();
        const isHealthy = result === '200' || result === '000';

        health[endpoint.name] = {
          url: endpoint.url,
          status: isHealthy ? 'healthy' : 'unhealthy',
          responseCode: result,
          required: endpoint.required,
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        health[endpoint.name] = {
          url: endpoint.url,
          status: 'unreachable',
          error: error.message,
          required: endpoint.required,
          lastChecked: new Date().toISOString()
        };
      }
    }

    this.canonicalConfig.networkHealth = health;
    this.log('Network health check completed', 'success');
  }

  generateMCPServerConfig() {
    this.log('Generating MCP server configurations...');

    // Base MCP server configurations
    const mcpServers = {
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", process.env.DEVELOPER_DIR || process.env.HOME],
        "env": {
          "NODE_ENV": "production"
        }
      },
      "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
          "GITHUB_TOKEN": process.env.GITHUB_TOKEN || "${GITHUB_TOKEN}",
          "NODE_ENV": "production"
        }
      },
      "sequential-thinking": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
        "env": {
          "NODE_ENV": "production"
        }
      },
      "ollama": {
        "command": "ollama-mcp",
        "env": {
          "OLLAMA_HOST": "http://localhost:11434",
          "OLLAMA_API_KEY": process.env.OLLAMA_API_KEY || "",
          "OLLAMA_DEFAULT_MODEL": "deepseek-v3.2",
          "OLLAMA_WEB_SEARCH_ENABLED": "true",
          "OLLAMA_WEB_FETCH_ENABLED": "true",
          "OLLAMA_HYBRID_MODE": "true"
        }
      },
      "task-master": {
        "command": "npx",
        "args": ["-y", "@gofman3/task-master-mcp"],
        "env": {
          "NODE_ENV": "production"
        }
      },
      "neo4j": {
        "command": "npx",
        "args": ["-y", "@henrychong-ai/mcp-neo4j-knowledge-graph"],
        "env": {
          "NEO4J_URI": "bolt://localhost:7687",
          "NEO4J_USER": "neo4j",
          "NEO4J_PASSWORD": process.env.NEO4J_PASSWORD || "${NEO4J_PASSWORD}",
          "NODE_ENV": "production"
        }
      },
      "qdrant": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-qdrant"],
        "env": {
          "QDRANT_URL": process.env.QDRANT_URL || "http://localhost:6333",
          "QDRANT_API_KEY": process.env.QDRANT_API_KEY || "${QDRANT_API_KEY}",
          "NODE_ENV": "production"
        }
      },
      "firecrawl": {
        "command": "npx",
        "args": ["-y", "@anthropic-ai/mcp-server-firecrawl"],
        "env": {
          "FIRECRAWL_API_KEY": process.env.FIRECRAWL_API_KEY || "${FIRECRAWL_API_KEY}",
          "NODE_ENV": "production"
        }
      },
      "tavily": {
        "command": "npx",
        "args": ["-y", "@anthropic-ai/mcp-server-tavily"],
        "env": {
          "TAVILY_API_KEY": process.env.TAVILY_API_KEY || "${TAVILY_API_KEY}",
          "NODE_ENV": "production"
        }
      },
      "brave-search": {
        "command": "npx",
        "args": ["-y", "@anthropic-ai/mcp-server-brave-search"],
        "env": {
          "BRAVE_API_KEY": process.env.BRAVE_API_KEY || "${BRAVE_API_KEY}",
          "NODE_ENV": "production"
        }
      }
    };

    this.canonicalConfig.mcpServers = mcpServers;
    this.canonicalConfig.metadata.synchronized = true;

    this.log(`Generated ${Object.keys(mcpServers).length} MCP server configurations`, 'success');
  }

  async updateCursorSettings() {
    this.log('Updating Cursor IDE settings...');

    try {
      // Read current Cursor settings
      let cursorSettings = {};
      if (fs.existsSync(CURSOR_SETTINGS)) {
        cursorSettings = JSON.parse(fs.readFileSync(CURSOR_SETTINGS, 'utf8'));
      }

      // Update MCP servers in Cursor settings
      cursorSettings.mcp = cursorSettings.mcp || {};
      cursorSettings.mcp.servers = this.canonicalConfig.mcpServers;

      // Add metadata
      cursorSettings.mcp._canonicalSource = CANONICAL_MCP_CONFIG;
      cursorSettings.mcp._lastSync = this.canonicalConfig.lastSync;
      cursorSettings.mcp._autoSync = true;

      // Write updated settings
      fs.writeFileSync(CURSOR_SETTINGS, JSON.stringify(cursorSettings, null, 2));

      this.canonicalConfig.metadata.cursorUpdated = true;
      this.log('Cursor IDE settings updated successfully', 'success');

    } catch (error) {
      this.log(`Failed to update Cursor settings: ${error.message}`, 'error');
    }
  }

  saveCanonicalConfig() {
    this.log('Saving canonical MCP configuration...');

    try {
      fs.writeFileSync(CANONICAL_MCP_CONFIG, JSON.stringify(this.canonicalConfig, null, 2));
      this.log(`Canonical config saved to: ${CANONICAL_MCP_CONFIG}`, 'success');
    } catch (error) {
      this.log(`Failed to save canonical config: ${error.message}`, 'error');
    }
  }

  generateSyncReport() {
    const report = {
      timestamp: new Date().toISOString(),
      canonicalConfig: CANONICAL_MCP_CONFIG,
      cursorSettings: CURSOR_SETTINGS,
      summary: {
        mcpServersConfigured: Object.keys(this.canonicalConfig.mcpServers).length,
        dockerServicesFound: Object.keys(this.canonicalConfig.dockerServices).length,
        networkEndpointsChecked: Object.keys(this.canonicalConfig.networkHealth).length,
        synchronized: this.canonicalConfig.metadata.synchronized,
        cursorUpdated: this.canonicalConfig.metadata.cursorUpdated,
        dockerChecked: this.canonicalConfig.metadata.dockerChecked
      },
      health: {
        network: Object.values(this.canonicalConfig.networkHealth).filter(h => h.status === 'healthy').length,
        docker: Object.values(this.canonicalConfig.dockerServices).filter(s => s.healthy).length
      }
    };

    const reportPath = path.join(process.cwd(), 'mcp-sync-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  async runFullSynchronization() {
    console.log('🚀 CANONICAL MCP SYNCHRONIZER STARTED');
    console.log('=====================================');

    try {
      // 1. Fetch from GitHub catalog
      await this.fetchGitHubMCPCatalog();

      // 2. Check Docker services
      await this.checkDockerServices();

      // 3. Check network health
      await this.checkNetworkHealth();

      // 4. Generate MCP server configs
      this.generateMCPServerConfig();

      // 5. Update Cursor settings
      await this.updateCursorSettings();

      // 6. Save canonical config
      this.saveCanonicalConfig();

      // 7. Generate report
      const report = this.generateSyncReport();

      console.log('\n=====================================');
      console.log('🎯 MCP SYNCHRONIZATION COMPLETE');
      console.log(`✅ MCP Servers: ${report.summary.mcpServersConfigured}`);
      console.log(`✅ Docker Services: ${report.summary.dockerServicesFound}`);
      console.log(`✅ Network Endpoints: ${report.summary.networkEndpointsChecked}`);
      console.log(`✅ Cursor Updated: ${report.summary.cursorUpdated ? 'YES' : 'NO'}`);

      console.log('\n📊 Full report saved to: mcp-sync-report.json');
      console.log(`🔗 Canonical config: ${CANONICAL_MCP_CONFIG}`);

    } catch (error) {
      console.error('💥 SYNCHRONIZATION FAILED:', error);
      process.exit(1);
    }
  }
}

// Run the synchronizer
const synchronizer = new CanonicalMCPSynchronizer();
synchronizer.runFullSynchronization();