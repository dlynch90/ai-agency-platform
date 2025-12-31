#!/usr/bin/env node

/**
 * PERMANENT CACHE MANAGEMENT SYSTEM
 * Automated cache maintenance and monitoring
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEVELOPER_DIR = '/Users/daniellynch/Developer';
const CACHE_MONITOR_LOG = path.join(DEVELOPER_DIR, 'cache-monitor.log');

class CacheManager {
    constructor() {
        this.logFile = fs.createWriteStream(CACHE_MONITOR_LOG, { flags: 'a' });
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        this.logFile.write(logMessage + '\n');
    }

    async getCacheStats() {
        const stats = {};

        try {
            // NPM cache size
            const npmCache = execSync('npm config get cache', { encoding: 'utf8' }).trim();
            if (fs.existsSync(npmCache)) {
                stats.npm = execSync(`du -sh "${npmCache}" 2>/dev/null | cut -f1`, { encoding: 'utf8' }).trim();
            }
        } catch (e) { stats.npm = 'error'; }

        try {
            // Pixi cache size
            const pixiCache = '/Users/daniellynch/Library/Caches/rattler/cache';
            if (fs.existsSync(pixiCache)) {
                stats.pixi = execSync(`du -sh "${pixiCache}" 2>/dev/null | cut -f1`, { encoding: 'utf8' }).trim();
            } else {
                stats.pixi = 'empty';
            }
        } catch (e) { stats.pixi = 'error'; }

        try {
            // Node modules count
            stats.nodeModules = parseInt(execSync(`find "${DEVELOPER_DIR}" -name "node_modules" -type d | wc -l`, { encoding: 'utf8' }).trim());
        } catch (e) { stats.nodeModules = 'error'; }

        try {
            // Python cache files
            stats.pythonCache = execSync(`find "${DEVELOPER_DIR}" -name "__pycache__" -type d | wc -l`, { encoding: 'utf8' }).trim();
        } catch (e) { stats.pythonCache = 'error'; }

        return stats;
    }

    async maintainCaches() {
        this.log('🛠️ STARTING CACHE MAINTENANCE');

        const beforeStats = await this.getCacheStats();
        this.log(`Before maintenance: ${JSON.stringify(beforeStats)}`);

        // Clean NPM cache if > 1GB
        if (beforeStats.npm && beforeStats.npm.includes('G')) {
            const sizeGB = parseFloat(beforeStats.npm.replace('G', ''));
            if (sizeGB > 1.0) {
                this.log('NPM cache > 1GB, cleaning...');
                try {
                    execSync('npm cache clean --force', { stdio: 'pipe' });
                    this.log('✅ NPM cache cleaned');
                } catch (error) {
                    this.log(`❌ NPM cache clean failed: ${error.message}`);
                }
            }
        }

        // Clean old pixi cache files (> 30 days)
        try {
            const pixiCache = '/Users/daniellynch/Library/Caches/rattler/cache';
            if (fs.existsSync(pixiCache)) {
                execSync(`find "${pixiCache}" -type f -mtime +30 -delete 2>/dev/null || true`, { stdio: 'pipe' });
                this.log('✅ Old pixi cache files cleaned');
            }
        } catch (error) {
            this.log(`❌ Pixi cache clean failed: ${error.message}`);
        }

        // Clean excessive Python cache
        if (beforeStats.pythonCache && parseInt(beforeStats.pythonCache) > 100) {
            this.log('Excessive Python cache files, cleaning...');
            try {
                execSync(`find "${DEVELOPER_DIR}" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true`, { stdio: 'pipe' });
                this.log('✅ Python cache cleaned');
            } catch (error) {
                this.log(`❌ Python cache clean failed: ${error.message}`);
            }
        }

        // Clean broken symlinks
        try {
            const brokenLinks = execSync(`find "${DEVELOPER_DIR}" -type l -exec test ! -e {} \\; -print 2>/dev/null | wc -l`, { encoding: 'utf8' }).trim();
            if (parseInt(brokenLinks) > 0) {
                execSync(`find "${DEVELOPER_DIR}" -type l -exec test ! -e {} \\; -exec rm -f {} \\; 2>/dev/null || true`, { stdio: 'pipe' });
                this.log(`✅ ${brokenLinks} broken symlinks cleaned`);
            }
        } catch (error) {
            this.log(`❌ Broken symlink clean failed: ${error.message}`);
        }

        // Validate pixi environment
        try {
            execSync('pixi install --frozen --quiet', { stdio: 'pipe' });
            this.log('✅ Pixi environment validated');
        } catch (error) {
            this.log(`❌ Pixi validation failed: ${error.message}`);
        }

        const afterStats = await this.getCacheStats();
        this.log(`After maintenance: ${JSON.stringify(afterStats)}`);

        this.log('🛠️ CACHE MAINTENANCE COMPLETE');
        return { before: beforeStats, after: afterStats };
    }

    async validateSystemHealth() {
        this.log('🔍 VALIDATING SYSTEM HEALTH');

        const health = { passed: 0, failed: 0, checks: [] };

        // Check pixi
        try {
            execSync('pixi --version', { stdio: 'pipe' });
            health.checks.push({ name: 'pixi', status: '✅' });
            health.passed++;
        } catch (e) {
            health.checks.push({ name: 'pixi', status: '❌', error: e.message });
            health.failed++;
        }

        // Check python
        try {
            const version = execSync('python3 --version', { encoding: 'utf8' }).trim();
            health.checks.push({ name: 'python', status: '✅', version });
            health.passed++;
        } catch (e) {
            health.checks.push({ name: 'python', status: '❌', error: e.message });
            health.failed++;
        }

        // Check npm
        try {
            execSync('npm --version', { stdio: 'pipe' });
            health.checks.push({ name: 'npm', status: '✅' });
            health.passed++;
        } catch (e) {
            health.checks.push({ name: 'npm', status: '❌', error: e.message });
            health.failed++;
        }

        // Check for excessive node_modules
        const stats = await this.getCacheStats();
        if (stats.nodeModules && stats.nodeModules > 100) {
            health.checks.push({
                name: 'node_modules',
                status: '⚠️',
                message: `${stats.nodeModules} directories (should be < 100)`
            });
        } else {
            health.checks.push({ name: 'node_modules', status: '✅' });
        }

        this.log(`Health check: ${health.passed} passed, ${health.failed} failed`);
        health.checks.forEach(check => {
            this.log(`  ${check.name}: ${check.status} ${check.version || check.message || ''}`);
        });

        return health;
    }

    async runDailyMaintenance() {
        this.log('📅 RUNNING DAILY CACHE MAINTENANCE');

        try {
            await this.maintainCaches();
            const health = await this.validateSystemHealth();

            // Alert if health is poor
            if (health.failed > 0) {
                this.log(`🚨 ALERT: ${health.failed} health checks failed`);
            } else {
                this.log('✅ All health checks passed');
            }

            return { success: true, health };

        } catch (error) {
            this.log(`💥 MAINTENANCE FAILED: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    close() {
        this.logFile.end();
    }
}

// CLI interface
async function main() {
    const manager = new CacheManager();

    const command = process.argv[2] || 'maintain';

    try {
        switch (command) {
            case 'maintain':
                await manager.runDailyMaintenance();
                break;
            case 'stats':
                const stats = await manager.getCacheStats();
                console.log(JSON.stringify(stats, null, 2));
                break;
            case 'health':
                const health = await manager.validateSystemHealth();
                console.log(JSON.stringify(health, null, 2));
                break;
            default:
                console.log('Usage: node cache-management-system.cjs [maintain|stats|health]');
        }
    } finally {
        manager.close();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = CacheManager;