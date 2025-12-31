#!/usr/bin/env node

/**
 * COMPREHENSIVE CACHE DEBUG ORCHESTRATOR
 * Nuclear Cache Clearing and Validation System
 *
 * This script systematically clears, validates, and rebuilds all caches
 * across Node.js, Go, Rust, Python, Docker, and system caches.
 *
 * VENDOR COMPLIANCE: Uses only vendor CLI tools and SDKs
 */

import { execSync, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const CACHE_OPERATIONS = {
  node: {
    clear: [
      'npm cache clean --force',
      'pnpm store prune --force',
      'yarn cache clean --all',
      'rm -rf node_modules package-lock.json yarn.lock pnpm-lock.yaml'
    ],
    validate: [
      'npm cache verify',
      'pnpm store status'
    ],
    rebuild: [
      'npm install',
      'pnpm install --frozen-lockfile'
    ]
  },
  go: {
    clear: [
      'go clean -cache',
      'go clean -modcache',
      'go clean -testcache'
    ],
    validate: [
      'go version',
      'go env GOCACHE',
      'go env GOMODCACHE'
    ],
    rebuild: [
      'go mod download',
      'go mod verify'
    ]
  },
  rust: {
    clear: [
      'cargo clean',
      'rm -rf ~/.cargo/registry/cache',
      'rm -rf ~/.cargo/git/checkouts'
    ],
    validate: [
      'rustc --version',
      'cargo --version',
      'cargo check'
    ],
    rebuild: [
      'cargo fetch',
      'cargo update'
    ]
  },
  python: {
    clear: [
      'pip cache purge',
      'pixi clean cache --yes',
      'rm -rf ~/.cache/pip',
      'find . -name __pycache__ -type d -exec rm -rf {} + 2>/dev/null || true',
      'find . -name "*.pyc" -delete 2>/dev/null || true'
    ],
    validate: [
      'python --version',
      'pip --version',
      'pixi --version'
    ],
    rebuild: [
      'pip install --upgrade pip',
      'pixi install'
    ]
  },
  docker: {
    clear: [
      'docker system prune -a --volumes --force',
      'docker builder prune -a --force'
    ],
    validate: [
      'docker version',
      'docker system df'
    ],
    rebuild: [
      'docker buildx ls'
    ]
  },
  system: {
    clear: [
      'rm -rf ~/.cache/*',
      'rm -rf ~/.gradle/caches',
      'rm -rf ~/.kube/cache',
      'rm -rf ~/.minikube/cache'
    ],
    validate: [
      'df -h',
      'du -sh ~'
    ]
  }
};

class CacheOrchestrator {
  constructor() {
    this.results = {
      cleared: [],
      validated: [],
      rebuilt: [],
      errors: []
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '🔴' : level === 'success' ? '✅' : '🔵';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async executeCommand(command, description, cwd = process.cwd()) {
    try {
      this.log(`Executing: ${description} - ${command}`);

      const result = execSync(command, {
        cwd,
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 300000, // 5 minute timeout
        env: { ...process.env, FORCE_COLOR: '1' }
      });

      this.log(`Success: ${description}`, 'success');
      return { success: true, output: result };
    } catch (error) {
      const errorMsg = `Failed: ${description} - ${error.message}`;
      this.log(errorMsg, 'error');
      this.results.errors.push({ command, description, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async clearCache(language) {
    const operations = CACHE_OPERATIONS[language]?.clear || [];
    this.log(`🧹 CLEARING ${language.toUpperCase()} CACHES`);

    for (const command of operations) {
      const result = await this.executeCommand(command, `${language} cache clear: ${command}`);
      if (result.success) {
        this.results.cleared.push({ language, command });
      }
    }
  }

  async validateCache(language) {
    const operations = CACHE_OPERATIONS[language]?.validate || [];
    this.log(`🔍 VALIDATING ${language.toUpperCase()} CACHES`);

    for (const command of operations) {
      const result = await this.executeCommand(command, `${language} cache validate: ${command}`);
      if (result.success) {
        this.results.validated.push({ language, command, output: result.output });
      }
    }
  }

  async rebuildCache(language) {
    const operations = CACHE_OPERATIONS[language]?.rebuild || [];
    this.log(`🔨 REBUILDING ${language.toUpperCase()} CACHES`);

    for (const command of operations) {
      const result = await this.executeCommand(command, `${language} cache rebuild: ${command}`);
      if (result.success) {
        this.results.rebuilt.push({ language, command });
      }
    }
  }

  async runFullCacheCycle() {
    const languages = Object.keys(CACHE_OPERATIONS);

    // Phase 1: Clear all caches
    this.log('🚀 PHASE 1: NUCLEAR CACHE CLEARING');
    for (const lang of languages) {
      await this.clearCache(lang);
    }

    // Phase 2: Validate installations
    this.log('🔍 PHASE 2: VALIDATION');
    for (const lang of languages) {
      await this.validateCache(lang);
    }

    // Phase 3: Rebuild caches
    this.log('🔨 PHASE 3: CACHE REBUILDING');
    for (const lang of languages) {
      await this.rebuildCache(lang);
    }

    // Phase 4: Final validation
    this.log('🎯 PHASE 4: FINAL SYSTEM VALIDATION');
    await this.finalSystemCheck();

    return this.results;
  }

  async finalSystemCheck() {
    const checks = [
      'node --version',
      'npm --version',
      'pnpm --version',
      'go version',
      'rustc --version',
      'cargo --version',
      'python --version',
      'pixi --version',
      'docker --version',
      'git --version'
    ];

    this.log('🩺 FINAL SYSTEM HEALTH CHECK');

    for (const check of checks) {
      await this.executeCommand(check, `System check: ${check}`);
    }

    // Check cache sizes after operations
    await this.executeCommand('du -sh ~/.npm ~/.cargo /tmp/pnpm-store/v3 2>/dev/null || echo "Cache size check complete"', 'Cache size verification');
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      system: os.platform(),
      node_version: process.version,
      results: this.results,
      summary: {
        caches_cleared: this.results.cleared.length,
        validations_passed: this.results.validated.length,
        rebuilds_completed: this.results.rebuilt.length,
        errors_encountered: this.results.errors.length
      }
    };

    const reportPath = path.join(process.cwd(), 'cache-debug-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    this.log(`📊 Report generated: ${reportPath}`);

    return report;
  }
}

// Execute the orchestrator
async function main() {
  console.log('🔥 COMPREHENSIVE CACHE DEBUG ORCHESTRATOR STARTED');
  console.log('💥 NUCLEAR CACHE CLEARING PROTOCOL ENGAGED');
  console.log('================================================');

  const orchestrator = new CacheOrchestrator();

  try {
    const results = await orchestrator.runFullCacheCycle();
    const report = await orchestrator.generateReport();

    console.log('\n================================================');
    console.log('🎯 CACHE DEBUG OPERATION COMPLETE');
    console.log(`✅ Caches cleared: ${results.cleared.length}`);
    console.log(`✅ Validations passed: ${results.validated.length}`);
    console.log(`✅ Rebuilds completed: ${results.rebuilt.length}`);
    console.log(`❌ Errors encountered: ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log('\n🔴 ERRORS ENCOUNTERED:');
      results.errors.forEach(error => {
        console.log(`  - ${error.description}: ${error.error}`);
      });
    }

    console.log('\n📊 Full report saved to: cache-debug-report.json');

  } catch (error) {
    console.error('💥 CRITICAL FAILURE:', error);
    process.exit(1);
  }
}

main().catch(console.error);