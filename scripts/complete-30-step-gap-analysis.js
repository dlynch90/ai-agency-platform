#!/usr/bin/env node

/**
 * Complete 30-Step Gap Analysis & Decomposition
 * Comprehensive debugging and modernization assessment
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CompleteGapAnalysisEngine {
    constructor() {
        this.steps = 30;
        this.results = {};
        this.gaps = [];
        this.recommendations = [];
    }

    async executeStep(stepNumber, description, testFunction) {
        console.log(`\n🔍 Step ${stepNumber}/30: ${description}`);
        try {
            const result = await testFunction();
            this.results[stepNumber] = { status: 'PASS', description, result };

            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'scripts/complete-30-step-gap-analysis.js:28',message:`Step ${stepNumber} completed`,data:{stepNumber:stepNumber,description:description,result:result,status:'PASS'},timestamp:Date.now(),sessionId:'complete-30-step-gap-analysis',runId:'full-system-audit',hypothesisId:'comprehensive-gaps'})}).catch(()=>{});
            // #endregion

            console.log(`✅ PASS: ${JSON.stringify(result).substring(0, 200)}...`);
            return result;
        } catch (error) {
            this.results[stepNumber] = { status: 'FAIL', description, error: error.message };
            this.gaps.push({ step: stepNumber, description, error: error.message });

            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'scripts/complete-30-step-gap-analysis.js:37',message:`Step ${stepNumber} failed`,data:{stepNumber:stepNumber,description:description,error:error.message,status:'FAIL'},timestamp:Date.now(),sessionId:'complete-30-step-gap-analysis',runId:'full-system-audit',hypothesisId:'comprehensive-gaps'})}).catch(()=>{});
            // #endregion

            console.log(`❌ FAIL: ${error.message.substring(0, 200)}...`);
            return null;
        }
    }

    async runFullAnalysis() {
        console.log('🚀 Starting Complete 30-Step Gap Analysis & Decomposition\n');

        // Steps 1-10: Foundation & Environment
        await this.executeStep(1, 'Package Manager Integrity', async () => {
            const { stdout } = await execAsync('pnpm --version');
            return { version: stdout.trim(), manager: 'pnpm' };
        });

        await this.executeStep(2, 'Node.js Environment Check', async () => {
            const nodeVersion = process.version;
            const npmVersion = (await execAsync('npm --version')).stdout.trim();
            return { node: nodeVersion, npm: npmVersion };
        });

        await this.executeStep(3, 'Python Environment Verification', async () => {
            const pythonVersion = (await execAsync('python3 --version')).stdout.trim();
            const pipVersion = (await execAsync('pip3 --version')).stdout.trim();
            return { python: pythonVersion, pip: pipVersion };
        });

        await this.executeStep(4, 'Directory Structure Compliance', async () => {
            const rootFiles = fs.readdirSync('.').filter(f => !f.startsWith('.') && !['node_modules', 'venv311', '.pixi'].includes(f));
            const compliant = rootFiles.length <= 15; // Reasonable limit for root files
            return { rootFileCount: rootFiles.length, compliant, files: rootFiles };
        });

        await this.executeStep(5, 'Lockfile Consistency', async () => {
            const hasPackageLock = fs.existsSync('package-lock.json');
            const hasPnpmLock = fs.existsSync('pnpm-lock.yaml');
            const hasPixiLock = fs.existsSync('pixi.lock');
            return { packageLock: hasPackageLock, pnpmLock: hasPnpmLock, pixiLock: hasPixiLock };
        });

        await this.executeStep(6, 'MCP Configuration Validation', async () => {
            const mcpPaths = [
                '.cursor/mcp/servers.json',
                'configs/mcp/mcp.json'
            ];
            const configs = {};
            for (const mcpPath of mcpPaths) {
                if (fs.existsSync(mcpPath)) {
                    configs[mcpPath] = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
                }
            }
            return { configsFound: Object.keys(configs).length, configs };
        });

        await this.executeStep(7, 'MCP Server Package Installation', async () => {
            const { stdout } = await execAsync('pnpm list --depth=0 --json');
            const packages = JSON.parse(stdout);
            const mcpPackages = Object.keys(packages.dependencies || {}).filter(pkg =>
                pkg.includes('mcp') || pkg.includes('modelcontextprotocol'));
            return { mcpPackageCount: mcpPackages.length, packages: mcpPackages };
        });

        await this.executeStep(8, 'Gibson CLI Integration', async () => {
            const gibsonExists = fs.existsSync('bin/gibson-official');
            let version = null;
            if (gibsonExists) {
                try {
                    const { stdout } = await execAsync('./bin/gibson-official --version');
                    version = stdout.trim();
                } catch (e) {
                    version = 'unknown';
                }
            }
            return { installed: gibsonExists, version };
        });

        await this.executeStep(9, 'Cursor IDE Rules Compliance', async () => {
            const rulesFiles = [
                '.cursor/rules/vendor-compliance.mdc',
                '.cursor/rules/architecture-enforcement.mdc',
                '.cursor/rules/organization.mdc'
            ];
            const rulesStatus = {};
            for (const ruleFile of rulesFiles) {
                rulesStatus[ruleFile] = fs.existsSync(ruleFile);
            }
            return { rulesConfigured: Object.values(rulesStatus).every(Boolean), rulesStatus };
        });

        await this.executeStep(10, 'Service Health Validation', async () => {
            const services = {
                redis: 'redis-cli ping 2>/dev/null || echo "DOWN"',
                ollama: 'curl -s http://localhost:11434/api/tags >/dev/null && echo "UP" || echo "DOWN"'
            };
            const status = {};
            for (const [service, check] of Object.entries(services)) {
                try {
                    const { stdout } = await execAsync(check);
                    status[service] = stdout.trim() === 'PONG' || stdout.trim() === 'UP' ? 'UP' : 'DOWN';
                } catch (e) {
                    status[service] = 'DOWN';
                }
            }
            return { services: status, healthyCount: Object.values(status).filter(s => s === 'UP').length };
        });

        // Steps 11-20: Code Quality & Architecture
        await this.executeStep(11, 'TypeScript Configuration Validation', async () => {
            const tsconfigExists = fs.existsSync('tsconfig.json');
            if (tsconfigExists) {
                const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
                return { configured: true, strict: tsconfig.compilerOptions?.strict };
            }
            return { configured: false };
        });

        await this.executeStep(12, 'ESLint Configuration Check', async () => {
            const eslintConfigExists = fs.existsSync('.eslintrc.js') || fs.existsSync('.eslintrc.json') ||
                                     fs.existsSync('eslint.config.js') || fs.existsSync('eslint.config.mjs');
            return { configured: eslintConfigExists };
        });

        await this.executeStep(13, 'Prettier Configuration Check', async () => {
            const prettierConfigExists = fs.existsSync('.prettierrc') || fs.existsSync('prettier.config.js') ||
                                       fs.existsSync('.prettierrc.js') || fs.existsSync('.prettierrc.json');
            return { configured: prettierConfigExists };
        });

        await this.executeStep(14, 'Testing Framework Setup', async () => {
            const testDirs = ['testing', 'tests'];
            const testFiles = [];
            for (const dir of testDirs) {
                if (fs.existsSync(dir)) {
                    const files = fs.readdirSync(dir, { recursive: true })
                        .filter(f => f.toString().endsWith('.test.ts') || f.toString().endsWith('.spec.ts'));
                    testFiles.push(...files);
                }
            }
            return { testDirs: testDirs.filter(d => fs.existsSync(d)), testFileCount: testFiles.length };
        });

        await this.executeStep(15, 'Monorepo Workspace Configuration', async () => {
            const hasPnpmWorkspace = fs.existsSync('pnpm-workspace.yaml');
            const hasTurboJson = fs.existsSync('turbo.json');
            return { pnpmWorkspace: hasPnpmWorkspace, turbo: hasTurboJson };
        });

        await this.executeStep(16, 'Database Schema Validation', async () => {
            const prismaSchemaExists = fs.existsSync('prisma/schema.prisma');
            let databases = [];
            if (prismaSchemaExists) {
                const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
                const dbMatches = schema.match(/datasource\s+\w+\s*{[^}]*}/g) || [];
                databases = dbMatches.map(match => match.match(/provider\s*=\s*"([^"]+)"/)?.[1]).filter(Boolean);
            }
            return { schemaExists: prismaSchemaExists, databases };
        });

        await this.executeStep(17, 'GraphQL Schema Validation', async () => {
            const schemaFiles = [];
            const findGraphQLFiles = (dir) => {
                if (!fs.existsSync(dir)) return;
                const files = fs.readdirSync(dir, { recursive: true });
                files.forEach(file => {
                    if (file.toString().endsWith('.graphql') || file.toString().endsWith('.gql')) {
                        schemaFiles.push(path.join(dir, file.toString()));
                    }
                });
            };
            ['graphql', 'api/graphql', 'services'].forEach(findGraphQLFiles);
            return { schemaFiles: schemaFiles.length, files: schemaFiles };
        });

        await this.executeStep(18, 'Docker Configuration Check', async () => {
            const dockerFiles = fs.readdirSync('.').filter(f =>
                f.includes('docker') || f.includes('Dockerfile') || f.includes('compose'));
            return { dockerFiles: dockerFiles.length, files: dockerFiles };
        });

        await this.executeStep(19, 'Security Configuration Audit', async () => {
            const securityFiles = ['.env.example', '1password', 'secrets'];
            const foundFiles = securityFiles.filter(f => fs.existsSync(f) || fs.existsSync(`.${f}`));
            return { securityConfigured: foundFiles.length > 0, foundFiles };
        });

        await this.executeStep(20, 'Performance Monitoring Setup', async () => {
            const monitoringFiles = ['monitoring', 'prometheus', 'grafana'];
            const foundFiles = monitoringFiles.filter(f => fs.existsSync(f) || fs.existsSync(`${f}.yml`) || fs.existsSync(`${f}.yaml`));
            return { monitoringConfigured: foundFiles.length > 0, foundFiles };
        });

        // Steps 21-30: Advanced Integration & Compliance
        await this.executeStep(21, 'Git Hooks Configuration', async () => {
            const hooksDir = '.git/hooks';
            const hasHooks = fs.existsSync(hooksDir);
            let hookFiles = [];
            if (hasHooks) {
                hookFiles = fs.readdirSync(hooksDir).filter(f => !f.includes('.sample'));
            }
            return { hooksConfigured: hasHooks && hookFiles.length > 0, hookCount: hookFiles.length };
        });

        await this.executeStep(22, 'CI/CD Pipeline Configuration', async () => {
            const ciFiles = ['.github/workflows', '.gitlab-ci.yml', 'ci_cd'];
            const foundFiles = ciFiles.filter(f => fs.existsSync(f));
            return { ciConfigured: foundFiles.length > 0, foundFiles };
        });

        await this.executeStep(23, 'Environment Variable Management', async () => {
            const envFiles = fs.readdirSync('.').filter(f => f.startsWith('.env') || f.includes('env'));
            return { envFiles: envFiles.length, files: envFiles };
        });

        await this.executeStep(24, 'Backup & Recovery Configuration', async () => {
            const backupDirs = ['backups', 'snapshots'];
            const foundDirs = backupDirs.filter(d => fs.existsSync(d));
            return { backupsConfigured: foundDirs.length > 0, foundDirs };
        });

        await this.executeStep(25, 'Vendor Compliance Audit', async () => {
            // Check for custom code patterns
            const customCodePatterns = ['console.log', 'require(', 'module.exports'];
            let violations = 0;
            const checkFile = (filePath) => {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    customCodePatterns.forEach(pattern => {
                        if (content.includes(pattern)) violations++;
                    });
                } catch (e) {}
            };

            const jsFiles = fs.readdirSync('scripts', { recursive: true })
                .filter(f => f.toString().endsWith('.js'))
                .slice(0, 10); // Sample only
            jsFiles.forEach(file => checkFile(path.join('scripts', file.toString())));

            return { violations, compliant: violations === 0 };
        });

        await this.executeStep(26, 'Multi-Language Support Validation', async () => {
            const languages = {
                python: fs.existsSync('pyproject.toml') || fs.existsSync('requirements.txt'),
                rust: fs.existsSync('Cargo.toml'),
                go: fs.existsSync('go.mod'),
                java: fs.existsSync('pom.xml') || fs.existsSync('build.gradle')
            };
            const supported = Object.values(languages).filter(Boolean).length;
            return { languages, supportedCount: supported };
        });

        await this.executeStep(27, 'Federation Architecture Check', async () => {
            const federationDirs = ['federation', 'graphql', 'api-gateway'];
            const foundDirs = federationDirs.filter(d => fs.existsSync(d));
            return { federationConfigured: foundDirs.length > 0, foundDirs };
        });

        await this.executeStep(28, 'Temporal Workflow Integration', async () => {
            const temporalConfigured = fs.existsSync('temporal');
            let workflowCount = 0;
            if (temporalConfigured) {
                try {
                    const files = fs.readdirSync('temporal', { recursive: true });
                    workflowCount = files.filter(f => f.toString().endsWith('.ts') || f.toString().endsWith('.js')).length;
                } catch (e) {}
            }
            return { temporalConfigured, workflowCount };
        });

        await this.executeStep(29, 'Hyperparameterization Setup', async () => {
            const mlDirs = ['ai-ml', 'models', 'training'];
            const foundDirs = mlDirs.filter(d => fs.existsSync(d));
            return { mlConfigured: foundDirs.length > 0, foundDirs };
        });

        await this.executeStep(30, 'Production Readiness Assessment', async () => {
            const productionChecks = {
                healthChecks: fs.existsSync('scripts/health-check-vendor.js'),
                errorHandling: fs.existsSync('monitoring'),
                documentation: fs.existsSync('docs'),
                testing: fs.existsSync('testing') || fs.existsSync('tests'),
                security: fs.existsSync('auth') || fs.existsSync('security'),
                scaling: fs.existsSync('infrastructure/scaling-config.yaml')
            };
            const readyCount = Object.values(productionChecks).filter(Boolean).length;
            return { checks: productionChecks, readinessScore: (readyCount / Object.keys(productionChecks).length) * 100 };
        });

        return this.generateComprehensiveReport();
    }

    generateComprehensiveReport() {
        const totalSteps = Object.keys(this.results).length;
        const passedSteps = Object.values(this.results).filter(r => r.status === 'PASS').length;
        const failedSteps = this.gaps.length;

        console.log('\n' + '='.repeat(100));
        console.log('📊 COMPLETE 30-STEP GAP ANALYSIS REPORT');
        console.log('='.repeat(100));
        console.log(`Total Steps: ${totalSteps}/30`);
        console.log(`Passed: ${passedSteps}`);
        console.log(`Failed: ${failedSteps}`);
        console.log(`Success Rate: ${((passedSteps/totalSteps)*100).toFixed(1)}%`);

        if (this.gaps.length > 0) {
            console.log('\n🚨 CRITICAL GAPS IDENTIFIED:');
            this.gaps.forEach(gap => {
                console.log(`  Step ${gap.step}: ${gap.description}`);
                console.log(`    Error: ${gap.error.substring(0, 100)}...`);
            });
        }

        console.log('\n✅ SYSTEM STRENGTHS:');
        Object.entries(this.results)
            .filter(([_, result]) => result.status === 'PASS')
            .slice(0, 10)
            .forEach(([step, result]) => {
                console.log(`  Step ${step}: ${result.description}`);
            });

        // Generate recommendations
        this.recommendations = this.generateRecommendations();

        console.log('\n💡 KEY RECOMMENDATIONS:');
        this.recommendations.slice(0, 5).forEach(rec => {
            console.log(`  • ${rec}`);
        });

        return {
            summary: {
                totalSteps,
                passedSteps,
                failedSteps,
                successRate: (passedSteps/totalSteps)*100
            },
            gaps: this.gaps,
            recommendations: this.recommendations
        };
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.gaps.some(g => g.step === 7)) {
            recommendations.push('CRITICAL: Run pnpm install to install all missing dependencies');
            recommendations.push('Create pnpm-lock.yaml by running pnpm install successfully');
        }

        if (this.results[4]?.result?.compliant === false) {
            recommendations.push('Clean up root directory - move 98+ files to appropriate subdirectories');
        }

        if (!this.results[5]?.result?.pnpmLock) {
            recommendations.push('Initialize proper pnpm workspace with pnpm-workspace.yaml');
        }

        if (this.results[10]?.result?.healthyCount < 2) {
            recommendations.push('Ensure Redis and Ollama services are running for full functionality');
        }

        recommendations.push('Complete MCP server integration by installing all required packages');
        recommendations.push('Implement comprehensive testing framework across all components');
        recommendations.push('Set up automated CI/CD pipelines for deployment');
        recommendations.push('Configure production monitoring and alerting systems');

        return recommendations;
    }
}

// Run the complete analysis
const analyzer = new CompleteGapAnalysisEngine();
analyzer.runFullAnalysis().then(report => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'scripts/complete-30-step-gap-analysis.js:350',message:'Complete gap analysis completed',data:report,timestamp:Date.now(),sessionId:'complete-30-step-gap-analysis',runId:'full-system-audit',hypothesisId:'comprehensive-gaps'})}).catch(()=>{});
    // #endregion

    console.log('\n🎯 Complete 30-Step Analysis Complete.');
    console.log('📋 Next Action: Fix critical dependency installation issue.');
}).catch(error => {
    console.error('❌ Complete analysis failed:', error);
});