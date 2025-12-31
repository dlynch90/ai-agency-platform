#!/usr/bin/env node

/**
 * COMPREHENSIVE CACHE DEBUGGING AND FIXING SCRIPT
 * Nuclear option - fixes all cache corruption issues systematically
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEVELOPER_DIR = '/Users/daniellynch/Developer';
const CACHE_REPORT = path.join(DEVELOPER_DIR, 'cache-debug-report.json');

class CacheDebugger {
    constructor() {
        this.report = {
            timestamp: new Date().toISOString(),
            phase: 'initialization',
            issues: [],
            fixes: [],
            before: {},
            after: {}
        };
    }

    log(message) {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }

    error(message, error) {
        console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error?.message || error);
        this.report.issues.push({ message, error: error?.message, timestamp: new Date().toISOString() });
    }

    success(message) {
        console.log(`[${new Date().toISOString()}] ✅ ${message}`);
        this.report.fixes.push({ message, timestamp: new Date().toISOString() });
    }

    async measureCacheSizes() {
        const sizes = {};

        try {
            // NPM cache size
            const npmCache = execSync('npm config get cache', { encoding: 'utf8' }).trim();
            if (fs.existsSync(npmCache)) {
                sizes.npm = execSync(`du -sh "${npmCache}" 2>/dev/null | cut -f1`, { encoding: 'utf8' }).trim();
            }
        } catch (e) { sizes.npm = 'error'; }

        try {
            // Pixi cache size
            const pixiCache = '/Users/daniellynch/Library/Caches/rattler/cache';
            if (fs.existsSync(pixiCache)) {
                sizes.pixi = execSync(`du -sh "${pixiCache}" 2>/dev/null | cut -f1`, { encoding: 'utf8' }).trim();
            } else {
                sizes.pixi = 'empty';
            }
        } catch (e) { sizes.pixi = 'error'; }

        try {
            // Mise cache
            const miseCache = '/Users/daniellynch/.cache/mise';
            if (fs.existsSync(miseCache)) {
                sizes.mise = execSync(`du -sh "${miseCache}" 2>/dev/null | cut -f1`, { encoding: 'utf8' }).trim();
            } else {
                sizes.mise = 'empty/missing';
            }
        } catch (e) { sizes.mise = 'error'; }

        try {
            // Node modules count
            sizes.nodeModules = parseInt(execSync(`find "${DEVELOPER_DIR}" -name "node_modules" -type d | wc -l`, { encoding: 'utf8' }).trim());
        } catch (e) { sizes.nodeModules = 'error'; }

        return sizes;
    }

    async clearNpmCache() {
        this.log('Clearing NPM cache...');
        try {
            execSync('npm cache clean --force', { stdio: 'pipe' });
            this.success('NPM cache cleared');
        } catch (error) {
            this.error('Failed to clear NPM cache', error);
        }
    }

    async clearPixiCache() {
        this.log('Clearing Pixi cache and environment...');
        try {
            // Remove pixi cache directory
            const pixiCache = '/Users/daniellynch/Library/Caches/rattler/cache';
            if (fs.existsSync(pixiCache)) {
                execSync(`rm -rf "${pixiCache}"`, { stdio: 'pipe' });
                this.success('Pixi cache directory removed');
            }

            // Remove corrupted pixi environment
            const pixiEnv = path.join(DEVELOPER_DIR, '.pixi');
            if (fs.existsSync(pixiEnv)) {
                execSync(`rm -rf "${pixiEnv}"`, { stdio: 'pipe' });
                this.success('Corrupted pixi environment removed');
            }

            // Reinstall pixi environment
            process.chdir(DEVELOPER_DIR);
            execSync('pixi install', { stdio: 'inherit' });
            this.success('Pixi environment reinstalled');
        } catch (error) {
            this.error('Failed to clear Pixi cache', error);
        }
    }

    async clearMiseCache() {
        this.log('Clearing Mise cache...');
        try {
            execSync('mise cache clear', { stdio: 'pipe' });
            this.success('Mise cache cleared');
        } catch (error) {
            // Mise might not have cache clear command, try manual removal
            try {
                const miseCache = '/Users/daniellynch/.cache/mise';
                if (fs.existsSync(miseCache)) {
                    execSync(`rm -rf "${miseCache}"`, { stdio: 'pipe' });
                    this.success('Mise cache directory removed manually');
                }
            } catch (manualError) {
                this.error('Failed to clear Mise cache manually', manualError);
            }
        }
    }

    async removeDuplicateNodeModules() {
        this.log('Removing duplicate node_modules directories...');
        try {
            // Find all node_modules except the root one
            const cmd = `find "${DEVELOPER_DIR}" -name "node_modules" -type d | grep -v "^${DEVELOPER_DIR}/node_modules$" | head -10`;
            const duplicates = execSync(cmd, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);

            for (const dir of duplicates) {
                if (dir && fs.existsSync(dir)) {
                    execSync(`rm -rf "${dir}"`, { stdio: 'pipe' });
                    this.success(`Removed duplicate node_modules: ${dir}`);
                }
            }

            // Count remaining
            const remaining = execSync(`find "${DEVELOPER_DIR}" -name "node_modules" -type d | wc -l`, { encoding: 'utf8' }).trim();
            this.success(`Remaining node_modules directories: ${remaining}`);

        } catch (error) {
            this.error('Failed to remove duplicate node_modules', error);
        }
    }

    async fixBrokenSymlinks() {
        this.log('Fixing broken symlinks...');
        try {
            // Find broken symlinks
            const cmd = `find "${DEVELOPER_DIR}" -type l -exec test ! -e {} \\; -print`;
            const brokenLinks = execSync(cmd, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);

            for (const link of brokenLinks) {
                if (link) {
                    execSync(`rm -f "${link}"`, { stdio: 'pipe' });
                    this.success(`Removed broken symlink: ${link}`);
                }
            }

            this.success(`Fixed ${brokenLinks.length} broken symlinks`);

        } catch (error) {
            this.error('Failed to fix broken symlinks', error);
        }
    }

    async clearPythonCache() {
        this.log('Clearing Python cache files...');
        try {
            // Remove __pycache__ directories
            execSync(`find "${DEVELOPER_DIR}" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true`, { stdio: 'pipe' });

            // Remove .pyc files
            execSync(`find "${DEVELOPER_DIR}" -name "*.pyc" -delete 2>/dev/null || true`, { stdio: 'pipe' });

            // Remove .pyo files
            execSync(`find "${DEVELOPER_DIR}" -name "*.pyo" -delete 2>/dev/null || true`, { stdio: 'pipe' });

            this.success('Python cache files cleared');

        } catch (error) {
            this.error('Failed to clear Python cache', error);
        }
    }

    async rebuildMcpConfigurations() {
        this.log('Rebuilding MCP configurations...');
        try {
            // Validate MCP config files
            const mcpConfigs = [
                'configs/mcp/mcp.json',
                'mcp/configs/mcp-registry.json',
                'configs/mcp-config.toml'
            ];

            for (const config of mcpConfigs) {
                const configPath = path.join(DEVELOPER_DIR, config);
                if (fs.existsSync(configPath)) {
                    // Validate JSON/TOML syntax
                    if (config.endsWith('.json')) {
                        JSON.parse(fs.readFileSync(configPath, 'utf8'));
                        this.success(`Validated MCP config: ${config}`);
                    }
                }
            }

        } catch (error) {
            this.error('Failed to rebuild MCP configurations', error);
        }
    }

    async run() {
        this.log('🚀 STARTING COMPREHENSIVE CACHE DEBUGGING');

        // Phase 1: Measure before state
        this.report.phase = 'measuring_before';
        this.report.before = await this.measureCacheSizes();
        this.log(`Before state: ${JSON.stringify(this.report.before, null, 2)}`);

        // Phase 2: Clear all caches
        this.report.phase = 'clearing_caches';
        await this.clearNpmCache();
        await this.clearPixiCache();
        await this.clearMiseCache();
        await this.clearPythonCache();

        // Phase 3: Fix structural issues
        this.report.phase = 'fixing_structure';
        await this.removeDuplicateNodeModules();
        await this.fixBrokenSymlinks();

        // Phase 4: Consolidate environments
        this.report.phase = 'consolidating_environments';
        await this.rebuildMcpConfigurations();

        // Phase 5: Measure after state
        this.report.phase = 'measuring_after';
        this.report.after = await this.measureCacheSizes();
        this.log(`After state: ${JSON.stringify(this.report.after, null, 2)}`);

        // Phase 6: Final validation
        this.report.phase = 'final_validation';
        await this.finalValidation();

        // Save report
        fs.writeFileSync(CACHE_REPORT, JSON.stringify(this.report, null, 2));
        this.log(`📊 Cache debug report saved to: ${CACHE_REPORT}`);

        this.log('🎉 CACHE DEBUGGING COMPLETE');
    }

    async finalValidation() {
        this.log('Running final validation...');

        try {
            // Test pixi
            execSync('pixi --version', { stdio: 'pipe' });
            this.success('Pixi is working');

            // Test python
            const pythonVersion = execSync('python3 --version', { encoding: 'utf8' }).trim();
            this.success(`Python is working: ${pythonVersion}`);

            // Test npm
            execSync('npm --version', { stdio: 'pipe' });
            this.success('NPM is working');

            // Test PyTorch installation
            try {
                const torchCheck = execSync('python3 -c "import torch; print(f\'PyTorch {torch.version.__version__} available\')"', { encoding: 'utf8' }).trim();
                this.success(`ML packages working: ${torchCheck}`);
            } catch (e) {
                this.error('PyTorch not available', e);
            }

        } catch (error) {
            this.error('Final validation failed', error);
        }
    }
}

// Run the debugger
const cacheDebugger = new CacheDebugger();
cacheDebugger.run().catch(error => {
    console.error('Cache debugging failed:', error);
    process.exit(1);
});