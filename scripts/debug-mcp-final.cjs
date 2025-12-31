#!/usr/bin/env node

/**
 * FINAL MCP DEBUG SESSION
 * Comprehensive MCP server debugging with runtime evidence
 */

const { execSync } = require('child_process');
const fs = require('fs');

class MCPFinalDebugger {
  constructor() {
    this.results = {};
    this.hypotheses = {
      A: 'Multiple MCP orchestrators conflicting',
      B: 'Port conflicts from killed processes',
      C: 'MCP config not being read by Cursor IDE',
      D: 'Environment variables not propagated',
      E: 'Orchestrator startup race conditions'
    };
  }

  log(hypothesisId, message, data = {}) {
    const logEntry = {
      sessionId: 'mcp-final-debug',
      runId: 'final-analysis',
      hypothesisId,
      location: 'debug-mcp-final.cjs',
      message,
      data,
      timestamp: Date.now()
    };

    console.log(`[${hypothesisId}] ${message}`, data);

    // Write to debug log if available
    try {
      const fs = require('fs');
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync('/tmp/mcp-debug.log', logLine);
    } catch (error) {
      // Ignore if log file not available
    }
  }

  async debugAll() {
    console.log('🔍 FINAL MCP DEBUG SESSION - HYPOTHESES TESTING\n');

    try {
      // Hypothesis A: Multiple MCP orchestrators conflicting
      await this.testMultipleOrchestrators();

      // Hypothesis B: Port conflicts from killed processes
      await this.testPortConflicts();

      // Hypothesis C: MCP config not being read by Cursor IDE
      await this.testCursorConfigReading();

      // Hypothesis D: Environment variables not propagated
      await this.testEnvironmentPropagation();

      // Hypothesis E: Orchestrator startup race conditions
      await this.testStartupRaceConditions();

      this.analyzeResults();

    } catch (error) {
      this.log('ERROR', 'Debug session failed', { error: error.message });
    }
  }

  async testMultipleOrchestrators() {
    this.log('A', 'Testing for multiple MCP orchestrators');

    try {
      // Check for running orchestrator processes
      const orchestrators = execSync('ps aux | grep -E "(orchestrator|mcp.*sync)" | grep -v grep', { encoding: 'utf8' });
      const lines = orchestrators.split('\n').filter(line => line.trim());

      this.results.orchestratorProcesses = lines.length;
      this.log('A', `Found ${lines.length} orchestrator processes`, { processes: lines.slice(0, 3) });

      // Check for multiple MCP server instances
      const mcpServers = execSync('ps aux | grep -E "(mcp.*server|@modelcontextprotocol)" | grep -v grep', { encoding: 'utf8' });
      const mcpLines = mcpServers.split('\n').filter(line => line.trim());

      this.results.mcpServerProcesses = mcpLines.length;
      this.log('A', `Found ${mcpLines.length} MCP server processes`, { servers: mcpLines.slice(0, 3) });

    } catch (error) {
      this.results.orchestratorProcesses = 'error';
      this.log('A', 'Failed to check orchestrator processes', { error: error.message });
    }
  }

  async testPortConflicts() {
    this.log('B', 'Testing for port conflicts');

    const criticalPorts = [5072, 7243, 3000, 5432, 6379, 7474, 6333, 8080];

    for (const port of criticalPorts) {
      try {
        // Check if port is listening
        const netstat = execSync(`netstat -an | grep LISTEN | grep :${port}`, { encoding: 'utf8' });
        const isListening = netstat.trim().length > 0;

        // Check what process is using the port
        const lsof = execSync(`lsof -i :${port} 2>/dev/null || echo "NO_PROCESS"`, { encoding: 'utf8' });
        const hasProcess = !lsof.includes('NO_PROCESS');

        this.results[`port_${port}`] = { listening: isListening, hasProcess };
        this.log('B', `Port ${port} status`, { listening: isListening, hasProcess });

      } catch (error) {
        this.results[`port_${port}`] = { error: error.message };
        this.log('B', `Port ${port} check failed`, { error: error.message });
      }
    }
  }

  async testCursorConfigReading() {
    this.log('C', 'Testing Cursor IDE MCP config reading');

    const cursorConfig = '/Users/daniellynch/.cursor/mcp.json';

    try {
      // Check if config file exists and is readable
      const exists = fs.existsSync(cursorConfig);
      this.log('C', 'Config file existence check', { exists });

      if (exists) {
        const stats = fs.statSync(cursorConfig);
        const content = fs.readFileSync(cursorConfig, 'utf8');
        const config = JSON.parse(content);

        this.results.cursorConfig = {
          exists: true,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          serverCount: config.mcpServers ? Object.keys(config.mcpServers).length : 0,
          hasGithubSync: !!config.github_sync,
          hasNeo4jMappings: !!config.neo4j_mappings
        };

        this.log('C', 'Config file analysis', this.results.cursorConfig);
      } else {
        this.results.cursorConfig = { exists: false };
        this.log('C', 'Config file does not exist');
      }

      // Check if Cursor IDE is running
      const cursorRunning = execSync('ps aux | grep -i cursor | grep -v grep', { encoding: 'utf8' });
      const isRunning = cursorRunning.split('\n').filter(line => line.trim()).length > 0;

      this.results.cursorRunning = isRunning;
      this.log('C', 'Cursor IDE running status', { running: isRunning });

    } catch (error) {
      this.results.cursorConfig = { error: error.message };
      this.log('C', 'Cursor config check failed', { error: error.message });
    }
  }

