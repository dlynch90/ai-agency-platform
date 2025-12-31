#!/usr/bin/env node

/**
 * FINAL COMPREHENSIVE AUDIT - CURSOR IDE MCP CANONICAL CONFIGURATION
 * Verifies ONE canonical URL/file, GitHub sync, MCP catalog integration,
 * Pixi ML activation, and all system integrations
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CANONICAL_MCP_CONFIG = path.join(process.env.HOME, '.cursor/mcp.json');
const LOG_FILE = path.join(__dirname, '../.cursor/debug.log');

class FinalComprehensiveAudit {
    constructor() {
        this.ensureLogDirectory();
        this.results = {
            canonical: {},
            githubSync: {},
            pixiML: {},
            network: {},
            integrations: {},
            goldenPaths: {}
        };
    }

    ensureLogDirectory() {
        const logDir = path.dirname(LOG_FILE);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    log(message, data = {}) {
        const entry = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            location: 'final-comprehensive-audit.mjs',
            message,
            data,
            sessionId: 'final-comprehensive-audit',
            hypothesisId: 'COMPREHENSIVE_AUDIT'
        };

        const logLine = JSON.stringify(entry) + '\n';
        fs.appendFileSync(LOG_FILE, logLine);
        console.log(`✅ ${message}`);
    }

    async auditCanonicalConfig() {
        console.log('\n🔍 AUDITING CANONICAL MCP CONFIGURATION');
        console.log('='.repeat(60));

        if (!fs.existsSync(CANONICAL_MCP_CONFIG)) {
            this.log('❌ Canonical config missing', { path: CANONICAL_MCP_CONFIG });
            return false;
        }

        const config = JSON.parse(fs.readFileSync(CANONICAL_MCP_CONFIG, 'utf8'));
        const serverCount = Object.keys(config.mcpServers || {}).length;

        this.results.canonical = {
            exists: true,
            path: CANONICAL_MCP_CONFIG,
            serverCount,
            version: config.version,
            hasGitHubSync: !!(config.githubSync || config.github_sync),
            servers: Object.keys(config.mcpServers || {})
        };

        this.log('Canonical config verified', this.results.canonical);
        return true;
    }

    async auditGitHubSync() {
        console.log('\n🔄 AUDITING GITHUB SYNC & MCP CATALOG INTEGRATION');
        console.log('='.repeat(60));

        try {
            // Check GitHub CLI
            execSync('gh --version', { stdio: 'pipe' });
            this.log('GitHub CLI available');

            // Check authentication
            execSync('gh auth status', { stdio: 'pipe' });
            this.log('GitHub CLI authenticated');

            // Fetch MCP catalog
            const catalogJson = execSync(
                `gh api repos/modelcontextprotocol/servers/contents/.mcp.json --jq '.content' | base64 -d`,
                { encoding: 'utf8' }
            );
            const catalog = JSON.parse(catalogJson);
            const catalogServerCount = Object.keys(catalog.mcpServers || {}).length;

            this.results.githubSync = {
                cliAvailable: true,
                authenticated: true,
                catalogFetched: true,
                catalogServerCount,
                syncScript: fs.existsSync(path.join(__dirname, 'sync-mcp-catalog-github.sh'))
            };

            this.log('GitHub sync verified', this.results.githubSync);
            return true;
        } catch (error) {
            this.log('GitHub sync audit failed', { error: error.message });
            return false;
        }
    }

    async auditPixiML() {
        console.log('\n🐍 AUDITING PIXI ML PACKAGES');
        console.log('='.repeat(60));

        const pixiTomlPath = path.join(__dirname, '../pixi.toml');
        
        if (!fs.existsSync(pixiTomlPath)) {
            this.log('❌ pixi.toml missing');
            return false;
        }

        const content = fs.readFileSync(pixiTomlPath, 'utf8');
        const defaultEnvMatch = content.match(/default\s*=\s*\{\s*features\s*=\s*\[([^\]]+)\]/);
        
        if (!defaultEnvMatch) {
            this.log('❌ Default environment not found');
            return false;
        }

        const features = defaultEnvMatch[1].split(',').map(f => f.trim().replace(/"/g, ''));
        const hasAiMl = features.includes('ai-ml');

        // Verify packages work
        try {
            const result = execSync('pixi run python -c "import torch; import transformers; print(torch.__version__, transformers.__version__)"', {
                cwd: path.dirname(pixiTomlPath),
                encoding: 'utf8',
                stdio: 'pipe'
            });
            const [torchVersion, transformersVersion] = result.trim().split(' ');

            this.results.pixiML = {
                defaultEnvFound: true,
                features,
                hasAiMl,
                torchVersion,
                transformersVersion,
                working: true
            };

            this.log('Pixi ML verified', this.results.pixiML);
            return true;
        } catch (error) {
            this.log('Pixi ML packages not working', { error: error.message });
            return false;
        }
    }

    async auditNetworkConnections() {
        console.log('\n🌐 AUDITING NETWORK CONNECTIONS');
        console.log('='.repeat(60));

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
                results.push({ service: service.name, status: 'HEALTHY', port: service.port });
                this.log(`Service healthy: ${service.name}`);
            } catch (error) {
                results.push({ service: service.name, status: 'UNHEALTHY', port: service.port });
                this.log(`Service unhealthy: ${service.name}`, { error: error.message });
            }
        }

        this.results.network = { services: results };
        return results.every(r => r.status === 'HEALTHY');
    }

    async auditIntegrations() {
        console.log('\n🔗 AUDITING SYSTEM INTEGRATIONS');
        console.log('='.repeat(60));

        const integrations = {
            neo4jMapper: fs.existsSync(path.join(__dirname, 'neo4j-golden-path-mapper.py')),
            predictiveToolCalling: fs.existsSync(path.join(__dirname, 'predictive-tool-calling-comprehensive.py')),
            celeryConfig: fs.existsSync(path.join(__dirname, '../configs/celery_config.py')),
            kubernetesConfig: fs.existsSync(path.join(__dirname, '../infra/kubernetes/mcp-integration.yaml')),
            cliRegistry: fs.existsSync(path.join(__dirname, '../configs/cli-registry.json'))
        };

        this.results.integrations = integrations;
        this.log('Integrations audited', integrations);
        return Object.values(integrations).every(v => v === true);
    }

    async auditGoldenPaths() {
        console.log('\n🕸️ AUDITING NEO4J GOLDEN PATH MAPPING');
        console.log('='.repeat(60));

        try {
            // Check Neo4j connection
            execSync('curl -s http://localhost:7474', { stdio: 'pipe', timeout: 5000 });
            
            const mapperScript = path.join(__dirname, 'neo4j-golden-path-mapper.py');
            const mapperExists = fs.existsSync(mapperScript);

            this.results.goldenPaths = {
                neo4jConnected: true,
                mapperScriptExists: mapperExists,
                ready: mapperExists
            };

            this.log('Golden paths audited', this.results.goldenPaths);
            return mapperExists;
        } catch (error) {
            this.log('Golden path audit failed', { error: error.message });
            return false;
        }
    }

    generateFinalReport() {
        console.log('\n📊 FINAL COMPREHENSIVE AUDIT REPORT');
        console.log('='.repeat(60));

        const allPassed = 
            this.results.canonical.exists &&
            this.results.githubSync.cliAvailable &&
            this.results.pixiML.working &&
            this.results.network.services?.every(s => s.status === 'HEALTHY') &&
            Object.values(this.results.integrations).every(v => v === true);

        console.log('\n✅ CANONICAL MCP CONFIG:');
        console.log(`   Path: ${this.results.canonical.path}`);
        console.log(`   Servers: ${this.results.canonical.serverCount}`);
        console.log(`   GitHub Sync: ${this.results.canonical.hasGitHubSync ? 'ENABLED' : 'DISABLED'}`);

        console.log('\n✅ GITHUB SYNC:');
        console.log(`   CLI Available: ${this.results.githubSync.cliAvailable ? 'YES' : 'NO'}`);
        console.log(`   Authenticated: ${this.results.githubSync.authenticated ? 'YES' : 'NO'}`);
        console.log(`   Catalog Servers: ${this.results.githubSync.catalogServerCount || 0}`);

        console.log('\n✅ PIXI ML PACKAGES:');
        console.log(`   Default Environment: ${this.results.pixiML.defaultEnvFound ? 'FOUND' : 'MISSING'}`);
        console.log(`   Features: ${this.results.pixiML.features?.join(', ') || 'N/A'}`);
        console.log(`   PyTorch: ${this.results.pixiML.torchVersion || 'NOT WORKING'}`);
        console.log(`   Transformers: ${this.results.pixiML.transformersVersion || 'NOT WORKING'}`);

        console.log('\n✅ NETWORK CONNECTIONS:');
        this.results.network.services?.forEach(s => {
            console.log(`   ${s.service}: ${s.status} (port ${s.port || 'N/A'})`);
        });

        console.log('\n✅ INTEGRATIONS:');
        Object.entries(this.results.integrations).forEach(([name, exists]) => {
            console.log(`   ${name}: ${exists ? '✅' : '❌'}`);
        });

        console.log('\n✅ GOLDEN PATHS:');
        console.log(`   Neo4j Connected: ${this.results.goldenPaths.neo4jConnected ? 'YES' : 'NO'}`);
        console.log(`   Mapper Script: ${this.results.goldenPaths.mapperScriptExists ? 'EXISTS' : 'MISSING'}`);

        console.log('\n' + '='.repeat(60));
        if (allPassed) {
            console.log('🎉 ALL AUDITS PASSED - SYSTEM FULLY OPERATIONAL');
            console.log('🚀 CANONICAL MCP CONFIG VERIFIED AND WORKING');
        } else {
            console.log('⚠️  SOME AUDITS FAILED - REVIEW ABOVE');
        }
        console.log('='.repeat(60));

        this.log('Final comprehensive audit complete', { allPassed });
        return allPassed;
    }

    async execute() {
        console.log('🚀 FINAL COMPREHENSIVE AUDIT - CURSOR IDE MCP CANONICAL');
        console.log('='.repeat(60));

        await this.auditCanonicalConfig();
        await this.auditGitHubSync();
        await this.auditPixiML();
        await this.auditNetworkConnections();
        await this.auditIntegrations();
        await this.auditGoldenPaths();

        const allPassed = this.generateFinalReport();
        return allPassed;
    }
}

// Execute audit
const audit = new FinalComprehensiveAudit();
audit.execute().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 AUDIT FAILED:', error);
    process.exit(1);
});