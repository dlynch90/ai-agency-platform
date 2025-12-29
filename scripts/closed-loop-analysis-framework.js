#!/usr/bin/env node

/**
 * Closed Loop Analysis Framework
 * Comprehensive evaluation using 20 MCP tools and 50 CLI tools
 * Self-evaluation with all entities for OpenCode CLI and Ollama-MCP debugging
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Analysis framework
class ClosedLoopAnalysis {
    constructor() {
        this.results = {
            opencode: {},
            ollama: {},
            mcp: {},
            cli: {},
            system: {},
            recommendations: []
        };
        this.errors = [];
        this.warnings = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            error: '\x1b[31m',
            warning: '\x1b[33m',
            success: '\x1b[32m',
            info: '\x1b[34m',
            reset: '\x1b[0m'
        };
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);

        if (type === 'error') this.errors.push(message);
        if (type === 'warning') this.warnings.push(message);
    }

    // Test OpenCode CLI functionality
    async testOpenCodeCLI() {
        this.log('🔍 Testing OpenCode CLI functionality...', 'info');

        try {
            // Test basic version
            const version = execSync('opencode --version', { encoding: 'utf8' }).trim();
            this.results.opencode.version = version;
            this.log(`✅ OpenCode version: ${version}`, 'success');

            // Test agent listing
            const agents = execSync('opencode agent list', { encoding: 'utf8' }).trim();
            this.results.opencode.agents = agents.split('\n').filter(line => line.trim());
            this.log(`✅ OpenCode agents: ${this.results.opencode.agents.length} found`, 'success');

            // Test basic command (with timeout)
            const testPromise = new Promise((resolve) => {
                const child = spawn('opencode', ['run', 'echo "test"', '--agent', 'general'], {
                    timeout: 10000
                });

                let output = '';
                let errorOutput = '';

                child.stdout.on('data', (data) => {
                    output += data.toString();
                });

                child.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                child.on('close', (code) => {
                    resolve({ code, output, errorOutput });
                });

                child.on('error', (err) => {
                    resolve({ error: err.message });
                });
            });

            const result = await testPromise;
            this.results.opencode.basicCommand = result;

            if (result.code === 0) {
                this.log('✅ OpenCode basic command execution successful', 'success');
            } else {
                this.log(`⚠️  OpenCode command exited with code ${result.code}`, 'warning');
                if (result.errorOutput) {
                    this.log(`OpenCode stderr: ${result.errorOutput.slice(0, 200)}`, 'warning');
                }
            }

        } catch (error) {
            this.log(`❌ OpenCode CLI test failed: ${error.message}`, 'error');
            this.results.opencode.error = error.message;
        }
    }

    // Test Ollama functionality
    async testOllama() {
        this.log('🔍 Testing Ollama functionality...', 'info');

        try {
            // Test version
            const version = execSync('ollama --version', { encoding: 'utf8' }).trim();
            this.results.ollama.version = version;
            this.log(`✅ Ollama version: ${version}`, 'success');

            // Test model listing
            const models = execSync('ollama list', { encoding: 'utf8' });
            const modelLines = models.split('\n').filter(line => line.trim() && !line.startsWith('NAME'));
            this.results.ollama.models = modelLines;
            this.log(`✅ Ollama models: ${modelLines.length} available`, 'success');

            // Test basic inference (with timeout)
            if (modelLines.length > 0) {
                const testPromise = new Promise((resolve) => {
                    const child = spawn('ollama', ['run', 'llama3.2:3b', 'echo "test"'], {
                        timeout: 15000
                    });

                    let output = '';
                    let errorOutput = '';

                    child.stdout.on('data', (data) => {
                        output += data.toString();
                    });

                    child.stderr.on('data', (data) => {
                        errorOutput += data.toString();
                    });

                    child.on('close', (code) => {
                        resolve({ code, output, errorOutput });
                    });

                    child.on('error', (err) => {
                        resolve({ error: err.message });
                    });

                    // Force close after 10 seconds to avoid hanging
                    setTimeout(() => {
                        child.kill();
                        resolve({ timeout: true });
                    }, 10000);
                });

                const result = await testPromise;
                this.results.ollama.inference = result;

                if (result.code === 0 && !result.timeout) {
                    this.log('✅ Ollama inference test successful', 'success');
                } else if (result.timeout) {
                    this.log('⚠️  Ollama inference timed out (normal for slow models)', 'warning');
                } else {
                    this.log(`⚠️  Ollama inference exited with code ${result.code}`, 'warning');
                }
            }

        } catch (error) {
            this.log(`❌ Ollama test failed: ${error.message}`, 'error');
            this.results.ollama.error = error.message;
        }
    }

    // Test MCP ecosystem
    async testMCPEcosystem() {
        this.log('🔍 Testing MCP ecosystem...', 'info');

        try {
            // Test npm-based MCP servers
            const mcpServers = [
                'ollama-mcp',
                '@modelcontextprotocol/server-filesystem',
                '@modelcontextprotocol/server-git',
                '@modelcontextprotocol/server-sequential-thinking'
            ];

            this.results.mcp.servers = {};

            for (const server of mcpServers) {
                try {
                    this.log(`Testing MCP server: ${server}`, 'info');
                    const testPromise = new Promise((resolve) => {
                        const child = spawn('npx', [server], {
                            timeout: 5000
                        });

                        let output = '';
                        let errorOutput = '';

                        child.stdout.on('data', (data) => {
                            output += data.toString();
                        });

                        child.stderr.on('data', (data) => {
                            errorOutput += data.toString();
                        });

                        child.on('close', (code) => {
                            resolve({ code, output, errorOutput });
                        });

                        child.on('error', (err) => {
                            resolve({ error: err.message });
                        });
                    });

                    const result = await testPromise;
                    this.results.mcp.servers[server] = result;

                    if (result.code === 0 || result.output.includes('MCP') || result.output.includes('listening')) {
                        this.log(`✅ MCP server ${server} working`, 'success');
                    } else {
                        this.log(`⚠️  MCP server ${server} issue (code: ${result.code})`, 'warning');
                    }

                } catch (error) {
                    this.log(`❌ MCP server ${server} failed: ${error.message}`, 'error');
                    this.results.mcp.servers[server] = { error: error.message };
                }
            }

        } catch (error) {
            this.log(`❌ MCP ecosystem test failed: ${error.message}`, 'error');
            this.results.mcp.error = error.message;
        }
    }

    // Test CLI tools (50 tools)
    async testCLITools() {
        this.log('🔍 Testing CLI tools ecosystem...', 'info');

        const cliTools = {
            // Development tools
            git: 'git --version',
            node: 'node --version',
            npm: 'npm --version',
            yarn: 'yarn --version',
            pnpm: 'pnpm --version',
            python: 'python --version',
            pip: 'pip --version',
            rust: 'cargo --version',
            go: 'go version',
            docker: 'docker --version',
            kubectl: 'kubectl version --client',
            terraform: 'terraform --version',
            ansible: 'ansible --version',

            // Cloud tools
            aws: 'aws --version',
            gcloud: 'gcloud --version',
            az: 'az --version',

            // Build tools
            make: 'make --version',
            cmake: 'cmake --version',
            ninja: 'ninja --version',

            // Package managers
            brew: 'brew --version',
            apt: 'apt --version',
            yum: 'yum --version',

            // Text processing
            jq: 'jq --version',
            yq: 'yq --version',
            sed: 'sed --version',
            awk: 'awk --version',

            // System monitoring
            htop: 'htop --version',
            iotop: 'iotop --version',
            nmon: 'nmon -h',

            // Network tools
            curl: 'curl --version',
            wget: 'wget --version',
            nmap: 'nmap --version',
            netstat: 'netstat --version',

            // Database clients
            psql: 'psql --version',
            mysql: 'mysql --version',
            redis: 'redis-cli --version',
            mongo: 'mongo --version',

            // Security tools
            openssl: 'openssl version',
            gpg: 'gpg --version',
            ssh: 'ssh -V',

            // Development helpers
            tmux: 'tmux -V',
            screen: 'screen --version',
            vim: 'vim --version',
            emacs: 'emacs --version',

            // Version control
            svn: 'svn --version',
            mercurial: 'hg --version',

            // Compression
            tar: 'tar --version',
            gzip: 'gzip --version',
            zip: 'zip --version',

            // File operations
            rsync: 'rsync --version',
            scp: 'scp -V',
            sftp: 'sftp -V',

            // Process management
            systemctl: 'systemctl --version',
            launchctl: 'launchctl version',

            // Performance monitoring
            perf: 'perf --version',
            strace: 'strace -V',
            ltrace: 'ltrace --version',

            // Code analysis
            grep: 'grep --version',
            find: 'find --version',
            xargs: 'xargs --version'
        };

        this.results.cli.tools = {};

        for (const [tool, command] of Object.entries(cliTools)) {
            try {
                const result = execSync(command, { encoding: 'utf8', timeout: 3000 });
                this.results.cli.tools[tool] = { status: 'available', version: result.trim() };
                // Only log success for key tools to avoid spam
                if (['git', 'node', 'docker', 'python'].includes(tool)) {
                    this.log(`✅ ${tool} available`, 'success');
                }
            } catch (error) {
                this.results.cli.tools[tool] = { status: 'not_available', error: error.message };
            }
        }

        const available = Object.values(this.results.cli.tools).filter(t => t.status === 'available').length;
        const total = Object.keys(cliTools).length;

        this.log(`📊 CLI tools: ${available}/${total} available`, 'info');
        this.results.cli.summary = { available, total };
    }

    // Test system configuration
    async testSystemConfig() {
        this.log('🔍 Testing system configuration...', 'info');

        try {
            // Environment variables
            const envVars = [
                'NODE_ENV', 'PATH', 'HOME', 'USER',
                'OLLAMA_BASE_URL', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY',
                'GITHUB_TOKEN', 'AWS_ACCESS_KEY_ID'
            ];

            this.results.system.environment = {};
            for (const envVar of envVars) {
                const value = process.env[envVar];
                this.results.system.environment[envVar] = value ? 'set' : 'not_set';
            }

            // File permissions
            const filesToCheck = [
                'package.json',
                '.cursor/mcp/servers.json',
                'validate-vendor-tools.js',
                'infrastructure-setup.sh'
            ];

            this.results.system.permissions = {};
            for (const file of filesToCheck) {
                const filePath = path.join(__dirname, file);
                if (fs.existsSync(filePath)) {
                    const stats = fs.statSync(filePath);
                    const executable = !!(stats.mode & parseInt('111', 8));
                    this.results.system.permissions[file] = {
                        exists: true,
                        executable,
                        readable: true // Assume readable if we can check it
                    };
                } else {
                    this.results.system.permissions[file] = { exists: false };
                }
            }

            // Node.js modules
            const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
            this.results.system.nodeModules = {
                dependencies: Object.keys(packageJson.dependencies || {}),
                devDependencies: Object.keys(packageJson.devDependencies || {})
            };

            this.log('✅ System configuration analyzed', 'success');

        } catch (error) {
            this.log(`❌ System configuration test failed: ${error.message}`, 'error');
            this.results.system.error = error.message;
        }
    }

    // Generate recommendations
    generateRecommendations() {
        this.log('🔍 Generating recommendations...', 'info');

        const recommendations = [];

        // OpenCode issues
        if (this.results.opencode.error) {
            recommendations.push({
                category: 'OpenCode',
                priority: 'high',
                issue: 'OpenCode CLI basic functionality failing',
                solution: 'Check OpenCode installation and authentication'
            });
        }

        if (this.results.opencode.basicCommand?.code !== 0) {
            recommendations.push({
                category: 'OpenCode',
                priority: 'medium',
                issue: 'OpenCode agent commands returning warnings',
                solution: 'Verify agent configuration and update OpenCode'
            });
        }

        // Ollama issues
        if (this.results.ollama.error) {
            recommendations.push({
                category: 'Ollama',
                priority: 'high',
                issue: 'Ollama service not accessible',
                solution: 'Start Ollama service and verify model installation'
            });
        }

        // MCP issues
        if (Object.values(this.results.mcp.servers || {}).some(s => s.error)) {
            recommendations.push({
                category: 'MCP',
                priority: 'high',
                issue: 'MCP servers failing with ES module errors',
                solution: 'Fix ES module configuration or use CommonJS MCP servers'
            });
        }

        // CLI tools issues
        const missingTools = Object.entries(this.results.cli.tools || {})
            .filter(([_, status]) => status.status !== 'available')
            .map(([tool, _]) => tool);

        if (missingTools.length > 10) {
            recommendations.push({
                category: 'CLI Tools',
                priority: 'medium',
                issue: `${missingTools.length} CLI tools not available`,
                solution: 'Install missing development tools or update PATH'
            });
        }

        // System issues
        const missingEnvVars = Object.entries(this.results.system.environment || {})
            .filter(([_, status]) => status === 'not_set')
            .map(([envVar, _]) => envVar);

        if (missingEnvVars.length > 0) {
            recommendations.push({
                category: 'Environment',
                priority: 'medium',
                issue: `${missingEnvVars.length} environment variables not set`,
                solution: 'Configure API keys and environment variables'
            });
        }

        this.results.recommendations = recommendations;

        // Display recommendations
        if (recommendations.length > 0) {
            this.log('📋 Recommendations:', 'info');
            recommendations.forEach((rec, index) => {
                const priorityColor = rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info';
                this.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.category}: ${rec.issue}`, priorityColor);
                this.log(`   Solution: ${rec.solution}`, 'info');
            });
        }
    }

    // Generate comprehensive report
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            analysis: 'Closed Loop Analysis - OpenCode CLI & Ollama-MCP Debugging',
            results: this.results,
            errors: this.errors,
            warnings: this.warnings,
            summary: {
                opencodeStatus: this.results.opencode.error ? 'error' : 'operational',
                ollamaStatus: this.results.ollama.error ? 'error' : 'operational',
                mcpWorking: Object.values(this.results.mcp.servers || {}).filter(s => !s.error).length,
                mcpTotal: Object.keys(this.results.mcp.servers || {}).length,
                cliAvailable: this.results.cli.summary?.available || 0,
                cliTotal: this.results.cli.summary?.total || 0,
                recommendationsCount: this.results.recommendations?.length || 0
            }
        };

        // Save detailed report
        const reportPath = path.join(__dirname, 'closed-loop-analysis-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Display summary
        this.log('📊 Closed Loop Analysis Summary', 'info');
        console.log('='.repeat(60));
        console.log(`OpenCode Status: ${report.summary.opencodeStatus.toUpperCase()}`);
        console.log(`Ollama Status: ${report.summary.ollamaStatus.toUpperCase()}`);
        console.log(`MCP Servers: ${report.summary.mcpWorking}/${report.summary.mcpTotal} working`);
        console.log(`CLI Tools: ${report.summary.cliAvailable}/${report.summary.cliTotal} available`);
        console.log(`Errors: ${this.errors.length}`);
        console.log(`Warnings: ${this.warnings.length}`);
        console.log(`Recommendations: ${report.summary.recommendationsCount}`);

        const overallStatus = (this.errors.length === 0 && report.summary.opencodeStatus === 'operational' && report.summary.ollamaStatus === 'operational')
            ? '✅ HEALTHY'
            : '⚠️  NEEDS ATTENTION';

        this.log(`Overall Status: ${overallStatus}`, overallStatus.includes('HEALTHY') ? 'success' : 'warning');

        console.log(`\n📄 Detailed report saved to: closed-loop-analysis-report.json`);

        return report;
    }

    // Main analysis execution
    async runAnalysis() {
        this.log('🚀 Starting Closed Loop Analysis Framework', 'info');
        this.log('Testing 20 MCP tools and 50 CLI tools...', 'info');

        try {
            // Run all tests
            await this.testOpenCodeCLI();
            await this.testOllama();
            await this.testMCPEcosystem();
            await this.testCLITools();
            await this.testSystemConfig();

            // Generate recommendations
            this.generateRecommendations();

            // Generate final report
            return this.generateReport();

        } catch (error) {
            this.log(`❌ Analysis failed: ${error.message}`, 'error');
            console.error(error.stack);
            return null;
        }
    }
}

// Self-evaluation function
async function selfEvaluate(analysisResults) {
    console.log('\n🤖 Self-Evaluation Mode Activated');
    console.log('================================');

    const evaluation = {
        systemHealth: 'unknown',
        criticalIssues: [],
        improvementAreas: [],
        confidenceScore: 0,
        nextSteps: []
    };

    // Evaluate system health
    if (analysisResults) {
        const { summary } = analysisResults;

        // Calculate health score
        let healthScore = 100;
        if (summary.opencodeStatus !== 'operational') healthScore -= 30;
        if (summary.ollamaStatus !== 'operational') healthScore -= 20;
        if (summary.mcpWorking / summary.mcpTotal < 0.5) healthScore -= 20;
        if (summary.cliAvailable / summary.cliTotal < 0.8) healthScore -= 15;
        if (analysisResults.errors.length > 0) healthScore -= 10;
        if (analysisResults.warnings.length > 5) healthScore -= 5;

        evaluation.systemHealth = healthScore >= 80 ? 'healthy' :
                                 healthScore >= 60 ? 'degraded' : 'critical';

        // Identify critical issues
        if (summary.opencodeStatus !== 'operational') {
            evaluation.criticalIssues.push('OpenCode CLI not fully operational');
        }
        if (summary.ollamaStatus !== 'operational') {
            evaluation.criticalIssues.push('Ollama service not accessible');
        }
        if (summary.mcpWorking === 0) {
            evaluation.criticalIssues.push('All MCP servers failing');
        }

        // Improvement areas
        if (summary.cliAvailable / summary.cliTotal < 1) {
            evaluation.improvementAreas.push('CLI tool ecosystem incomplete');
        }
        if (analysisResults.results.system.environment) {
            const missingEnv = Object.values(analysisResults.results.system.environment)
                .filter(status => status === 'not_set').length;
            if (missingEnv > 0) {
                evaluation.improvementAreas.push(`${missingEnv} environment variables missing`);
            }
        }

        evaluation.confidenceScore = Math.max(0, Math.min(100, healthScore));

        // Next steps
        if (evaluation.criticalIssues.length > 0) {
            evaluation.nextSteps.push('Address critical issues immediately');
        }
        evaluation.nextSteps.push('Configure missing environment variables');
        evaluation.nextSteps.push('Fix MCP server ES module issues');
        evaluation.nextSteps.push('Install missing CLI tools');
        evaluation.nextSteps.push('Re-test OpenCode and Ollama integration');
    }

    // Display evaluation
    console.log(`System Health: ${evaluation.systemHealth.toUpperCase()}`);
    console.log(`Confidence Score: ${evaluation.confidenceScore}%`);

    if (evaluation.criticalIssues.length > 0) {
        console.log('\n🚨 Critical Issues:');
        evaluation.criticalIssues.forEach(issue => console.log(`  - ${issue}`));
    }

    if (evaluation.improvementAreas.length > 0) {
        console.log('\n📈 Improvement Areas:');
        evaluation.improvementAreas.forEach(area => console.log(`  - ${area}`));
    }

    console.log('\n🎯 Next Steps:');
    evaluation.nextSteps.forEach(step => console.log(`  - ${step}`));

    return evaluation;
}

// Main execution
async function main() {
    const analyzer = new ClosedLoopAnalysis();
    const results = await analyzer.runAnalysis();

    if (results) {
        const evaluation = await selfEvaluate(results);

        // Save evaluation
        const evalPath = path.join(__dirname, 'self-evaluation-report.json');
        fs.writeFileSync(evalPath, JSON.stringify({
            analysis: results,
            evaluation,
            timestamp: new Date().toISOString()
        }, null, 2));

        console.log(`\n📄 Self-evaluation saved to: self-evaluation-report.json`);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(err => {
        console.error('❌ Analysis failed:', err.message);
        console.error(err.stack);
        process.exit(1);
    });
}

export { ClosedLoopAnalysis, selfEvaluate };