#!/usr/bin/env node

/**
 * MCP AUTO-SYNC - Automated synchronization with GitHub CLI and catalog
 *
 * This script maintains the canonical MCP configuration and ensures
 * Cursor IDE stays synchronized with the latest MCP server catalog.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CANONICAL_CONFIG = path.join(process.env.HOME, '.canonical-mcp.json');
const CURSOR_SETTINGS = path.join(process.env.HOME, 'Library/Application Support/Cursor/User/settings.json');
const SYNC_LOG = path.join(process.env.HOME, '.mcp-sync.log');

class MCPAutoSync {
  constructor() {
    this.log(`🔄 MCP AUTO-SYNC STARTED`);
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '🔴' : level === 'success' ? '✅' : level === 'warning' ? '⚠️' : '🔵';
    const logMessage = `${prefix} [${timestamp}] ${message}`;

    console.log(logMessage);

    // Append to sync log
    try {
      fs.appendFileSync(SYNC_LOG, logMessage + '\n');
    } catch (error) {
      // Ignore log write errors
    }
  }

  async syncWithGitHub() {
    this.log('Synchronizing with GitHub MCP catalog...');

    try {
      // Check if GitHub CLI is available and authenticated
      execSync('gh auth status', { stdio: 'pipe' });
      this.log('GitHub CLI authenticated', 'success');

      // Fetch latest MCP servers from GitHub using REST API (more reliable)
      const result = execSync('gh api search/repositories?q=topic:mcp-server+topic:mcp&per_page=20', {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      const data = JSON.parse(result);
      const repos = data.items.map(repo => ({
        nameWithOwner: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        updatedAt: repo.updated_at,
        topics: repo.topics || []
      }));

      this.log(`Found ${repos.length} MCP repositories on GitHub`, 'success');
      return repos;

    } catch (error) {
      this.log(`GitHub sync failed: ${error.message}`, 'warning');
      return this.getFallbackMCPServers();
    }
  }

  getFallbackMCPServers() {
    // Fallback list of known MCP servers in the same format as GitHub API
    return [
      {
        nameWithOwner: 'modelcontextprotocol/server-filesystem',
        description: 'File system operations MCP server',
        url: 'https://github.com/modelcontextprotocol/server-filesystem',
        updatedAt: new Date().toISOString(),
        topics: ['mcp', 'mcp-server']
      },
      {
        nameWithOwner: 'modelcontextprotocol/server-github',
        description: 'GitHub API MCP server',
        url: 'https://github.com/modelcontextprotocol/server-github',
        updatedAt: new Date().toISOString(),
        topics: ['mcp', 'mcp-server', 'github']
      },
      {
        nameWithOwner: 'modelcontextprotocol/server-sequential-thinking',
        description: 'Sequential thinking MCP server',
        url: 'https://github.com/modelcontextprotocol/server-sequential-thinking',
        updatedAt: new Date().toISOString(),
        topics: ['mcp', 'mcp-server', 'ai']
      },
      {
        nameWithOwner: 'anthropic-ai/mcp-server-memory',
        description: 'Memory management MCP server',
        url: 'https://github.com/anthropic-ai/mcp-server-memory',
        updatedAt: new Date().toISOString(),
        topics: ['mcp', 'mcp-server', 'memory']
      },
      {
        nameWithOwner: 'gofman3/task-master-mcp',
        description: 'Task management MCP server',
        url: 'https://github.com/gofman3/task-master-mcp',
        updatedAt: new Date().toISOString(),
        topics: ['mcp', 'mcp-server', 'task-management']
      }
    ];
  }

  async updateCanonicalConfig() {
    this.log('Updating canonical MCP configuration...');

    try {
      // Read current canonical config
      let config = {
        version: "1.0.0",
        lastSync: new Date().toISOString(),
        source: "auto-sync",
        mcpServers: {},
        metadata: {}
      };

      if (fs.existsSync(CANONICAL_CONFIG)) {
        config = JSON.parse(fs.readFileSync(CANONICAL_CONFIG, 'utf8'));
      }

      config.lastSync = new Date().toISOString();

      // Get GitHub catalog
      const githubRepos = await this.syncWithGitHub();

      // Generate updated MCP server configurations
      config.mcpServers = this.generateMCPServerConfigs(githubRepos);
      config.metadata.lastGitHubSync = new Date().toISOString();
      config.metadata.totalServers = Object.keys(config.mcpServers).length;

      // Save canonical config
      fs.writeFileSync(CANONICAL_CONFIG, JSON.stringify(config, null, 2));
      this.log(`Canonical config updated with ${config.metadata.totalServers} servers`, 'success');

      return config;

    } catch (error) {
      this.log(`Failed to update canonical config: ${error.message}`, 'error');
      throw error;
    }
  }

  generateMCPServerConfigs(githubRepos) {
    // Base server configurations
    const servers = {};

    // Always include core servers
    servers.filesystem = {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", process.env.DEVELOPER_DIR || process.env.HOME],
      env: { NODE_ENV: "production" }
    };

    servers.github = {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: {
        GITHUB_TOKEN: process.env.GITHUB_TOKEN || "${GITHUB_TOKEN}",
        NODE_ENV: "production"
      }
    };

    servers['sequential-thinking'] = {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      env: { NODE_ENV: "production" }
    };

    servers.ollama = {
      command: "ollama-mcp",
      env: {
        OLLAMA_HOST: "http://localhost:11434",
        OLLAMA_API_KEY: process.env.OLLAMA_API_KEY || "",
        OLLAMA_DEFAULT_MODEL: "deepseek-v3.2",
        OLLAMA_WEB_SEARCH_ENABLED: "true",
        OLLAMA_WEB_FETCH_ENABLED: "true",
        OLLAMA_HYBRID_MODE: "true"
      }
    };

    // Add servers from GitHub catalog
    githubRepos.forEach(repo => {
      const serverName = repo.nameWithOwner.split('/')[1].replace('server-', '').replace('mcp-', '');
      if (!servers[serverName]) {
        servers[serverName] = {
          command: "npx",
          args: ["-y", repo.nameWithOwner],
          env: { NODE_ENV: "production" },
          _source: "github-catalog",
          _repo: repo.nameWithOwner,
          _updated: repo.updatedAt
        };
      }
    });

    return servers;
  }

  async updateCursorSettings(canonicalConfig) {
    this.log('Updating Cursor IDE settings...');

    try {
      // Read current settings
      let settings = {};
      if (fs.existsSync(CURSOR_SETTINGS)) {
        settings = JSON.parse(fs.readFileSync(CURSOR_SETTINGS, 'utf8'));
      }

      // Update MCP configuration
      settings.mcp = settings.mcp || {};
      settings.mcp.servers = canonicalConfig.mcpServers;

      // Add sync metadata
      settings.mcp._canonicalSource = CANONICAL_CONFIG;
      settings.mcp._lastSync = canonicalConfig.lastSync;
      settings.mcp._autoSync = true;
      settings.mcp._totalServers = Object.keys(canonicalConfig.mcpServers).length;

      // Write updated settings
      fs.writeFileSync(CURSOR_SETTINGS, JSON.stringify(settings, null, 2));
      this.log('Cursor IDE settings synchronized', 'success');

    } catch (error) {
      this.log(`Failed to update Cursor settings: ${error.message}`, 'error');
      throw error;
    }
  }

  async validateConfiguration() {
    this.log('Validating MCP configuration...');

    try {
      // Check canonical config exists
      if (!fs.existsSync(CANONICAL_CONFIG)) {
        throw new Error('Canonical config not found');
      }

      // Check Cursor settings updated
      if (!fs.existsSync(CURSOR_SETTINGS)) {
        throw new Error('Cursor settings not found');
      }

      const settings = JSON.parse(fs.readFileSync(CURSOR_SETTINGS, 'utf8'));
      if (!settings.mcp || !settings.mcp.servers) {
        throw new Error('MCP servers not configured in Cursor');
      }

      const serverCount = Object.keys(settings.mcp.servers).length;
      this.log(`Configuration validated: ${serverCount} MCP servers configured`, 'success');

      return { valid: true, serverCount };

    } catch (error) {
      this.log(`Configuration validation failed: ${error.message}`, 'error');
      return { valid: false, error: error.message };
    }
  }

  async runAutoSync() {
    try {
      // 1. Update canonical configuration from GitHub
      const canonicalConfig = await this.updateCanonicalConfig();

      // 2. Sync Cursor IDE settings
      await this.updateCursorSettings(canonicalConfig);

      // 3. Validate everything is working
      const validation = await this.validateConfiguration();

      // 4. Generate sync report
      const report = {
        timestamp: new Date().toISOString(),
        success: validation.valid,
        serversConfigured: validation.serverCount || 0,
        canonicalConfig: CANONICAL_CONFIG,
        cursorSettings: CURSOR_SETTINGS,
        lastGitHubSync: canonicalConfig.metadata.lastGitHubSync
      };

      const reportPath = path.join(process.cwd(), 'mcp-auto-sync-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      console.log('\n🎯 MCP AUTO-SYNC COMPLETE');
      console.log(`✅ Servers: ${report.serversConfigured}`);
      console.log(`✅ Valid: ${report.success ? 'YES' : 'NO'}`);
      console.log(`📊 Report: mcp-auto-sync-report.json`);
      console.log(`🔗 Canonical: ${CANONICAL_CONFIG}`);

      if (validation.valid) {
        this.log('🎉 MCP synchronization successful!', 'success');
      }

    } catch (error) {
      this.log(`💥 MCP auto-sync failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run auto-sync
const syncer = new MCPAutoSync();
syncer.runAutoSync();