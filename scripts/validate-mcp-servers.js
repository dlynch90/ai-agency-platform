#!/usr/bin/env node

/**
 * MCP Server Validation Script
 * Tests all configured MCP servers for vendor compliance
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'blue') {
    console.log(`${colors[color]}[${new Date().toISOString()}] ${message}${colors.reset}`);
}

function success(message) {
    log(`✅ ${message}`, 'green');
}

function error(message) {
    log(`❌ ${message}`, 'red');
}

function warning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Load MCP configuration
function loadMCPConfig() {
    const configPath = path.join(__dirname, '.cursor', 'mcp', 'servers.json');
    if (!fs.existsSync(configPath)) {
        error('MCP configuration not found');
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// Test MCP server
async function testMCPServer(serverName, config) {
    return new Promise((resolve) => {
        log(`Testing MCP server: ${serverName}`);

        try {
            const childProcess = spawn(config.command, config.args || [], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...globalThis.process.env, ...config.env },
                timeout: 15000
            });

            let output = '';
            let errorOutput = '';
            let started = false;

            childProcess.stdout.on('data', (data) => {
                output += data.toString();
                if (output.includes('listening') || output.includes('ready') || output.includes('started')) {
                    started = true;
                }
            });

            childProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            childProcess.on('close', (code) => {
                if (started || (code === 0 && output.length > 0)) {
                    success(`${serverName} - Working`);
                    resolve({ name: serverName, status: 'working', code, output: output.slice(0, 200) });
                } else {
                    warning(`${serverName} - Not responding (may need configuration)`);
                    resolve({ name: serverName, status: 'needs_config', code, error: errorOutput.slice(0, 200) });
                }
            });

            childProcess.on('error', (err) => {
                error(`${serverName} - Failed to start: ${err.message}`);
                resolve({ name: serverName, status: 'error', error: err.message });
            });

            // Timeout after 10 seconds
            setTimeout(() => {
                childProcess.kill();
                if (!started) {
                    warning(`${serverName} - Timeout (may need credentials)`);
                    resolve({ name: serverName, status: 'timeout', output: output.slice(0, 200) });
                }
            }, 10000);

        } catch (err) {
            error(`${serverName} - Exception: ${err.message}`);
            resolve({ name: serverName, status: 'exception', error: err.message });
        }
    });
}

// Check environment variables for MCP servers
function checkMCPEnvironment() {
    log('Checking MCP server environment variables...');

    const config = loadMCPConfig();
    const missingVars = new Set();

    for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
        if (serverConfig.env) {
            for (const [envVar, value] of Object.entries(serverConfig.env)) {
                if (value && value.includes('${') && value.includes('}')) {
                    // Extract variable name from ${VAR_NAME} format
                    const varName = value.match(/\$\{([^}]+)\}/)?.[1];
                    if (varName && !process.env[varName]) {
                        missingVars.add(varName);
                    }
                }
            }
        }
    }

    if (missingVars.size > 0) {
        warning(`Missing environment variables for MCP servers: ${Array.from(missingVars).join(', ')}`);
        return Array.from(missingVars);
    } else {
        success('All required MCP environment variables are configured');
        return [];
    }
}

// Categorize MCP servers
function categorizeMCPServers() {
    const config = loadMCPConfig();
    const categories = {
        ai: [],
        database: [],
        cloud: [],
        development: [],
        communication: [],
        automation: [],
        search: [],
        monitoring: []
    };

    for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
        if (serverName.includes('anthropic') || serverName.includes('openai') || serverName.includes('ollama') || serverName.includes('huggingface')) {
            categories.ai.push(serverName);
        } else if (serverName.includes('neo4j') || serverName.includes('qdrant') || serverName.includes('weaviate') || serverName.includes('pinecone') || serverName.includes('chroma') || serverName.includes('sqlite')) {
            categories.database.push(serverName);
        } else if (serverName.includes('aws') || serverName.includes('azure') || serverName.includes('gcp') || serverName.includes('vercel') || serverName.includes('supabase')) {
            categories.cloud.push(serverName);
        } else if (serverName.includes('github') || serverName.includes('git') || serverName.includes('filesystem') || serverName.includes('sequential') || serverName.includes('code-runner')) {
            categories.development.push(serverName);
        } else if (serverName.includes('slack') || serverName.includes('notion')) {
            categories.communication.push(serverName);
        } else if (serverName.includes('temporal') || serverName.includes('n8n') || serverName.includes('task-master')) {
            categories.automation.push(serverName);
        } else if (serverName.includes('tavily') || serverName.includes('exa') || serverName.includes('brave') || serverName.includes('firecrawl')) {
            categories.search.push(serverName);
        } else {
            categories.monitoring.push(serverName);
        }
    }

    return categories;
}

// Main execution
async function main() {
    log('🔍 MCP Server Validation Starting...');

    try {
        // Check environment
        const missingVars = checkMCPEnvironment();

        // Load configuration
        const config = loadMCPConfig();
        const servers = Object.entries(config.mcpServers);

        log(`Found ${servers.length} MCP servers configured`);

        // Categorize servers
        const categories = categorizeMCPServers();
        log('MCP Server Categories:');
        Object.entries(categories).forEach(([category, servers]) => {
            if (servers.length > 0) {
                log(`  ${category}: ${servers.length} servers`, 'yellow');
            }
        });

        // Test servers
        const results = [];
        for (const [serverName, serverConfig] of servers) {
            const result = await testMCPServer(serverName, serverConfig);
            results.push(result);

            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Generate report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: results.length,
                working: results.filter(r => r.status === 'working').length,
                needsConfig: results.filter(r => r.status === 'needs_config').length,
                timeout: results.filter(r => r.status === 'timeout').length,
                error: results.filter(r => r.status === 'error' || r.status === 'exception').length
            },
            missingEnvironmentVars: missingVars,
            categories,
            results
        };

        // Save report
        const reportPath = path.join(__dirname, 'mcp-server-validation-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Summary
        log('📊 MCP Server Validation Summary');
        console.log('='.repeat(50));
        console.log(`Total MCP Servers: ${report.summary.total}`);
        console.log(`Working: ${report.summary.working}`);
        console.log(`Needs Configuration: ${report.summary.needsConfig}`);
        console.log(`Timeout (check credentials): ${report.summary.timeout}`);
        console.log(`Errors: ${report.summary.error}`);

        if (report.summary.working > 0) {
            success(`🎉 ${report.summary.working} MCP servers are working!`);
        }

        if (report.summary.needsConfig > 0) {
            warning(`⚠️  ${report.summary.needsConfig} servers need configuration (API keys, etc.)`);
        }

        console.log(`\n📄 Detailed report saved to: mcp-server-validation-report.json`);

        // Recommendations
        if (missingVars.length > 0) {
            console.log('\n🔧 Missing Environment Variables:');
            missingVars.forEach(variable => {
                console.log(`  export ${variable}="your-value-here"`);
            });
        }

        if (report.summary.working === 0) {
            warning('No MCP servers are working. Check your configuration and API keys.');
        }

    } catch (err) {
        error(`MCP validation failed: ${err.message}`);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(err => {
        error(`Unexpected error: ${err.message}`);
    });
}

export { main, testMCPServer, checkMCPEnvironment, categorizeMCPServers };