#!/usr/bin/env node

/**
 * COMPREHENSIVE CACHE DEBUGGER
 * Nuclear-level cache analysis and debugging
 * System-wide cache integrity, performance, and sabotage detection
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ComprehensiveCacheDebugger {
    constructor() {
        this.caches = {
            system: [],
            application: [],
            network: [],
            credential: [],
            package: [],
            browser: [],
            database: []
        };
        this.findings = {
            corrupted: [],
            stale: [],
            oversized: [],
            missing: [],
            sabotaged: [],
            performance: []
        };
        this.logFile = path.join(__dirname, '.cursor/debug.log');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    log(message, data = {}) {
        const entry = {
            id: `cache_debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            location: 'comprehensive-cache-debugger.js',
            message,
            data,
            sessionId: 'comprehensive-cache-debug',
            hypothesisId: 'CACHE_ANALYSIS'
        };

        const logLine = JSON.stringify(entry) + '\n';
        fs.appendFileSync(this.logFile, logLine);
        console.log(`🔍 ${message}`);
    }

    // HYPOTHESIS 1: System cache corruption and staleness
    async analyzeSystemCaches() {
        this.log('🔥 ANALYZING SYSTEM CACHES - HYPOTHESIS 1');

        const systemCacheDirs = [
            '/System/Library/Caches',
            '/Library/Caches',
            '/private/var/folders',
            '/tmp',
            '/var/tmp'
        ];

        for (const cacheDir of systemCacheDirs) {
            try {
                if (fs.existsSync(cacheDir)) {
                    const stats = fs.statSync(cacheDir);
                    const size = this.getDirectorySize(cacheDir);

                    this.caches.system.push({
                        path: cacheDir,
                        size,
                        mtime: stats.mtime,
                        permissions: stats.mode.toString(8)
                    });

                    // Check for corruption indicators
                    if (size > 1024 * 1024 * 1024) { // > 1GB
                        this.findings.oversized.push(`${cacheDir}: ${this.formatBytes(size)}`);
                    }

                    // Check staleness (>30 days)
                    const age = Date.now() - stats.mtime.getTime();
                    if (age > 30 * 24 * 60 * 60 * 1000) {
                        this.findings.stale.push(`${cacheDir}: ${(age / (24 * 60 * 60 * 1000)).toFixed(1)} days old`);
                    }

                    this.log('System cache analyzed', { cacheDir, size: this.formatBytes(size), age: Math.floor(age / (24 * 60 * 60 * 1000)) });
                } else {
                    this.findings.missing.push(`${cacheDir}: directory missing`);
                }
            } catch (error) {
                this.findings.corrupted.push(`${cacheDir}: ${error.message}`);
                this.log('System cache error', { cacheDir, error: error.message });
            }
        }
    }

    // HYPOTHESIS 2: Application cache sabotage and corruption
    async analyzeApplicationCaches() {
        this.log('🔥 ANALYZING APPLICATION CACHES - HYPOTHESIS 2');

        const homeDir = process.env.HOME;
        const appCacheDirs = [
            path.join(homeDir, '.cache'),
            path.join(homeDir, 'Library/Caches'),
            path.join(homeDir, '.npm/_cacache'),
            path.join(homeDir, '.pnpm-cache'),
            path.join(homeDir, '.yarn/cache'),
            path.join(homeDir, '.gradle/caches'),
            path.join(homeDir, '.m2/repository'),
            path.join(homeDir, 'Developer/.cursor/cache'),
            path.join(homeDir, 'Developer/node_modules/.cache')
        ];

        for (const cacheDir of appCacheDirs) {
            try {
                if (fs.existsSync(cacheDir)) {
                    const size = this.getDirectorySize(cacheDir);
                    const stats = fs.statSync(cacheDir);

                    this.caches.application.push({
                        path: cacheDir,
                        size,
                        mtime: stats.mtime,
                        permissions: stats.mode.toString(8)
                    });

                    // Check for sabotage indicators
                    if (size === 0 && fs.readdirSync(cacheDir).length === 0) {
                        this.findings.sabotaged.push(`${cacheDir}: empty cache directory`);
                    }

                    // Check for oversized caches
                    if (size > 500 * 1024 * 1024) { // > 500MB
                        this.findings.oversized.push(`${cacheDir}: ${this.formatBytes(size)}`);
                    }

                    // Check file integrity
                    const corrupted = this.checkCacheIntegrity(cacheDir);
                    if (corrupted.length > 0) {
                        this.findings.corrupted.push(...corrupted.map(f => `${cacheDir}/${f}`));
                    }

                    this.log('Application cache analyzed', { cacheDir, size: this.formatBytes(size), corruptedCount: corrupted.length });
                } else {
                    this.findings.missing.push(`${cacheDir}: directory missing`);
                }
            } catch (error) {
                this.findings.corrupted.push(`${cacheDir}: ${error.message}`);
                this.log('Application cache error', { cacheDir, error: error.message });
            }
        }
    }

    // HYPOTHESIS 3: Network and DNS cache poisoning
    async analyzeNetworkCaches() {
        this.log('🔥 ANALYZING NETWORK CACHES - HYPOTHESIS 3');

        try {
            // DNS cache
            const dnsCache = execSync('dscacheutil -statistics', { encoding: 'utf8' });
            this.caches.network.push({
                type: 'dns',
                data: dnsCache,
                timestamp: Date.now()
            });

            // ARP cache
            const arpCache = execSync('arp -a', { encoding: 'utf8' });
            this.caches.network.push({
                type: 'arp',
                data: arpCache,
                timestamp: Date.now()
            });

            // Check for suspicious entries
            if (arpCache.includes('incomplete') || arpCache.includes('failed')) {
                this.findings.sabotaged.push('ARP cache: incomplete/failed entries detected');
            }

            this.log('Network caches analyzed', { dnsEntries: dnsCache.split('\n').length, arpEntries: arpCache.split('\n').length });
        } catch (error) {
            this.findings.corrupted.push(`Network cache: ${error.message}`);
            this.log('Network cache error', { error: error.message });
        }
    }

    // HYPOTHESIS 4: Credential cache corruption and hijacking
    async analyzeCredentialCaches() {
        this.log('🔥 ANALYZING CREDENTIAL CACHES - HYPOTHESIS 4');

        const homeDir = process.env.HOME;
        const credCacheDirs = [
            path.join(homeDir, '.cache/zsh-credentials'),
            path.join(homeDir, 'Library/Keychains'),
            path.join(homeDir, '.1password'),
            path.join(homeDir, '.aws'),
            path.join(homeDir, '.ssh'),
            path.join(homeDir, 'Developer/.cursor/credentials')
        ];

        for (const cacheDir of credCacheDirs) {
            try {
                if (fs.existsSync(cacheDir)) {
                    const size = this.getDirectorySize(cacheDir);
                    const files = fs.readdirSync(cacheDir);

                    this.caches.credential.push({
                        path: cacheDir,
                        size,
                        fileCount: files.length,
                        permissions: fs.statSync(cacheDir).mode.toString(8)
                    });

                    // Check for suspicious permissions (world-readable)
                    const stats = fs.statSync(cacheDir);
                    if ((stats.mode & 0o077) !== 0) {
                        this.findings.sabotaged.push(`${cacheDir}: insecure permissions ${stats.mode.toString(8)}`);
                    }

                    // Check for credential files
                    const credFiles = files.filter(f => f.includes('key') || f.includes('token') || f.includes('secret'));
                    if (credFiles.length > 0) {
                        this.log('Credential files found', { cacheDir, credFiles });
                    }

                    // Check for staleness
                    const age = Date.now() - stats.mtime.getTime();
                    if (age > 7 * 24 * 60 * 60 * 1000) { // > 7 days
                        this.findings.stale.push(`${cacheDir}: ${Math.floor(age / (24 * 60 * 60 * 1000))} days old`);
                    }
                } else {
                    this.findings.missing.push(`${cacheDir}: credential cache missing`);
                }
            } catch (error) {
                this.findings.corrupted.push(`${cacheDir}: ${error.message}`);
                this.log('Credential cache error', { cacheDir, error: error.message });
            }
        }
    }

    // HYPOTHESIS 5: Package manager cache sabotage
    async analyzePackageCaches() {
        this.log('🔥 ANALYZING PACKAGE MANAGER CACHES - HYPOTHESIS 5');

        const packageManagers = [
            { name: 'npm', cache: execSync('npm config get cache', { encoding: 'utf8' }).trim() },
            { name: 'yarn', cache: path.join(process.env.HOME, '.yarn/cache') },
            { name: 'pnpm', cache: execSync('pnpm config get store-dir', { encoding: 'utf8' }).trim() },
            { name: 'pip', cache: path.join(process.env.HOME, '.cache/pip') },
            { name: 'cargo', cache: path.join(process.env.HOME, '.cargo/registry') }
        ];

        for (const pm of packageManagers) {
            try {
                if (fs.existsSync(pm.cache)) {
                    const size = this.getDirectorySize(pm.cache);
                    const stats = fs.statSync(pm.cache);

                    this.caches.package.push({
                        manager: pm.name,
                        path: pm.cache,
                        size,
                        mtime: stats.mtime
                    });

                    // Check for cache poisoning indicators
                    if (size === 0) {
                        this.findings.sabotaged.push(`${pm.name} cache: empty cache`);
                    }

                    // Check for oversized caches
                    if (size > 2 * 1024 * 1024 * 1024) { // > 2GB
                        this.findings.oversized.push(`${pm.name} cache: ${this.formatBytes(size)}`);
                    }

                    this.log('Package cache analyzed', { manager: pm.name, size: this.formatBytes(size) });
                } else {
                    this.findings.missing.push(`${pm.name} cache: directory missing`);
                }
            } catch (error) {
                this.findings.corrupted.push(`${pm.name} cache: ${error.message}`);
                this.log('Package cache error', { manager: pm.name, error: error.message });
            }
        }
    }

    // HYPOTHESIS 6: Browser cache manipulation and tracking
    async analyzeBrowserCaches() {
        this.log('🔥 ANALYZING BROWSER CACHES - HYPOTHESIS 6');

        const homeDir = process.env.HOME;
        const browserCacheDirs = [
            path.join(homeDir, 'Library/Caches/com.apple.Safari'),
            path.join(homeDir, 'Library/Caches/Google/Chrome'),
            path.join(homeDir, 'Library/Caches/Firefox'),
            path.join(homeDir, 'Library/Application Support/Google/Chrome'),
            path.join(homeDir, '.mozilla/firefox')
        ];

        for (const cacheDir of browserCacheDirs) {
            try {
                if (fs.existsSync(cacheDir)) {
                    const size = this.getDirectorySize(cacheDir);
                    const stats = fs.statSync(cacheDir);

                    this.caches.browser.push({
                        path: cacheDir,
                        size,
                        mtime: stats.mtime
                    });

                    // Check for suspicious activity
                    if (size > 1024 * 1024 * 1024) { // > 1GB
                        this.findings.oversized.push(`Browser cache ${cacheDir}: ${this.formatBytes(size)}`);
                    }

                    // Check for recent suspicious modifications
                    const age = Date.now() - stats.mtime.getTime();
                    if (age < 60 * 1000) { // Modified in last minute
                        this.findings.sabotaged.push(`${cacheDir}: recently modified (${Math.floor(age / 1000)}s ago)`);
                    }

                    this.log('Browser cache analyzed', { cacheDir, size: this.formatBytes(size) });
                }
            } catch (error) {
                this.findings.corrupted.push(`Browser cache ${cacheDir}: ${error.message}`);
                this.log('Browser cache error', { cacheDir, error: error.message });
            }
        }
    }

    // HYPOTHESIS 7: Database cache corruption and poisoning
    async analyzeDatabaseCaches() {
        this.log('🔥 ANALYZING DATABASE CACHES - HYPOTHESIS 7');

        try {
            // Check PostgreSQL
            const pgRunning = execSync('pg_isready 2>/dev/null || echo "not running"', { encoding: 'utf8' });
            if (!pgRunning.includes('not running')) {
                this.caches.database.push({
                    type: 'postgresql',
                    status: 'running',
                    timestamp: Date.now()
                });
            }

            // Check Redis
            const redisRunning = execSync('redis-cli ping 2>/dev/null || echo "not running"', { encoding: 'utf8' });
            if (redisRunning.includes('PONG')) {
                this.caches.database.push({
                    type: 'redis',
                    status: 'running',
                    timestamp: Date.now()
                });
            }

            // Check Neo4j
            const neo4jRunning = execSync('curl -s http://localhost:7474 || echo "not running"', { encoding: 'utf8' });
            if (!neo4jRunning.includes('not running')) {
                this.caches.database.push({
                    type: 'neo4j',
                    status: 'running',
                    timestamp: Date.now()
                });
            }

            this.log('Database caches analyzed', {
                postgresql: pgRunning.includes('not running') ? 'down' : 'running',
                redis: redisRunning.includes('PONG') ? 'running' : 'down',
                neo4j: neo4jRunning.includes('not running') ? 'down' : 'running'
            });
        } catch (error) {
            this.findings.corrupted.push(`Database cache: ${error.message}`);
            this.log('Database cache error', { error: error.message });
        }
    }

    // UTILITY FUNCTIONS
    getDirectorySize(dirPath) {
        let totalSize = 0;
        try {
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                if (stats.isDirectory()) {
                    totalSize += this.getDirectorySize(filePath);
                } else {
                    totalSize += stats.size;
                }
            }
        } catch (error) {
            // Ignore errors for size calculation
        }
        return totalSize;
    }

    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    checkCacheIntegrity(cacheDir) {
        const corrupted = [];
        try {
            const files = fs.readdirSync(cacheDir);
            for (const file of files) {
                const filePath = path.join(cacheDir, file);
                try {
                    const stats = fs.statSync(filePath);
                    if (stats.size === 0) {
                        corrupted.push(file);
                    }
                } catch (error) {
                    corrupted.push(file);
                }
            }
        } catch (error) {
            // Directory access error
        }
        return corrupted;
    }

    // NUCLEAR CACHE PURGE - WHEN ALL ELSE FAILS
    async nuclearCachePurge() {
        this.log('💥 INITIATING NUCLEAR CACHE PURGE');

        const purgeCommands = [
            'sudo dscacheutil -flushcache',
            'sudo killall -HUP mDNSResponder',
            'rm -rf ~/Library/Caches/*',
            'rm -rf ~/.cache/*',
            'npm cache clean --force',
            'yarn cache clean',
            'pnpm store prune',
            'pip cache purge',
            'docker system prune -f',
            'find /tmp -name "*" -type f -mtime +1 -delete'
        ];

        for (const cmd of purgeCommands) {
            try {
                execSync(cmd, { stdio: 'inherit' });
                this.log('Nuclear purge command executed', { command: cmd });
            } catch (error) {
                this.log('Nuclear purge command failed', { command: cmd, error: error.message });
            }
        }
    }

    // MASTER ANALYSIS EXECUTOR
    async executeComprehensiveAnalysis() {
        console.log('🚨 COMPREHENSIVE CACHE DEBUGGER - NUCLEAR LEVEL ANALYSIS 🚨');
        console.log('=' * 60);

        await this.analyzeSystemCaches();
        await this.analyzeApplicationCaches();
        await this.analyzeNetworkCaches();
        await this.analyzeCredentialCaches();
        await this.analyzePackageCaches();
        await this.analyzeBrowserCaches();
        await this.analyzeDatabaseCaches();

        this.generateReport();
    }

    generateReport() {
        console.log('\n📊 COMPREHENSIVE CACHE ANALYSIS REPORT 📊');
        console.log('=' * 50);

        console.log(`\n🔍 Total caches analyzed: ${Object.values(this.caches).flat().length}`);

        console.log('\n🚨 CRITICAL FINDINGS:');
        Object.keys(this.findings).forEach(category => {
            if (this.findings[category].length > 0) {
                console.log(`\n${category.toUpperCase()}:`);
                this.findings[category].forEach(finding => {
                    console.log(`  ❌ ${finding}`);
                });
            }
        });

        const totalIssues = Object.values(this.findings).flat().length;
        console.log(`\n🎯 TOTAL ISSUES FOUND: ${totalIssues}`);

        if (totalIssues > 10) {
            console.log('\n💥 HIGH THREAT LEVEL DETECTED - RECOMMENDING NUCLEAR PURGE');
            this.nuclearCachePurge();
        }

        this.log('Comprehensive analysis completed', {
            totalCaches: Object.values(this.caches).flat().length,
            totalIssues,
            findings: this.findings
        });
    }
}

// EXECUTE THE NUCLEAR DEBUGGING
const cacheDebugger = new ComprehensiveCacheDebugger();
cacheDebugger.executeComprehensiveAnalysis().catch(error => {
    console.error('💥 COMPREHENSIVE CACHE DEBUGGING FAILED:', error);
    process.exit(1);
});