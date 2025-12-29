#!/usr/bin/env node

/**
 * Fixed MCP Server Validation Script
 * Tests MCP servers with proper error handling
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for output
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

// Test MCP server with better error handling
async function testMCPServer(serverName, config) {
    return new Promise((resolve) => {
        log(`Testing MCP server: ${serverName}`);

        // Skip servers that require API keys for now
        const apiKeyRequired = config.env && Object.values(config.env).some(val =>
            typeof val === 'string' && val.includes('${') && val.includes('}')
        );

        if (apiKeyRequired) {
            warning(`${serverName} - Skipped (API key required)`);
            resolve({ name: serverName, status: 'skipped_api_key', reason: 'API key required' });
            return;
        }

        try {
            const args = Array.isArray(config.args) ? config.args : [];
            const env = { ...globalThis.process.env, ...config.env };

            const childProcess = spawn(config.command, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: env,
                timeout: 10000,
                cwd: __dirname
            });

            let output = '';
            let errorOutput = '';
            let started = false;
            let timedOut = false;

            childProcess.stdout.on('data', (data) => {
                output += data.toString();
                if (output.includes('listening') || output.includes('ready') || output.includes('started') || output.includes('MCP')) {
                    started = true;
                }
            });

            childProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            childProcess.on('close', (code) => {
                if (timedOut) return;

                if (started || (code === 0 && output.length > 0)) {
                    success(`${serverName} - Working`);
                    resolve({
                        name: serverName,
                        status: 'working',
                        code,
                        output: output.slice(0, 200)
                    });
                } else if (code === 0) {
                    warning(`${serverName} - Completed without output`);
                    resolve({
                        name: serverName,
                        status: 'no_output',
                        code,
                        output: output.slice(0, 200)
                    });
                } else {
                    warning(`${serverName} - Exited with code ${code}`);
                    resolve({
                        name: serverName,
                        status: 'error',
                        code,
                        error: errorOutput.slice(0, 200)
                    });
                }
            });

            childProcess.on('error', (err) => {
                if (timedOut) return;
                error(`${serverName} - Failed to start: ${err.message}`);
                resolve({ name: serverName, status: 'error', error: err.message });
            });

            // Timeout after 8 seconds
            setTimeout(() => {
                timedOut = true;
                childProcess.kill();
                warning(`${serverName} - Timeout`);
                resolve({ name: serverName, status: 'timeout', output: output.slice(0, 200) });
            }, 8000);

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
    const availableVars = new Set();

    for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
        if (serverConfig.env) {
            for (const [envVar, value] of Object.entries(serverConfig.env)) {
                if (value && typeof value === 'string' && value.includes('${') && value.includes('}')) {
                    // Extract variable name from ${VAR_NAME} format
                    const varName = value.match(/\$\{([^}]+)\}/)?.[1];
                    if (varName) {
                        if (process.env[varName]) {
                            availableVars.add(varName);
                        } else {
                            missingVars.add(varName);
                        }
                    }
                }
            }
        }
    }

    if (missingVars.size > 0) {
        warning(`Missing environment variables: ${Array.from(missingVars).join(', ')}`);
    }

    if (availableVars.size > 0) {
        success(`Available environment variables: ${Array.from(availableVars).join(', ')}`);
    }

    return {
        missing: Array.from(missingVars),
        available: Array.from(availableVars)
    };
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

// Test core local servers that don't need API keys
async function testLocalServers() {
    log('Testing core local MCP servers...');

    const localServers = [
        'filesystem',
        'git',
        'sequential-thinking'
    ];

    const results = [];

    for (const serverName of localServers) {
        const config = loadMCPConfig().mcpServers[serverName];
        if (config) {
            const result = await testMCPServer(serverName, config);
            results.push(result);
        }
    }

    return results;
}

// Main execution
async function main() {
    log('🔍 MCP Server Validation Starting (Fixed Version)...');

    try {
        // Check environment
        const envCheck = checkMCPEnvironment();

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

        // Test local servers first
        const localResults = await testLocalServers();

        // Test Ollama specifically
        const ollamaConfig = config.mcpServers['ollama-chat'] || config.mcpServers['ollama'];
        if (ollamaConfig) {
            log('Testing Ollama MCP server specifically...');
            const ollamaResult = await testMCPServer('ollama-chat', ollamaConfig);
            localResults.push(ollamaResult);
        }

        // Generate report
        const report = {
            timestamp: new Date().toISOString(),
            environment: envCheck,
            categories,
            localResults,
            totalConfigured: servers.length,
            testedLocal: localResults.length
        };

        // Save report
        const reportPath = path.join(__dirname, 'mcp-server-validation-fixed-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Summary
        log('📊 MCP Server Validation Summary');
        console.log('='.repeat(50));
        console.log(`Total MCP Servers Configured: ${report.totalConfigured}`);
        console.log(`Local Servers Tested: ${report.testedLocal}`);
        console.log(`Working Local Servers: ${report.localResults.filter(r => r.status === 'working').length}`);
        console.log(`Servers Needing API Keys: ${envCheck.missing.length}`);
        console.log(`Available API Keys: ${envCheck.available.length}`);

        if (report.localResults.some(r => r.status === 'working')) {
            success(`🎉 Some MCP servers are working!`);
        } else {
            warning('⚠️  No local MCP servers are working. Check configuration.');
        }

        console.log(`\n📄 Detailed report saved to: mcp-server-validation-fixed-report.json`);

        // Recommendations
        if (envCheck.missing.length > 0) {
            console.log('\n🔧 Missing Environment Variables:');
            envCheck.missing.slice(0, 10).forEach(variable => {
                console.log(`  export ${variable}="your-value-here"`);
            });
            if (envCheck.missing.length > 10) {
                console.log(`  ... and ${envCheck.missing.length - 10} more`);
            }
        }

    } catch (err) {
        error(`MCP validation failed: ${err.message}`);
        console.error(err.stack);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(err => {
        error(`Unexpected error: ${err.message}`);
        console.error(err.stack);
    });
}

export { main, testMCPServer, checkMCPEnvironment, categorizeMCPServers };