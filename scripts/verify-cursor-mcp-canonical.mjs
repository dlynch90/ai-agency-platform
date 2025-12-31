#!/usr/bin/env node

/**
 * VERIFY CURSOR IDE MCP CANONICAL CONFIGURATION
 * Runtime verification that canonical config is correct and being used
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CANONICAL_MCP_CONFIG = path.join(process.env.HOME, '.cursor/mcp.json');
const LOG_FILE = path.join(__dirname, '../.cursor/debug.log');
const GITHUB_CATALOG_URL = 'https://raw.githubusercontent.com/modelcontextprotocol/servers/main/.mcp.json';

class CursorMCPCanonicalVerifier {
    constructor() {
        this.ensureLogDirectory();
        this.issues = [];
        this.fixes = [];
    }

    ensureLogDirectory() {
        const logDir = path.dirname(LOG_FILE);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    log(message, data = {}) {
        const entry = {
            id: `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            location: 'verify-cursor-mcp-canonical.mjs',
            message,
            data,
            sessionId: 'cursor-mcp-verification',
            hypothesisId: 'CANONICAL_VERIFICATION'
        };

        const logLine = JSON.stringify(entry) + '\n';
        fs.appendFileSync(LOG_FILE, logLine);
        console.log(`🔍 ${message}`);
    }

    async verifyCanonicalConfigExists() {
        this.log('Verifying canonical MCP config exists', { path: CANONICAL_MCP_CONFIG });
        
        if (!fs.existsSync(CANONICAL_MCP_CONFIG)) {
            this.issues.push({
                type: 'MISSING_CANONICAL_CONFIG',
                severity: 'CRITICAL',
                fix: `Create canonical config at ${CANONICAL_MCP_CONFIG}`
            });
            this.log('Canonical config missing', { path: CANONICAL_MCP_CONFIG });
            return false;
        }

        this.log('Canonical config exists', { path: CANONICAL_MCP_CONFIG });
        return true;
    }

    async verifyCanonicalConfigValid() {
        this.log('Verifying canonical MCP config is valid JSON');

        try {
            const content = fs.readFileSync(CANONICAL_MCP_CONFIG, 'utf8');
            const config = JSON.parse(content);

            if (!config.mcpServers || typeof config.mcpServers !== 'object') {
                this.issues.push({
                    type: 'INVALID_CONFIG_STRUCTURE',
                    severity: 'CRITICAL',
                    fix: 'Config must have mcpServers object'
                });
                this.log('Invalid config structure', { hasMcpServers: !!config.mcpServers });
                return null;
            }

            const serverCount = Object.keys(config.mcpServers).length;
            this.log('Canonical config is valid', { 
                serverCount,
                hasGitHubSync: !!config.githubSync,
                version: config.version
            });

            return config;
        } catch (error) {
            this.issues.push({
                type: 'INVALID_JSON',
                severity: 'CRITICAL',
                error: error.message,
                fix: 'Fix JSON syntax errors'
            });
            this.log('Invalid JSON in canonical config', { error: error.message });
            return null;
        }
    }

    async verifyNoConflictingConfigs() {
        this.log('Checking for conflicting MCP config files');

        const conflictingPaths = [
            path.join(process.env.HOME, '.cursor/mcp-new.json'),
            path.join(process.env.DEVELOPER_DIR || path.join(process.env.HOME, 'Developer'), 'configs/mcp/mcp.json'),
            path.join(process.env.DEVELOPER_DIR || path.join(process.env.HOME, 'Developer'), 'mcp/configs/mcp-registry.json')
        ];

        const conflicts = [];
        for (const confPath of conflictingPaths) {
            if (fs.existsSync(confPath) && confPath !== CANONICAL_MCP_CONFIG) {
                conflicts.push(confPath);
                this.log('Found conflicting config', { path: confPath });
            }
        }

        if (conflicts.length > 0) {
            this.issues.push({
                type: 'CONFLICTING_CONFIGS',
                severity: 'HIGH',
                conflicts,
                fix: 'Remove or rename conflicting configs - only canonical config should exist'
            });
        } else {
            this.log('No conflicting configs found');
        }

        return conflicts.length === 0;
    }

    async verifyGitHubSync() {
        this.log('Verifying GitHub sync configuration');

        try {
            const config = JSON.parse(fs.readFileSync(CANONICAL_MCP_CONFIG, 'utf8'));
            
            // Check both githubSync and github_sync (different formats)
            const githubSync = config.githubSync || config.github_sync;
            if (!githubSync || !githubSync.enabled) {
                this.issues.push({
                    type: 'GITHUB_SYNC_DISABLED',
                    severity: 'MEDIUM',
                    fix: 'Enable GitHub sync in canonical config'
                });
                this.log('GitHub sync not enabled');
                return false;
            }

            // Test GitHub CLI
            try {
                execSync('gh --version', { stdio: 'pipe' });
                this.log('GitHub CLI available');
            } catch (error) {
                this.issues.push({
                    type: 'GITHUB_CLI_MISSING',
                    severity: 'HIGH',
                    fix: 'Install GitHub CLI: brew install gh'
                });
                this.log('GitHub CLI not available', { error: error.message });
                return false;
            }

            // Test GitHub authentication
            try {
                execSync('gh auth status', { stdio: 'pipe' });
                this.log('GitHub CLI authenticated');
            } catch (error) {
                this.issues.push({
                    type: 'GITHUB_CLI_NOT_AUTHENTICATED',
                    severity: 'HIGH',
                    fix: 'Authenticate GitHub CLI: gh auth login'
                });
                this.log('GitHub CLI not authenticated', { error: error.message });
                return false;
            }

            // Test fetching catalog
            try {
                const catalogJson = execSync(`gh api repos/modelcontextprotocol/servers/contents/.mcp.json --jq '.content' | base64 -d`, { encoding: 'utf8' });
                const catalog = JSON.parse(catalogJson);
                this.log('GitHub catalog fetch successful', { 
                    catalogServerCount: Object.keys(catalog.mcpServers || {}).length 
                });
                return true;
            } catch (error) {
                this.issues.push({
                    type: 'GITHUB_CATALOG_FETCH_FAILED',
                    severity: 'MEDIUM',
                    error: error.message,
                    fix: 'Check GitHub API access and network connectivity'
                });
                this.log('GitHub catalog fetch failed', { error: error.message });
                return false;
            }
        } catch (error) {
            this.log('GitHub sync verification error', { error: error.message });
            return false;
        }
    }

    async verifyPixiMLActivation() {
        this.log('Verifying Pixi ML packages are activated in default environment');

        const pixiTomlPath = path.join(process.env.DEVELOPER_DIR || path.join(process.env.HOME, 'Developer'), 'pixi.toml');
        
        if (!fs.existsSync(pixiTomlPath)) {
            this.issues.push({
                type: 'PIXI_TOML_MISSING',
                severity: 'HIGH',
                fix: 'Create pixi.toml file'
            });
            this.log('pixi.toml missing', { path: pixiTomlPath });
            return false;
        }

        const content = fs.readFileSync(pixiTomlPath, 'utf8');
        
        // Check if default environment includes ai-ml - handle both formats
        const defaultEnvMatch = content.match(/default\s*=\s*\{\s*features\s*=\s*\[([^\]]+)\]/);
        if (!defaultEnvMatch) {
            this.issues.push({
                type: 'PIXI_DEFAULT_ENV_NOT_FOUND',
                severity: 'CRITICAL',
                fix: 'Add default environment with ai-ml feature'
            });
            this.log('Default environment not found in pixi.toml');
            return false;
        }

        const features = defaultEnvMatch[1].split(',').map(f => f.trim().replace(/"/g, ''));
        const hasAiMl = features.includes('ai-ml');
        
        if (!hasAiMl) {
            this.issues.push({
                type: 'PIXI_AI_ML_NOT_ACTIVATED',
                severity: 'CRITICAL',
                currentFeatures: features,
                fix: 'Add "ai-ml" to default environment features'
            });
            this.log('ai-ml feature not in default environment', { features });
            return false;
        }

        // Verify PyTorch/Transformers are actually available
        try {
            const result = execSync('pixi run python -c "import torch; import transformers; print(\'OK\')"', {
                cwd: path.dirname(pixiTomlPath),
                encoding: 'utf8',
                stdio: 'pipe'
            });
            this.log('Pixi ML packages verified working', { result: result.trim() });
            return true;
        } catch (error) {
            this.issues.push({
                type: 'PIXI_ML_PACKAGES_NOT_WORKING',
                severity: 'CRITICAL',
                error: error.message,
                fix: 'Run: pixi install && pixi run python -c "import torch; import transformers"'
            });
            this.log('Pixi ML packages not working', { error: error.message });
            return false;
        }
    }

    async verifyNetworkConnections() {
        this.log('Verifying network connections');

        const services = [
            { name: 'Docker', check: 'docker info', port: null },
            { name: 'PostgreSQL', check: 'pg_isready', port: 5432 },
            { name: 'Redis', check: 'redis-cli ping', port: 6379 },
            { name: 'Neo4j', check: 'curl -s http://localhost:7474', port: 7474 },
            { name: 'API Gateway', check: 'curl -s http://localhost:8000/health', port: 8000 }
        ];

        const results = [];
        for (const service of services) {
            try {
                execSync(service.check, { stdio: 'pipe', timeout: 5000 });
                results.push({ service: service.name, status: 'HEALTHY' });
                this.log('Service healthy', { service: service.name });
            } catch (error) {
                results.push({ service: service.name, status: 'UNHEALTHY', error: error.message });
                this.issues.push({
                    type: 'SERVICE_UNHEALTHY',
                    severity: 'MEDIUM',
                    service: service.name,
                    fix: `Start ${service.name} service`
                });
                this.log('Service unhealthy', { service: service.name, error: error.message });
            }
        }

        return results;
    }

    generateReport() {
        console.log('\n📊 CURSOR IDE MCP CANONICAL VERIFICATION REPORT');
        console.log('='.repeat(60));

        if (this.issues.length === 0) {
            console.log('\n✅ ALL VERIFICATIONS PASSED');
            console.log('Canonical MCP config is correct and operational');
        } else {
            console.log(`\n⚠️  FOUND ${this.issues.length} ISSUES:\n`);
            
            const bySeverity = {
                CRITICAL: [],
                HIGH: [],
                MEDIUM: []
            };

            this.issues.forEach(issue => {
                bySeverity[issue.severity] = bySeverity[issue.severity] || [];
                bySeverity[issue.severity].push(issue);
            });

            ['CRITICAL', 'HIGH', 'MEDIUM'].forEach(severity => {
                if (bySeverity[severity].length > 0) {
                    console.log(`\n${severity} ISSUES:`);
                    bySeverity[severity].forEach((issue, idx) => {
                        console.log(`\n${idx + 1}. ${issue.type}`);
                        console.log(`   Fix: ${issue.fix}`);
                        if (issue.error) console.log(`   Error: ${issue.error}`);
                    });
                }
            });
        }

        this.log('Verification report generated', { 
            issueCount: this.issues.length,
            criticalCount: this.issues.filter(i => i.severity === 'CRITICAL').length
        });
    }

    async execute() {
        console.log('🔍 VERIFYING CURSOR IDE MCP CANONICAL CONFIGURATION 🔍');
        console.log('='.repeat(60));

        await this.verifyCanonicalConfigExists();
        const config = await this.verifyCanonicalConfigValid();
        await this.verifyNoConflictingConfigs();
        await this.verifyGitHubSync();
        await this.verifyPixiMLActivation();
        await this.verifyNetworkConnections();

        this.generateReport();

        return this.issues.length === 0;
    }
}

// Execute verification
const verifier = new CursorMCPCanonicalVerifier();
verifier.execute().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 VERIFICATION FAILED:', error);
    process.exit(1);
});