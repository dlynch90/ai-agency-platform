#!/usr/bin/env node

/**
 * MCP Credential Loader
 * Loads API credentials from 1Password and sets them as environment variables
 * for MCP servers to use
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SERVER_ENDPOINT = 'http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab';
const LOG_PATH = '/Users/daniellynch/Developer/.cursor/debug.log';

class MCPCredentialLoader {
  constructor() {
    this.credentials = {};
  }

  log(hypothesisId, message, data = {}) {
    const logEntry = {
      sessionId: 'mcp-credentials',
      runId: 'credential-load',
      hypothesisId,
      location: 'mcp-credential-loader.cjs',
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

  async loadCredentials() {
    this.log('A', 'Starting MCP credential loading');

    try {
      // Check if op CLI is available
      const opAvailable = this.checkOpAvailability();
      this.log('A', '1Password CLI availability check', { available: opAvailable });

      if (!opAvailable) {
        this.log('A', '1Password CLI not available, cannot load credentials');
        return false;
      }

      // Check if authenticated
      const authenticated = this.checkOpAuthentication();
      this.log('A', '1Password authentication check', { authenticated });

      if (!authenticated) {
        this.log('A', '1Password not authenticated, cannot load credentials');
        return false;
      }

      // Load credentials
      await this.loadFrom1Password();
      this.log('A', 'Credential loading completed', { loadedCount: Object.keys(this.credentials).length });

      // Set environment variables
      this.setEnvironmentVariables();
      this.log('A', 'Environment variables set');

      return true;

    } catch (error) {
      this.log('A', 'Credential loading failed', { error: error.message });
      return false;
    }
  }

  checkOpAvailability() {
    try {
      execSync('which op', { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  checkOpAuthentication() {
    try {
      // Try to list accounts - this will fail if not authenticated
      execSync('op account list', { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  async loadFrom1Password() {
    const credentialMappings = {
      'GITHUB_PERSONAL_ACCESS_TOKEN': 'op://MCP Servers/GitHub/token',
      'OPENAI_API_KEY': 'op://MCP Servers/OpenAI/api_key',
      'ANTHROPIC_API_KEY': 'op://MCP Servers/Anthropic/api_key',
      'HUGGINGFACE_API_KEY': 'op://MCP Servers/HuggingFace/api_key',
      'BRAVE_API_KEY': 'op://MCP Servers/Brave Search/api_key',
      'TAVILY_API_KEY': 'op://MCP Servers/Tavily/api_key',
      'EXA_API_KEY': 'op://MCP Servers/Exa/api_key',
      'FIRECRAWL_API_KEY': 'op://MCP Servers/Firecrawl/api_key',
      'SUPABASE_KEY': 'op://MCP Servers/Supabase/api_key',
      'CLERK_SECRET_KEY': 'op://MCP Servers/Clerk/secret_key',
      'NEO4J_PASSWORD': 'op://MCP Servers/Neo4j/password',
      'QDRANT_API_KEY': 'op://MCP Servers/Qdrant/api_key',
      'MONGODB_URI': 'op://MCP Servers/MongoDB/uri'
    };

    for (const [envVar, opPath] of Object.entries(credentialMappings)) {
      try {
        this.log('B', `Loading credential for ${envVar}`);
        const credential = execSync(`op read "${opPath}"`, {
          encoding: 'utf8',
          stdio: 'pipe'
        }).trim();

        if (credential) {
          this.credentials[envVar] = credential;
          this.log('B', `Successfully loaded ${envVar}`, { length: credential.length });
        } else {
          this.log('B', `Empty credential for ${envVar}`);
        }

      } catch (error) {
        this.log('B', `Failed to load ${envVar}`, { error: error.message });
      }
    }
  }

  setEnvironmentVariables() {
    for (const [key, value] of Object.entries(this.credentials)) {
      process.env[key] = value;
      this.log('C', `Set environment variable ${key}`, { length: value.length });
    }
  }

  getCredentials() {
    return this.credentials;
  }

  async updateMCPConfig() {
    const mcpConfigPath = '/Users/daniellynch/.cursor/mcp.json';

    try {
      const configContent = fs.readFileSync(mcpConfigPath, 'utf8');
      let config = JSON.parse(configContent);

      // Update server configurations with loaded credentials
      for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
        if (serverConfig.env) {
          for (const [envKey, envValue] of Object.entries(serverConfig.env)) {
            // Replace op:// references with actual values
            if (typeof envValue === 'string' && envValue.startsWith('op://')) {
              const envVar = envKey;
              if (this.credentials[envVar]) {
                serverConfig.env[envKey] = this.credentials[envVar];
                this.log('D', `Updated ${serverName} config with ${envVar}`);
              }
            }
          }
        }
      }

      // Write updated config
      fs.writeFileSync(mcpConfigPath, JSON.stringify(config, null, 2));
      this.log('D', 'MCP configuration updated with credentials');

    } catch (error) {
      this.log('D', 'Failed to update MCP config', { error: error.message });
    }
  }
}

// Export for use in other scripts
module.exports = MCPCredentialLoader;

// Run if called directly
if (require.main === module) {
  const loader = new MCPCredentialLoader();

  loader.loadCredentials().then(async (success) => {
    if (success) {
      console.log('✅ MCP credentials loaded successfully');
      console.log(`📊 Loaded ${Object.keys(loader.getCredentials()).length} credentials`);

      // Update MCP config
      await loader.updateMCPConfig();

      // Print loaded credentials (without values for security)
      console.log('\n🔑 Loaded credentials:');
      Object.keys(loader.getCredentials()).forEach(key => {
        console.log(`  ✅ ${key}`);
      });

    } else {
      console.log('❌ Failed to load MCP credentials');
      process.exit(1);
    }
  }).catch(error => {
    console.error('❌ Credential loading error:', error.message);
    process.exit(1);
  });
}