  async testEnvironmentPropagation() {
    this.log('D', 'Testing environment variable propagation');

    const requiredVars = ['GITHUB_TOKEN', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'HUGGINGFACE_API_KEY'];

    for (const varName of requiredVars) {
      const value = process.env[varName];
      const exists = !!value;
      const length = value ? value.length : 0;

      this.results[`env_${varName}`] = { exists, length };
      this.log('D', `Environment variable ${varName}`, { exists, length });
    }

    // Test if environment variables are available in subprocess
    try {
      const testOutput = execSync('echo "GITHUB_TOKEN=${GITHUB_TOKEN:-NOT_SET}, OPENAI_API_KEY=${OPENAI_API_KEY:-NOT_SET}"', {
        encoding: 'utf8',
        shell: '/bin/bash'
      });

      this.results.envPropagation = testOutput.trim();
      this.log('D', 'Environment propagation test', { output: testOutput.trim() });

    } catch (error) {
      this.results.envPropagation = 'failed';
      this.log('D', 'Environment propagation test failed', { error: error.message });
    }
  }

  async testStartupRaceConditions() {
    this.log('E', 'Testing for startup race conditions');

    try {
      // Check system startup time
      const uptime = execSync('uptime', { encoding: 'utf8' });
      this.log('E', 'System uptime check', { uptime: uptime.trim() });

      // Check if Docker is ready
      const dockerReady = execSync('docker info >/dev/null 2>&1 && echo "ready" || echo "not ready"', { encoding: 'utf8' }).trim();
      this.results.dockerReady = dockerReady === 'ready';
      this.log('E', 'Docker readiness check', { ready: this.results.dockerReady });

      // Check database connectivity timing
      const dbPorts = [5432, 6379, 7474, 6333];
      for (const port of dbPorts) {
        try {
          const startTime = Date.now();
          execSync(`timeout 2 bash -c "</dev/tcp/localhost/${port}" && echo "connected" || echo "failed"`, { stdio: 'pipe' });
          const connectTime = Date.now() - startTime;

          this.results[`db_connect_time_${port}`] = connectTime;
          this.log('E', `Database port ${port} connection time`, { time: connectTime });

        } catch (error) {
          this.results[`db_connect_time_${port}`] = 'timeout';
          this.log('E', `Database port ${port} connection timeout`);
        }
      }

    } catch (error) {
      this.results.startupRaceConditions = { error: error.message };
      this.log('E', 'Startup race condition test failed', { error: error.message });
    }
  }

  analyzeResults() {
    console.log('\n📊 FINAL MCP DEBUG ANALYSIS\n');

    console.log('🔍 HYPOTHESIS EVALUATION:');

    // Hypothesis A: Multiple MCP orchestrators conflicting
    const hasMultipleOrchestrators = this.results.orchestratorProcesses > 1;
    console.log(`A) Multiple orchestrators: ${hasMultipleOrchestrators ? 'CONFIRMED' : 'REJECTED'} (${this.results.orchestratorProcesses} processes)`);

    // Hypothesis B: Port conflicts from killed processes
    const portConflicts = Object.entries(this.results)
      .filter(([key, value]) => key.startsWith('port_') && value.listening && !value.hasProcess)
      .length;
    console.log(`B) Port conflicts: ${portConflicts > 0 ? 'CONFIRMED' : 'REJECTED'} (${portConflicts} conflicts detected)`);

    // Hypothesis C: MCP config not being read by Cursor IDE
    const configReadable = this.results.cursorConfig?.exists && this.results.cursorRunning;
    console.log(`C) Config reading: ${!configReadable ? 'CONFIRMED' : 'REJECTED'} (Config: ${this.results.cursorConfig?.exists}, Cursor: ${this.results.cursorRunning})`);

    // Hypothesis D: Environment variables not propagated
    const envVarsMissing = Object.entries(this.results)
      .filter(([key, value]) => key.startsWith('env_') && !value.exists)
      .length;
    console.log(`D) Environment vars: ${envVarsMissing > 0 ? 'CONFIRMED' : 'REJECTED'} (${envVarsMissing} missing)`);

    // Hypothesis E: Orchestrator startup race conditions
    const startupIssues = !this.results.dockerReady ||
      Object.values(this.results).filter(v => typeof v === 'string' && v === 'timeout').length > 0;
    console.log(`E) Startup race conditions: ${startupIssues ? 'CONFIRMED' : 'REJECTED'}`);

    console.log('\n🎯 RECOMMENDED FIXES:');

    if (hasMultipleOrchestrators) {
      console.log('1. 🔧 Kill conflicting orchestrator processes');
      console.log('   Command: pkill -f orchestrator');
    }

    if (portConflicts > 0) {
      console.log('2. 🔧 Free occupied ports');
      console.log('   Command: lsof -ti:PORT | xargs kill -9');
    }

    if (!configReadable) {
      console.log('3. 🔧 Verify Cursor MCP config');
      console.log('   File: /Users/daniellynch/.cursor/mcp.json');
    }

    if (envVarsMissing > 0) {
      console.log('4. 🔧 Set missing environment variables');
      console.log('   Example: export GITHUB_TOKEN=your_token');
    }

    if (startupIssues) {
      console.log('5. 🔧 Fix startup dependencies');
      console.log('   Ensure Docker and databases start before MCP servers');
    }
  }
}

// Run debug if called directly
if (require.main === module) {
  const mcpDebugger = new MCPFinalDebugger();
  mcpDebugger.debugAll().catch(console.error);
}

module.exports = MCPFinalDebugger;