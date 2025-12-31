#!/usr/bin/env node
/**
 * Complete Vendor Setup Script
 * Ensures all vendor packages are properly installed and configured
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class VendorSetupCompleter {
    constructor(rootPath = process.cwd()) {
        this.rootPath = rootPath;
        this.packageManagers = {
            npm: this.checkNPMPackages.bind(this),
            pip: this.checkPipPackages.bind(this),
            pixi: this.checkPixiPackages.bind(this)
        };
    }

    log(message, data = null) {
        console.log(`[${new Date().toISOString()}] ${message}`);
        if (data) console.log(JSON.stringify(data, null, 2));
    }

    checkCommand(command) {
        try {
            execSync(command, { stdio: 'pipe' });
            return true;
        } catch {
            return false;
        }
    }

    async checkNPMPackages() {
        this.log('📦 Checking NPM packages...');

        const requiredPackages = [
            // Core FastAPI/GraphQL
            'fastify', 'express', 'cors', 'helmet',
            // GraphQL
            '@apollo/server', 'graphql', 'graphql-tag',
            // Database
            'pg', 'redis', 'neo4j-driver',
            // ML/AI
            '@huggingface/inference', 'transformers',
            // Temporal
            '@temporalio/client', '@temporalio/worker',
            // Monitoring
            'prom-client', 'pino',
            // Testing
            'jest', 'supertest',
            // Utilities
            'dotenv', 'uuid', 'joi'
        ];

        const installed = [];
        const missing = [];

        for (const pkg of requiredPackages) {
            if (this.checkCommand(`npm list ${pkg} --depth=0`)) {
                installed.push(pkg);
            } else {
                missing.push(pkg);
            }
        }

        if (missing.length > 0) {
            this.log(`📥 Installing missing NPM packages: ${missing.join(', ')}`);
            try {
                execSync(`npm install ${missing.join(' ')}`, { stdio: 'inherit' });
                this.log(`✅ Installed ${missing.length} NPM packages`);
            } catch (error) {
                this.log(`❌ Failed to install NPM packages: ${error.message}`);
            }
        }

        return {
            installed: installed.length,
            missing: missing.length,
            total: requiredPackages.length
        };
    }

    async checkPipPackages() {
        this.log('🐍 Checking Python packages...');

        const requiredPackages = [
            // Core
            'fastapi', 'uvicorn', 'pydantic',
            // GraphQL
            'strawberry-graphql', 'ariadne',
            // Database
            'psycopg2-binary', 'redis', 'neo4j',
            // ML/AI
            'transformers', 'torch', 'scikit-learn',
            'optuna', 'mlflow', 'deepeval',
            // Temporal
            'temporalio',
            // Testing
            'pytest', 'hypothesis', 'faker',
            // Utilities
            'structlog', 'python-dotenv'
        ];

        const installed = [];
        const missing = [];

        for (const pkg of requiredPackages) {
            try {
                execSync(`python3 -c "import ${pkg.replace('-', '_')}"`, { stdio: 'pipe' });
                installed.push(pkg);
            } catch {
                missing.push(pkg);
            }
        }

        if (missing.length > 0) {
            this.log(`📥 Installing missing Python packages: ${missing.join(', ')}`);
            try {
                execSync(`pip3 install ${missing.join(' ')}`, { stdio: 'inherit' });
                this.log(`✅ Installed ${missing.length} Python packages`);
            } catch (error) {
                this.log(`❌ Failed to install Python packages: ${error.message}`);
            }
        }

        return {
            installed: installed.length,
            missing: missing.length,
            total: requiredPackages.length
        };
    }

    async checkPixiPackages() {
        this.log('🧊 Checking Pixi packages...');

        if (!this.checkCommand('pixi --version')) {
            this.log('⚠️  Pixi not installed, skipping...');
            return { installed: 0, missing: 0, total: 0 };
        }

        const pixiPackages = [
            'python', 'pip', 'numpy', 'pandas', 'matplotlib',
            'scikit-learn', 'torch', 'transformers', 'optuna'
        ];

        // Check pixi.toml for installed packages
        const pixiTomlPath = path.join(this.rootPath, 'pixi.toml');
        if (fs.existsSync(pixiTomlPath)) {
            const content = fs.readFileSync(pixiTomlPath, 'utf8');
            const installed = pixiPackages.filter(pkg =>
                content.includes(`"${pkg}"`) || content.includes(`${pkg} =`)
            );

            if (installed.length < pixiPackages.length) {
                this.log('📝 Updating pixi.toml with missing packages...');
                // This would require more complex TOML manipulation
                this.log('⚠️  Manual pixi.toml update required');
            }

            return {
                installed: installed.length,
                missing: pixiPackages.length - installed.length,
                total: pixiPackages.length
            };
        }

        return { installed: 0, missing: pixiPackages.length, total: pixiPackages.length };
    }

    async verifyImports() {
        this.log('🔍 Verifying package imports...');

        const testImports = {
            node: [
                { pkg: 'fastify', import: 'const fastify = require("fastify")' },
                { pkg: '@apollo/server', import: 'const { ApolloServer } = require("@apollo/server")' },
                { pkg: 'redis', import: 'const redis = require("redis")' },
                { pkg: '@temporalio/client', import: 'const { Client } = require("@temporalio/client")' }
            ],
            python: [
                { pkg: 'fastapi', import: 'from fastapi import FastAPI' },
                { pkg: 'strawberry', import: 'import strawberry' },
                { pkg: 'transformers', import: 'from transformers import pipeline' },
                { pkg: 'temporalio', import: 'import temporalio' }
            ]
        };

        const results = { node: 0, python: 0 };

        // Test Node.js imports
        for (const { pkg, import: importStmt } of testImports.node) {
            try {
                execSync(`node -e "${importStmt}; console.log('OK')"'`, { stdio: 'pipe' });
                results.node++;
            } catch {
                this.log(`❌ Node.js import failed: ${pkg}`);
            }
        }

        // Test Python imports
        for (const { pkg, import: importStmt } of testImports.python) {
            try {
                execSync(`python3 -c "${importStmt}; print('OK')"'`, { stdio: 'pipe' });
                results.python++;
            } catch {
                this.log(`❌ Python import failed: ${pkg}`);
            }
        }

        return results;
    }

    async runSetup() {
        this.log('🚀 Starting Complete Vendor Setup');
        this.log('=' .repeat(50));

        const results = {};

        // Check and install packages
        for (const [manager, checker] of Object.entries(this.packageManagers)) {
            try {
                results[manager] = await checker();
            } catch (error) {
                this.log(`❌ ${manager} check failed: ${error.message}`);
                results[manager] = { error: error.message };
            }
        }

        // Verify imports
        const importResults = await this.verifyImports();

        // Generate summary
        this.log(`\n📊 VENDOR SETUP COMPLETE`);
        this.log('=' .repeat(50));

        for (const [manager, result] of Object.entries(results)) {
            if (result.error) {
                this.log(`❌ ${manager}: Error - ${result.error}`);
            } else {
                const { installed, missing, total } = result;
                this.log(`${manager}: ${installed}/${total} packages (${missing} missing)`);
            }
        }

        this.log(`Node.js imports: ${importResults.node}/4 working`);
        this.log(`Python imports: ${importResults.python}/4 working`);

        // Generate report
        const report = {
            timestamp: new Date().toISOString(),
            package_managers: results,
            imports: importResults,
            recommendations: this.generateRecommendations(results, importResults)
        };

        const reportPath = path.join(this.rootPath, 'docs', 'vendor-setup-report.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        this.log(`\n💾 Vendor setup report saved to: ${reportPath}`);

        return this.isSetupComplete(results, importResults);
    }

    generateRecommendations(packageResults, importResults) {
        const recommendations = [];

        // Check package installation
        for (const [manager, result] of Object.entries(packageResults)) {
            if (result.missing > 0) {
                recommendations.push(`Install missing ${manager} packages: ${result.missing} packages missing`);
            }
        }

        // Check imports
        if (importResults.node < 4) {
            recommendations.push('Fix Node.js package imports - some packages not properly installed');
        }

        if (importResults.python < 4) {
            recommendations.push('Fix Python package imports - some packages not properly installed');
        }

        return recommendations.length > 0 ? recommendations : ['All vendor packages properly installed and importable'];
    }

    isSetupComplete(packageResults, importResults) {
        // Check if all packages are installed
        for (const result of Object.values(packageResults)) {
            if (result.missing > 0) return false;
        }

        // Check if imports work
        if (importResults.node < 4 || importResults.python < 4) return false;

        return true;
    }
}

// Run the setup completer
if (require.main === module) {
    const completer = new VendorSetupCompleter();
    completer.runSetup()
        .then(success => {
            console.log(`\n${success ? '✅' : '❌'} Vendor setup ${success ? 'completed successfully' : 'has issues'}`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Vendor setup failed:', error);
            process.exit(1);
        });
}

module.exports = VendorSetupCompleter;