#!/usr/bin/env node

/**
 * MCP Connectivity Test
 * Tests MCP server connectivity and configuration
 */

const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

const SERVER_ENDPOINT = 'http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab';
const LOG_PATH = '/Users/daniellynch/Developer/.cursor/debug.log';

class MCPTester {
  constructor() {
    this.results = {};
  }

  log(hypothesisId, message, data = {}) {
    const logEntry = {
      sessionId: 'mcp-debug-session',
      runId: 'initial-test',
      hypothesisId,
      location: 'test-mcp-connectivity.cjs',
      message,
      data,
      timestamp: Date.now()
    };

    // Write to file
    const fs = require('fs');
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(LOG_PATH, logLine);

    // Send to server
    fetch(SERVER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(() => {});
  }

  async testAll() {
    console.log('🔍 Testing MCP connectivity...');

    this.log('A', 'Starting MCP connectivity tests', { timestamp: new Date().toISOString() });

    try {
      // Test 1: Check which MCP config file is being used
      await this.testConfigFiles();

      // Test 2: Check if MCP servers are running
      await this.testServerProcesses();

      // Test 3: Test actual MCP connectivity
      await this.testMCPConnectivity();

      // Test 4: Check API keys availability
      await this.testAPIKeys();

      // Test 5: Test Cursor IDE integration
      await this.testCursorIntegration();

      this.log('A', 'MCP connectivity tests completed', { results: this.results });

    } catch (error) {
      this.log('A', 'MCP connectivity test failed', { error: error.message });
      console.error('❌ MCP test failed:', error.message);
    }
  }

  async testConfigFiles() {
    this.log('B', 'Testing MCP configuration files');

    const configFiles = [
      '/Users/daniellynch/.cursor/mcp.json',
      '/Users/daniellynch/.claude/mcp.json',
      '/Users/daniellynch/Library/Application Support/Claude/claude_desktop_config.json'
    ];

    for (const file of configFiles) {
      try {
        const fs = require('fs');
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          const config = JSON.parse(content);
          const serverCount = config.mcpServers ? Object.keys(config.mcpServers).length : 0;

          this.results[file] = { exists: true, serverCount, lastModified: fs.statSync(file).mtime.toISOString() };
          this.log('B', `Config file ${file} exists`, { serverCount, lastModified: this.results[file].lastModified });
        } else {
          this.results[file] = { exists: false };
          this.log('B', `Config file ${file} does not exist`);
        }
      } catch (error) {
        this.results[file] = { exists: true, error: error.message };
        this.log('B', `Error reading ${file}`, { error: error.message });
      }
    }
  }

  async testServerProcesses() {
    this.log('C', 'Testing MCP server processes');

    try {
      // Check for running MCP-related processes
      const processes = execSync('ps aux | grep -i mcp | grep -v grep', { encoding: 'utf8' });
      const lines = processes.split('\n').filter(line => line.trim());

      this.results.processes = { count: lines.length, details: lines };
      this.log('C', `Found ${lines.length} MCP-related processes`, { processDetails: lines.slice(0, 5) });

      // Check for Node.js processes that might be MCP servers
      const nodeProcesses = execSync('ps aux | grep node | grep -v grep', { encoding: 'utf8' });
      const nodeLines = nodeProcesses.split('\n').filter(line => line.trim() && line.includes('mcp'));

      this.results.nodeProcesses = { count: nodeLines.length, details: nodeLines };
      this.log('C', `Found ${nodeLines.length} Node.js MCP processes`, { nodeDetails: nodeLines.slice(0, 5) });

    } catch (error) {
      this.results.processes = { error: error.message };
      this.log('C', 'Error checking processes', { error: error.message });
    }
  }

  async testMCPConnectivity() {
    this.log('D', 'Testing actual MCP connectivity');

    const testServers = [
      { name: 'filesystem', port: 7243 },
      { name: 'universal', port: 7243 },
      { name: 'ollama', port: 11434 }
    ];

    for (const server of testServers) {
      try {
        const response = await this.testHttpConnection('localhost', server.port);
        this.results[`${server.name}_connectivity`] = {
          reachable: response.success,
          responseTime: response.responseTime,
          statusCode: response.statusCode
        };

        this.log('D', `MCP server ${server.name} connectivity test`, {
          port: server.port,
          reachable: response.success,
          responseTime: response.responseTime
        });

      } catch (error) {
        this.results[`${server.name}_connectivity`] = { error: error.message };
        this.log('D', `MCP server ${server.name} connectivity failed`, { error: error.message });
      }
    }
  }

