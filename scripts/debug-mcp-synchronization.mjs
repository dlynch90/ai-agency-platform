#!/usr/bin/env node

/**
 * DEBUG MCP SYNCHRONIZATION - CANONICAL CONFIGURATION ANALYSIS
 * Systematic debugging of MCP server synchronization issues
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SERVER_ENDPOINT = 'http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab';
const LOG_PATH = '/Users/daniellynch/Developer/.cursor/debug-mcp-sync.log';

// #region agent log - Hypothesis A: Multiple MCP config files causing confusion
function logHypothesisA(location, message, data = {}) {
  const payload = {
    sessionId: 'mcp-sync-debug',
    runId: 'hypothesis-a',
    hypothesisId: 'A',
    location,
    message,
    data: { ...data, hypothesis: 'Multiple MCP config files causing confusion' },
    timestamp: Date.now()
  };

  try {
    fetch(SERVER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (e) {
    const logLine = JSON.stringify(payload) + '\n';
    fs.appendFileSync(LOG_PATH, logLine);
  }
}
// #endregion

// #region agent log - Hypothesis B: Cursor IDE settings not synchronized
function logHypothesisB(location, message, data = {}) {
  const payload = {
    sessionId: 'mcp-sync-debug',
    runId: 'hypothesis-b',
    hypothesisId: 'B',
    location,
    message,
    data: { ...data, hypothesis: 'Cursor IDE settings not synchronized' },
    timestamp: Date.now()
  };

  try {
    fetch(SERVER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (e) {
    const logLine = JSON.stringify(payload) + '\n';
    fs.appendFileSync(LOG_PATH, logLine);
  }
}
// #endregion

// #region agent log - Hypothesis C: Missing GitHub CLI integration
function logHypothesisC(location, message, data = {}) {
  const payload = {
    sessionId: 'mcp-sync-debug',
    runId: 'hypothesis-c',
    hypothesisId: 'C',
    location,
    message,
    data: { ...data, hypothesis: 'Missing GitHub CLI integration' },
    timestamp: Date.now()
  };

  try {
    fetch(SERVER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (e) {
    const logLine = JSON.stringify(payload) + '\n';
    fs.appendFileSync(LOG_PATH, logLine);
  }
}
// #endregion

// #region agent log - Hypothesis D: MCP registry not pulling from GitHub API
function logHypothesisD(location, message, data = {}) {
  const payload = {
    sessionId: 'mcp-sync-debug',
    runId: 'hypothesis-d',
    hypothesisId: 'D',
    location,
    message,
    data: { ...data, hypothesis: 'MCP registry not pulling from GitHub API' },
    timestamp: Date.now()
  };

  try {
    fetch(SERVER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (e) {
    const logLine = JSON.stringify(payload) + '\n';
    fs.appendFileSync(LOG_PATH, logLine);
  }
}
// #endregion

// #region agent log - Hypothesis E: Docker/API gateway integration missing
function logHypothesisE(location, message, data = {}) {
  const payload = {
    sessionId: 'mcp-sync-debug',
    runId: 'hypothesis-e',
    hypothesisId: 'E',
    location,
    message,
    data: { ...data, hypothesis: 'Docker/API gateway integration missing' },
    timestamp: Date.now()
  };

  try {
    fetch(SERVER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (e) {
    const logLine = JSON.stringify(payload) + '\n';
    fs.appendFileSync(LOG_PATH, logLine);
  }
}
// #endregion

function analyzeMCPConfiguration() {
  logHypothesisA('debug-mcp-synchronization.mjs:87', 'Starting MCP configuration analysis');

  // Check Cursor IDE settings
  const cursorSettingsPath = path.join(process.env.HOME, 'Library/Application Support/Cursor/User/settings.json');
  try {
    const cursorSettings = JSON.parse(fs.readFileSync(cursorSettingsPath, 'utf8'));
    const cursorMcpServers = cursorSettings.mcp?.servers || {};
    logHypothesisB('debug-mcp-synchronization.mjs:93', 'Cursor IDE MCP configuration', {
      mcpServersCount: Object.keys(cursorMcpServers).length,
      mcpServers: Object.keys(cursorMcpServers)
    });
  } catch (error) {
    logHypothesisB('debug-mcp-synchronization.mjs:97', 'Failed to read Cursor settings', {
      error: error.message
    });
  }

  // Check workspace MCP configurations
  const workspaceMcpFiles = [
    'configs/mcp/mcp.json',
    'mcp/configs/mcp-registry.json',
    'configs/mcp-config.toml'
  ];

  for (const mcpFile of workspaceMcpFiles) {
    try {
      const filePath = path.join(process.cwd(), mcpFile);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        let parsed;
        try {
          parsed = JSON.parse(content);
        } catch (e) {
          parsed = { raw: true, content: content.substring(0, 200) };
        }

        logHypothesisA('debug-mcp-synchronization.mjs:116', `Found MCP config file: ${mcpFile}`, {
          file: mcpFile,
          exists: true,
          mcpServersCount: parsed.mcpServers ? Object.keys(parsed.mcpServers).length : 'unknown',
          type: parsed.raw ? 'non-json' : 'json'
        });
      } else {
        logHypothesisA('debug-mcp-synchronization.mjs:122', `MCP config file not found: ${mcpFile}`, {
          file: mcpFile,
          exists: false
        });
      }
    } catch (error) {
      logHypothesisA('debug-mcp-synchronization.mjs:127', `Error checking MCP config file: ${mcpFile}`, {
        file: mcpFile,
        error: error.message
      });
    }
  }

  // Check GitHub CLI integration
  try {
    const ghVersion = execSync('gh --version', { encoding: 'utf8' });
    logHypothesisC('debug-mcp-synchronization.mjs:135', 'GitHub CLI available', {
      version: ghVersion.trim()
    });

    // Check if authenticated
    try {
      const ghAuth = execSync('gh auth status', { encoding: 'utf8' });
      logHypothesisC('debug-mcp-synchronization.mjs:141', 'GitHub CLI authenticated', {
        status: 'authenticated'
      });
    } catch (error) {
      logHypothesisC('debug-mcp-synchronization.mjs:145', 'GitHub CLI not authenticated', {
        error: error.message
      });
    }
  } catch (error) {
    logHypothesisC('debug-mcp-synchronization.mjs:150', 'GitHub CLI not available', {
      error: error.message
    });
  }

  // Check for MCP catalog/registry endpoints
  const potentialCatalogUrls = [
    'https://registry.npmjs.org/-/v1/search?text=@modelcontextprotocol',
    'https://api.github.com/search/repositories?q=topic:mcp-server',
    'https://raw.githubusercontent.com/modelcontextprotocol/registry/main/servers.json'
  ];

  for (const url of potentialCatalogUrls) {
    try {
      // Simple connectivity check
      const curlResult = execSync(`curl -s --max-time 5 -o /dev/null -w "%{http_code}" "${url}"`, {
        encoding: 'utf8'
      });

      logHypothesisD('debug-mcp-synchronization.mjs:166', `MCP catalog endpoint check: ${url}`, {
        url,
        httpCode: curlResult.trim(),
        accessible: curlResult.trim() === '200'
      });
    } catch (error) {
      logHypothesisD('debug-mcp-synchronization.mjs:172', `MCP catalog endpoint check failed: ${url}`, {
        url,
        error: error.message
      });
    }
  }

  // Check Docker network and API gateway health
  try {
    const dockerPs = execSync('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"', {
      encoding: 'utf8'
    });
    logHypothesisE('debug-mcp-synchronization.mjs:182', 'Docker containers status', {
      containers: dockerPs.trim().split('\n').slice(1) // Skip header
    });
  } catch (error) {
    logHypothesisE('debug-mcp-synchronization.mjs:186', 'Docker check failed', {
      error: error.message
    });
  }

  // Check network connectivity to key services
  const networkChecks = [
    { name: 'GitHub API', url: 'https://api.github.com' },
    { name: 'Docker Hub', url: 'https://registry-1.docker.io' },
    { name: 'NPM Registry', url: 'https://registry.npmjs.org' },
    { name: 'PyPI', url: 'https://pypi.org' }
  ];

  for (const check of networkChecks) {
    try {
      const curlResult = execSync(`curl -s --max-time 3 -o /dev/null -w "%{http_code}" "${check.url}"`, {
        encoding: 'utf8'
      });

      logHypothesisE('debug-mcp-synchronization.mjs:202', `Network connectivity check: ${check.name}`, {
        service: check.name,
        url: check.url,
        httpCode: curlResult.trim(),
        accessible: curlResult.trim() === '200'
      });
    } catch (error) {
      logHypothesisE('debug-mcp-synchronization.mjs:209', `Network connectivity check failed: ${check.name}`, {
        service: check.name,
        url: check.url,
        error: error.message
      });
    }
  }
}

function analyzeCanonicalConfiguration() {
  logHypothesisA('debug-mcp-synchronization.mjs:218', 'Analyzing canonical configuration requirements');

  // The user mentioned "one canonical URL" - let's check what they mean
  // Check for environment variables that might point to canonical config
  const envVars = [
    'MCP_CONFIG_URL',
    'MCP_REGISTRY_URL',
    'CURSOR_MCP_CONFIG',
    'GITHUB_MCP_CATALOG'
  ];

  for (const envVar of envVars) {
    const value = process.env[envVar];
    logHypothesisA('debug-mcp-synchronization.mjs:229', `Environment variable check: ${envVar}`, {
      variable: envVar,
      value: value || 'not set',
      set: !!value
    });
  }

  // Check for dotfiles that might contain canonical config
  const dotfiles = [
    '.mcp-config',
    '.cursor-mcp',
    '.mcp-registry',
    '.mcp-catalog'
  ];

  for (const dotfile of dotfiles) {
    const dotfilePath = path.join(process.env.HOME, dotfile);
    try {
      if (fs.existsSync(dotfilePath)) {
        const content = fs.readFileSync(dotfilePath, 'utf8');
        logHypothesisA('debug-mcp-synchronization.mjs:244', `Dotfile found: ${dotfile}`, {
          file: dotfile,
          exists: true,
          size: content.length,
          content: content.substring(0, 100) + (content.length > 100 ? '...' : '')
        });
      } else {
        logHypothesisA('debug-mcp-synchronization.mjs:250', `Dotfile not found: ${dotfile}`, {
          file: dotfile,
          exists: false
        });
      }
    } catch (error) {
      logHypothesisA('debug-mcp-synchronization.mjs:255', `Error checking dotfile: ${dotfile}`, {
        file: dotfile,
        error: error.message
      });
    }
  }
}

// Run the analysis
console.log('🔬 DEBUGGING MCP SYNCHRONIZATION - CANONICAL CONFIGURATION');
console.log('===========================================================');

analyzeMCPConfiguration();
analyzeCanonicalConfiguration();

console.log('\n📊 Debug logs written to:', LOG_PATH);
console.log('🔍 Check the logs to analyze hypotheses A-E');