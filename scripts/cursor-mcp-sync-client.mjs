#!/usr/bin/env node

/**
 * CURSOR MCP SYNC CLIENT
 * Client script for Cursor IDE to sync MCP configuration from canonical URL
 */

import fs from 'fs';
import path from 'path';

const CANONICAL_URL = 'http://localhost:5072/mcp-config';
const CURSOR_SETTINGS = path.join(process.env.HOME, 'Library/Application Support/Cursor/User/settings.json');
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

class CursorMCPSyncClient {
  constructor() {
    this.lastSync = null;
    this.isRunning = false;
  }

  async fetchCanonicalConfig() {
    try {
      const response = await fetch(CANONICAL_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch canonical config:', error.message);
      return null;
    }
  }

  updateCursorSettings(canonicalConfig) {
    try {
      // Read current settings
      let settings = {};
      if (fs.existsSync(CURSOR_SETTINGS)) {
        settings = JSON.parse(fs.readFileSync(CURSOR_SETTINGS, 'utf8'));
      }

      // Update MCP configuration
      settings.mcp = settings.mcp || {};
      settings.mcp.servers = canonicalConfig.mcpServers;
      settings.mcp._canonicalUrl = CANONICAL_URL;
      settings.mcp._lastSync = canonicalConfig.lastSync;
      settings.mcp._source = canonicalConfig.source;
      settings.mcp._autoSync = true;

      // Write updated settings
      fs.writeFileSync(CURSOR_SETTINGS, JSON.stringify(settings, null, 2));

      console.log(`✅ Cursor MCP settings synced: ${Object.keys(canonicalConfig.mcpServers).length} servers`);
      return true;

    } catch (error) {
      console.error('Failed to update Cursor settings:', error.message);
      return false;
    }
  }

  async syncOnce() {
    console.log('🔄 Syncing MCP configuration from canonical URL...');

    const canonicalConfig = await this.fetchCanonicalConfig();
    if (!canonicalConfig) {
      console.error('❌ Failed to fetch canonical configuration');
      return false;
    }

    const success = this.updateCursorSettings(canonicalConfig);
    if (success) {
      this.lastSync = new Date();
    }

    return success;
  }

  async startPeriodicSync() {
    if (this.isRunning) {
      console.log('⚠️  Periodic sync already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting periodic MCP sync (every 5 minutes)...');
    console.log(`📡 Canonical URL: ${CANONICAL_URL}`);

    // Initial sync
    await this.syncOnce();

    // Set up periodic sync
    setInterval(async () => {
      await this.syncOnce();
    }, SYNC_INTERVAL);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping MCP sync client...');
      this.isRunning = false;
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, stopping...');
      this.isRunning = false;
      process.exit(0);
    });
  }

  async runCommandLine() {
    const args = process.argv.slice(2);

    if (args.includes('--once') || args.includes('-o')) {
      // One-time sync
      const success = await this.syncOnce();
      process.exit(success ? 0 : 1);
    } else if (args.includes('--daemon') || args.includes('-d')) {
      // Run as daemon
      await this.startPeriodicSync();
    } else if (args.includes('--status') || args.includes('-s')) {
      // Show status
      console.log('🔍 MCP Sync Client Status');
      console.log(`📡 Canonical URL: ${CANONICAL_URL}`);
      console.log(`⏰ Last sync: ${this.lastSync || 'Never'}`);
      console.log(`🔄 Running: ${this.isRunning ? 'Yes' : 'No'}`);

      // Check canonical server health
      try {
        const response = await fetch('http://localhost:5072/health');
        const health = await response.json();
        console.log(`🏥 Server health: ${health.status}`);
        console.log(`⚙️  Config loaded: ${health.configLoaded ? 'Yes' : 'No'}`);
      } catch (error) {
        console.log(`🏥 Server health: Unreachable (${error.message})`);
      }
    } else {
      // Show help
      console.log('🔧 Cursor MCP Sync Client');
      console.log('');
      console.log('Usage:');
      console.log('  --once, -o     Sync once and exit');
      console.log('  --daemon, -d   Run as daemon with periodic sync');
      console.log('  --status, -s   Show sync status');
      console.log('');
      console.log('Examples:');
      console.log('  node cursor-mcp-sync-client.mjs --once');
      console.log('  node cursor-mcp-sync-client.mjs --daemon');
      console.log('  node cursor-mcp-sync-client.mjs --status');
    }
  }
}

// Run the client if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const client = new CursorMCPSyncClient();
  client.runCommandLine();
}

export default CursorMCPSyncClient;