  async testAPIKeys() {
    this.log('E', 'Testing API key availability');

    const requiredKeys = [
      'GITHUB_PERSONAL_ACCESS_TOKEN',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'HUGGINGFACE_API_KEY'
    ];

    for (const key of requiredKeys) {
      const value = process.env[key];
      const exists = !!value;
      const length = value ? value.length : 0;
      const prefix = value ? value.substring(0, 10) + '...' : null;

      this.results[`${key}_availability`] = {
        exists,
        length,
        hasPrefix: !!prefix
      };

      this.log('E', `API key ${key} check`, {
        exists,
        length,
        hasPrefix: !!prefix
      });
    }
  }

  async testCursorIntegration() {
    this.log('F', 'Testing Cursor IDE integration');

    try {
      // Check if Cursor is running
      const cursorProcesses = execSync('ps aux | grep -i cursor | grep -v grep', { encoding: 'utf8' });
      const cursorRunning = cursorProcesses.split('\n').filter(line => line.trim()).length > 0;

      this.results.cursorRunning = cursorRunning;
      this.log('F', 'Cursor IDE status check', { running: cursorRunning });

      // Check Cursor config directory
      const fs = require('fs');
      const cursorConfigDir = '/Users/daniellynch/.cursor';
      const configExists = fs.existsSync(cursorConfigDir);

      this.results.cursorConfigExists = configExists;
      this.log('F', 'Cursor config directory check', { exists: configExists });

      if (configExists) {
        const items = fs.readdirSync(cursorConfigDir);
        this.results.cursorConfigItems = items;
        this.log('F', 'Cursor config directory contents', { itemCount: items.length, items: items.slice(0, 10) });
      }

    } catch (error) {
      this.results.cursorIntegration = { error: error.message };
      this.log('F', 'Cursor integration test failed', { error: error.message });
    }
  }

  async testHttpConnection(host, port, useHttps = false) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const options = {
        hostname: host,
        port: port,
        path: '/',
        method: 'GET',
        timeout: 5000,
        rejectUnauthorized: false
      };

      const req = (useHttps ? https : http).request(options, (res) => {
        const responseTime = Date.now() - startTime;
        resolve({ success: true, responseTime, statusCode: res.statusCode });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Request timeout' });
      });

      req.end();
    });
  }

  printResults() {
    console.log('\n📊 MCP Connectivity Test Results:');
    console.log('================================');

    console.log('\n🔧 Configuration Files:');
    Object.entries(this.results).forEach(([key, value]) => {
      if (key.includes('mcp.json') || key.includes('claude_desktop_config.json')) {
        console.log(`  ${key}: ${value.exists ? '✅' : '❌'} (${value.serverCount || 0} servers)`);
      }
    });

    console.log('\n⚙️ Running Processes:');
    console.log(`  MCP processes: ${this.results.processes?.count || 0}`);
    console.log(`  Node MCP processes: ${this.results.nodeProcesses?.count || 0}`);

    console.log('\n🌐 Server Connectivity:');
    Object.entries(this.results).forEach(([key, value]) => {
      if (key.includes('_connectivity')) {
        const serverName = key.replace('_connectivity', '');
        console.log(`  ${serverName}: ${value.reachable ? '✅' : '❌'} (${value.responseTime || 'N/A'}ms)`);
      }
    });

    console.log('\n🔑 API Keys:');
    Object.entries(this.results).forEach(([key, value]) => {
      if (key.includes('_availability')) {
        const keyName = key.replace('_availability', '');
        console.log(`  ${keyName}: ${value.exists ? '✅' : '❌'}`);
      }
    });

    console.log('\n💻 Cursor IDE:');
    console.log(`  Running: ${this.results.cursorRunning ? '✅' : '❌'}`);
    console.log(`  Config exists: ${this.results.cursorConfigExists ? '✅' : '❌'}`);
  }
}

// Run test if called directly
if (require.main === module) {
  const tester = new MCPTester();
  tester.testAll().then(() => {
    tester.printResults();
  }).catch(console.error);
}

module.exports = MCPTester;