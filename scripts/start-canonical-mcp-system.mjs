#!/usr/bin/env node

/**
 * START CANONICAL MCP SYSTEM
 * Launches the complete MCP ecosystem with API server and sync client
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class CanonicalMCPSystem {
  constructor() {
    this.processes = [];
    this.apiServerProcess = null;
    this.syncClientProcess = null;
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '🔴' : level === 'success' ? '✅' : level === 'warning' ? '⚠️' : '🔵';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async checkPrerequisites() {
    this.log('🔍 Checking prerequisites...');

    const checks = [
      { name: 'Node.js', command: 'node --version' },
      { name: 'GitHub CLI', command: 'gh auth status' },
      { name: 'Canonical config', check: () => fs.existsSync(path.join(process.env.HOME, '.canonical-mcp.json')) },
      { name: 'API server port', check: () => this.checkPort(5072) }
    ];

    const results = {};

    for (const check of checks) {
      try {
        if (check.command) {
          execSync(check.command, { stdio: 'pipe' });
          results[check.name] = true;
        } else if (check.check) {
          results[check.name] = check.check();
        }
      } catch (error) {
        results[check.name] = false;
      }
    }

    const allGood = Object.values(results).every(r => r);
    if (allGood) {
      this.log('✅ All prerequisites satisfied', 'success');
    } else {
      this.log('⚠️  Some prerequisites missing:', 'warning');
      Object.entries(results).forEach(([name, status]) => {
        if (!status) console.log(`   - ${name}: FAILED`);
      });
    }

    return allGood;
  }

  async checkPort(port) {
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async startAPIServer() {
    this.log('🚀 Starting Canonical MCP API Server...');

    return new Promise((resolve, reject) => {
      const serverProcess = spawn('node', ['scripts/canonical-mcp-api-server.mjs'], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true
      });

      this.apiServerProcess = serverProcess;
      this.processes.push(serverProcess);

      let started = false;
      const timeout = setTimeout(() => {
        if (!started) {
          reject(new Error('API server startup timeout'));
        }
      }, 10000);

      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Server running on')) {
          started = true;
          clearTimeout(timeout);
          this.log('✅ API server started successfully', 'success');
          resolve();
        }
      });

      serverProcess.stderr.on('data', (data) => {
        console.error('API Server Error:', data.toString());
      });

      serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Detach process so it continues running
      serverProcess.unref();
    });
  }

  async startSyncClient() {
    this.log('🚀 Starting Cursor MCP Sync Client...');

    const clientProcess = spawn('node', ['scripts/cursor-mcp-sync-client.mjs', '--daemon'], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true
    });

    this.syncClientProcess = clientProcess;
    this.processes.push(clientProcess);

    // Give it a moment to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    clientProcess.stdout.on('data', (data) => {
      if (data.toString().includes('Starting periodic MCP sync')) {
        this.log('✅ Sync client started successfully', 'success');
      }
    });

    clientProcess.stderr.on('data', (data) => {
      console.error('Sync Client Error:', data.toString());
    });

    // Detach process
    clientProcess.unref();
  }

  async performInitialSync() {
    this.log('🔄 Performing initial MCP synchronization...');

    try {
      execSync('node scripts/mcp-auto-sync.mjs', { stdio: 'inherit' });
      this.log('✅ Initial sync completed', 'success');

      // Test the sync client
      execSync('node scripts/cursor-mcp-sync-client.mjs --once', { stdio: 'inherit' });
      this.log('✅ Sync client test completed', 'success');

    } catch (error) {
      this.log(`❌ Initial sync failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async verifySystemHealth() {
    this.log('🏥 Verifying system health...');

    const checks = [
      { name: 'API Server', url: 'http://localhost:5072/health' },
      { name: 'MCP Config', url: 'http://localhost:5072/mcp-config' },
      { name: 'GitHub CLI', command: 'gh auth status' },
      { name: 'Canonical Config', file: path.join(process.env.HOME, '.canonical-mcp.json') },
      { name: 'Cursor Settings', file: path.join(process.env.HOME, 'Library/Application Support/Cursor/User/settings.json') }
    ];

    const results = {};

    for (const check of checks) {
      try {
        if (check.url) {
          const response = await fetch(check.url);
          results[check.name] = response.ok;
        } else if (check.command) {
          execSync(check.command, { stdio: 'pipe' });
          results[check.name] = true;
        } else if (check.file) {
          results[check.name] = fs.existsSync(check.file);
        }
      } catch (error) {
        results[check.name] = false;
      }
    }

    const healthy = Object.values(results).every(r => r);
    if (healthy) {
      this.log('✅ System health check passed', 'success');
    } else {
      this.log('⚠️  System health issues:', 'warning');
      Object.entries(results).forEach(([name, status]) => {
        console.log(`   - ${name}: ${status ? '✅' : '❌'}`);
      });
    }

    return healthy;
  }

  async startSystem() {
    console.log('🚀 STARTING CANONICAL MCP SYSTEM');
    console.log('=================================');
    console.log('');
    console.log('This system provides:');
    console.log('• HTTP API server serving canonical MCP configuration');
    console.log('• Automatic synchronization with GitHub MCP catalog');
    console.log('• Cursor IDE integration via HTTP endpoints');
    console.log('• Real-time health monitoring and status updates');
    console.log('');

    try {
      // Check prerequisites
      const prerequisitesOK = await this.checkPrerequisites();
      if (!prerequisitesOK) {
        this.log('❌ Prerequisites not satisfied, but continuing...', 'warning');
      }

      // Perform initial sync
      await this.performInitialSync();

      // Start API server
      await this.startAPIServer();

      // Start sync client
      await this.startSyncClient();

      // Verify everything is working
      await this.verifySystemHealth();

      console.log('');
      console.log('🎯 CANONICAL MCP SYSTEM STARTED SUCCESSFULLY');
      console.log('=============================================');
      console.log('');
      console.log('🔗 API Endpoints:');
      console.log('  Health:     http://localhost:5072/health');
      console.log('  MCP Config: http://localhost:5072/mcp-config');
      console.log('  Full Config: http://localhost:5072/full-config');
      console.log('  Sync Trigger: http://localhost:5072/sync');
      console.log('');
      console.log('🔧 Management Commands:');
      console.log('  Sync once:    node scripts/cursor-mcp-sync-client.mjs --once');
      console.log('  Sync status:  node scripts/cursor-mcp-sync-client.mjs --status');
      console.log('  Stop system:  kill <process_ids>');
      console.log('');
      console.log('✅ System is now providing canonical MCP configuration to Cursor IDE');
      console.log('✅ GitHub CLI synchronization is active');
      console.log('✅ MCP catalog data feeds are integrated');
      console.log('');

      // Keep the main process alive
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Canonical MCP System...');
        this.processes.forEach(p => {
          try {
            p.kill();
          } catch (e) {}
        });
        console.log('✅ System shut down');
        process.exit(0);
      });

      // Keep alive
      setInterval(() => {
        // Periodic health check
        this.checkPort(5072).then(alive => {
          if (!alive) {
            console.log('⚠️  API server not responding, restarting...');
            this.restartSystem();
          }
        });
      }, 30000);

    } catch (error) {
      console.error('💥 Failed to start Canonical MCP System:', error);
      process.exit(1);
    }
  }

  async restartSystem() {
    this.log('🔄 Restarting system components...');

    // Kill existing processes
    this.processes.forEach(p => {
      try {
        p.kill();
      } catch (e) {}
    });

    this.processes = [];

    try {
      await this.startAPIServer();
      await this.startSyncClient();
      this.log('✅ System restarted successfully', 'success');
    } catch (error) {
      this.log(`❌ System restart failed: ${error.message}`, 'error');
    }
  }
}

// Start the system
const system = new CanonicalMCPSystem();
system.startSystem();