#!/usr/bin/env node

/**
 * CANONICAL MCP API SERVER
 * Serves MCP configuration via HTTP endpoint for Cursor IDE
 */

import { createServer } from 'http';
import fs from 'fs';
import path from 'path';

const CANONICAL_CONFIG = path.join(process.env.HOME, '.canonical-mcp.json');
const PORT = 5072;

class MCPAPIServer {
  constructor() {
    this.server = null;
    this.canonicalConfig = null;
  }

  loadCanonicalConfig() {
    try {
      if (fs.existsSync(CANONICAL_CONFIG)) {
        this.canonicalConfig = JSON.parse(fs.readFileSync(CANONICAL_CONFIG, 'utf8'));
        return true;
      }
    } catch (error) {
      console.error('Failed to load canonical config:', error.message);
    }
    return false;
  }

  handleRequest(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        configLoaded: !!this.canonicalConfig
      }));
      return;
    }

    if (url.pathname === '/mcp-config') {
      if (!this.canonicalConfig) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Canonical config not loaded' }));
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'ETag': `"${this.canonicalConfig.lastSync}"`
      });
      res.end(JSON.stringify({
        mcpServers: this.canonicalConfig.mcpServers,
        lastSync: this.canonicalConfig.lastSync,
        source: this.canonicalConfig.source,
        version: this.canonicalConfig.version
      }));
      return;
    }

    if (url.pathname === '/full-config') {
      if (!this.canonicalConfig) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Canonical config not loaded' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.canonicalConfig));
      return;
    }

    if (url.pathname === '/sync') {
      // Trigger sync
      this.triggerSync().then(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'sync_triggered' }));
      }).catch(error => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      });
      return;
    }

    // 404 for unknown routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  async triggerSync() {
    const { execSync } = await import('child_process');

    try {
      console.log('🔄 Triggering MCP sync...');
      execSync('node scripts/mcp-auto-sync.mjs', { stdio: 'inherit' });

      // Reload config
      this.loadCanonicalConfig();
      console.log('✅ Sync completed and config reloaded');
    } catch (error) {
      console.error('❌ Sync failed:', error.message);
      throw error;
    }
  }

  start() {
    console.log('🚀 STARTING CANONICAL MCP API SERVER');
    console.log(`📡 Server will listen on http://localhost:${PORT}`);
    console.log(`🔗 MCP Config endpoint: http://localhost:${PORT}/mcp-config`);
    console.log(`🔗 Full Config endpoint: http://localhost:${PORT}/full-config`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🔄 Sync trigger: http://localhost:${PORT}/sync`);

    // Load initial config
    if (!this.loadCanonicalConfig()) {
      console.warn('⚠️  Canonical config not found, server starting without config');
    }

    this.server = createServer((req, res) => this.handleRequest(req, res));

    this.server.listen(PORT, 'localhost', () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);

      // Set up config file watcher
      if (fs.existsSync(CANONICAL_CONFIG)) {
        fs.watchFile(CANONICAL_CONFIG, { interval: 5000 }, () => {
          console.log('📝 Canonical config updated, reloading...');
          this.loadCanonicalConfig();
        });
      }
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down MCP API server...');
      if (this.server) {
        this.server.close(() => {
          console.log('✅ Server shut down gracefully');
          process.exit(0);
        });
      }
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down...');
      if (this.server) {
        this.server.close(() => process.exit(0));
      }
    });
  }
}

// Start the server
const server = new MCPAPIServer();
server.start();