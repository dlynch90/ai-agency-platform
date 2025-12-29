#!/usr/bin/env node

/**
 * Vendor Tool Validation Script
 * Replaces comprehensive-tool-audit.sh with vendor-compliant Node.js implementation
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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
    process.exit(1);
}

function warning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Load vendor tool configuration
function loadVendorConfig() {
    const configPath = path.join(__dirname, 'vendor-tool-manager.json');
    if (!fs.existsSync(configPath)) {
        error('Vendor tool configuration not found');
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// Check if tool is available
function checkTool(toolName, validationCmd, description, vendor) {
    try {
        const result = execSync(validationCmd, { encoding: 'utf8', timeout: 5000 });
        success(`${toolName} (${description}) - ${vendor}`);
        return { name: toolName, status: 'working', vendor, description };
    } catch (err) {
        error(`${toolName} (${description}) - NOT FOUND`);
        return { name: toolName, status: 'missing', vendor, description };
    }
}

// Validate MCP servers
async function validateMCPServers() {
    log('Validating MCP Servers...');

    const mcpConfigPath = path.join(__dirname, '.cursor', 'mcp', 'servers.json');
    if (!fs.existsSync(mcpConfigPath)) {
        warning('MCP configuration not found');
        return [];
    }

    const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
    const results = [];

    for (const [serverName, config] of Object.entries(mcpConfig.mcpServers)) {
        try {
            // Test MCP server startup (with timeout)
            const testProcess = spawn(config.command, config.args || [], {
                stdio: 'pipe',
                timeout: 10000
            });

            let output = '';
            testProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            testProcess.stderr.on('data', (data) => {
                output += data.toString();
            });

            await new Promise((resolve, reject) => {
                testProcess.on('close', (code) => {
                    if (code === 0 || output.includes('listening') || output.includes('ready')) {
                        resolve();
                    } else {
                        reject(new Error(`Exit code ${code}`));
                    }
                });
                testProcess.on('error', reject);

                // Timeout after 5 seconds
                setTimeout(() => {
                    testProcess.kill();
                    resolve(); // Consider it working if it started
                }, 5000);
            });

            success(`MCP Server: ${serverName}`);
            results.push({ name: serverName, type: 'mcp', status: 'working' });
        } catch (err) {
            error(`MCP Server: ${serverName} - FAILED`);
            results.push({ name: serverName, type: 'mcp', status: 'failed' });
        }
    }

    return results;
}

// Check environment variables
function checkEnvironmentVariables() {
    log('Checking Environment Variables...');

    const required = [
        'NODE_ENV',
        'DEVELOPER_DIR'
    ];

    const optional = [
        'ANTHROPIC_API_KEY',
        'OPENAI_API_KEY',
        'GITHUB_TOKEN',
        'AWS_ACCESS_KEY_ID',
        'POSTGRES_PASSWORD'
    ];

    const results = [];

    required.forEach(env => {
        if (process.env[env]) {
            success(`Environment: ${env} = ${process.env[env]}`);
            results.push({ name: env, status: 'set', required: true });
        } else {
            warning(`Environment: ${env} not set`);
            results.push({ name: env, status: 'missing', required: true });
        }
    });

    optional.forEach(env => {
        if (process.env[env]) {
            success(`Environment: ${env} configured`);
            results.push({ name: env, status: 'set', required: false });
        } else {
            log(`Environment: ${env} not configured (optional)`, 'yellow');
            results.push({ name: env, status: 'missing', required: false });
        }
    });

    return results;
}

// Generate report
function generateReport(toolResults, mcpResults, envResults) {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalTools: toolResults.length,
            workingTools: toolResults.filter(t => t.status === 'working').length,
            failedTools: toolResults.filter(t => t.status !== 'working').length,
            totalMCP: mcpResults.length,
            workingMCP: mcpResults.filter(m => m.status === 'working').length,
            failedMCP: mcpResults.filter(m => m.status !== 'working').length,
            requiredEnv: envResults.filter(e => e.required && e.status === 'set').length,
            missingEnv: envResults.filter(e => e.status === 'missing').length
        },
        details: {
            tools: toolResults,
            mcp: mcpResults,
            environment: envResults
        }
    };

    // Save report
    const reportPath = path.join(__dirname, 'vendor-tool-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
}

// Main execution
async function main() {
    log('🚀 Vendor Tool Validation Starting...');

    try {
        // Load configuration
        const config = loadVendorConfig();

        // Validate CLI tools
        log('Validating CLI Tools...');
        const toolResults = [];

        for (const category of Object.values(config.vendorTools)) {
            for (const [toolName, toolConfig] of Object.entries(category)) {
                const result = checkTool(
                    toolName,
                    toolConfig.validation,
                    toolConfig.description,
                    toolConfig.vendor
                );
                toolResults.push(result);
            }
        }

        // Validate MCP servers
        const mcpResults = await validateMCPServers();

        // Check environment
        const envResults = checkEnvironmentVariables();

        // Generate report
        const report = generateReport(toolResults, mcpResults, envResults);

        // Summary
        log('📊 Validation Summary');
        console.log('='.repeat(50));
        console.log(`Total Tools: ${report.summary.totalTools}`);
        console.log(`Working Tools: ${report.summary.workingTools}`);
        console.log(`Failed Tools: ${report.summary.failedTools}`);
        console.log(`Working MCP Servers: ${report.summary.workingMCP}`);
        console.log(`Failed MCP Servers: ${report.summary.failedMCP}`);
        console.log(`Required Environment Variables: ${report.summary.requiredEnv}`);
        console.log(`Missing Environment Variables: ${report.summary.missingEnv}`);

        if (report.summary.failedTools === 0 && report.summary.failedMCP === 0) {
            success('🎉 All vendor tools and MCP servers are properly configured!');
        } else {
            warning('⚠️  Some tools or MCP servers need attention. Check the report for details.');
        }

        console.log(`\n📄 Detailed report saved to: vendor-tool-validation-report.json`);

        // Recommendations
        if (report.summary.failedTools > 0) {
            console.log('\n🔧 Installation Recommendations:');
            const platform = process.platform;
            const installGuide = config.installationGuides[platform === 'darwin' ? 'macos' :
                                                         platform === 'linux' ? 'linux' : 'windows'];

            report.details.tools.filter(t => t.status !== 'working').forEach(tool => {
                if (installGuide && installGuide[tool.name]) {
                    console.log(`  ${tool.name}: ${installGuide[tool.name]}`);
                }
            });
        }

    } catch (err) {
        error(`Validation failed: ${err.message}`);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(err => {
        error(`Unexpected error: ${err.message}`);
    });
}

module.exports = { main, checkTool, validateMCPServers, checkEnvironmentVariables };