#!/usr/bin/env node
/**
 * Complete Setup Script
 * Runs all setup components in proper order
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class CompleteSetup {
    constructor(rootPath = process.cwd()) {
        this.rootPath = rootPath;
        this.steps = [
            { name: 'Directory Organization', script: 'organize-monorepo.js' },
            { name: 'Vendor Package Setup', script: 'complete-vendor-setup.js' },
            { name: 'TDD Evaluation Loop', script: '../testing/tdd-evaluation-loop.js' }
        ];
    }

    log(message, data = null) {
        console.log(`[${new Date().toISOString()}] ${message}`);
        if (data) console.log(JSON.stringify(data, null, 2));
    }

    async runStep(step) {
        this.log(`🚀 Running: ${step.name}`);

        return new Promise((resolve, reject) => {
            const scriptPath = path.join(this.rootPath, 'scripts', step.script);

            if (!fs.existsSync(scriptPath)) {
                this.log(`⚠️  Script not found: ${scriptPath}`);
                resolve({ skipped: true, reason: 'script not found' });
                return;
            }

            try {
                const result = execSync(`node ${scriptPath}`, {
                    stdio: 'inherit',
                    cwd: this.rootPath
                });
                this.log(`✅ Completed: ${step.name}`);
                resolve({ success: true });
            } catch (error) {
                this.log(`❌ Failed: ${step.name} - ${error.message}`);
                resolve({ success: false, error: error.message });
            }
        });
    }

    async runKongReload() {
        this.log('🔄 Reloading Kong configuration...');

        try {
            // Copy Kong config to container
            execSync('docker cp infra/kong/kong.yml ai-agency-kong:/kong/declarative/kong.yml', {
                stdio: 'pipe',
                cwd: this.rootPath
            });

            // Reload Kong
            execSync('docker exec ai-agency-kong kong reload', {
                stdio: 'pipe',
                cwd: this.rootPath
            });

            this.log('✅ Kong configuration reloaded');
            return { success: true };
        } catch (error) {
            this.log(`❌ Kong reload failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async verifyServices() {
        this.log('🔍 Verifying service connectivity...');

        const services = [
            { name: 'Kong Proxy', url: 'http://localhost:8000/health', method: 'GET' },
            { name: 'Kong Admin', url: 'http://localhost:8001/services', method: 'GET' },
            { name: 'PostgreSQL', host: 'localhost', port: 5432 },
            { name: 'Redis', host: 'localhost', port: 6379 },
            { name: 'Neo4j', host: 'localhost', port: 7688 },
            { name: 'Temporal', url: 'http://localhost:7233/health', method: 'GET' },
            { name: 'Grafana', url: 'http://localhost:3000/api/health', method: 'GET' },
            { name: 'Prometheus', url: 'http://localhost:9090/-/healthy', method: 'GET' }
        ];

        const results = {};

        for (const service of services) {
            try {
                if (service.url) {
                    // HTTP check
                    const response = await this.checkHttpService(service);
                    results[service.name] = response ? 'CONNECTED' : 'FAILED';
                } else {
                    // TCP check
                    const connected = await this.checkTcpService(service.host, service.port);
                    results[service.name] = connected ? 'CONNECTED' : 'FAILED';
                }
            } catch (error) {
                results[service.name] = 'ERROR';
            }
        }

        const connectedCount = Object.values(results).filter(r => r === 'CONNECTED').length;
        this.log(`Service connectivity: ${connectedCount}/${services.length} services connected`);

        return results;
    }

    async checkHttpService(service) {
        return new Promise((resolve) => {
            const http = require('http');
            const url = new URL(service.url);

            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: service.method,
                timeout: 5000
            };

            const req = http.request(options, (res) => {
                resolve(res.statusCode < 400);
            });

            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });

            req.end();
        });
    }

    async checkTcpService(host, port) {
        return new Promise((resolve) => {
            const net = require('net');
            const client = net.createConnection({ host, port }, () => {
                client.end();
                resolve(true);
            });

            client.on('error', () => resolve(false));
            client.setTimeout(5000, () => {
                client.end();
                resolve(false);
            });
        });
    }

    generateFinalReport(results, serviceStatus) {
        const report = {
            timestamp: new Date().toISOString(),
            setup_results: results,
            service_status: serviceStatus,
            summary: {
                total_steps: this.steps.length,
                completed_steps: results.filter(r => r.success).length,
                failed_steps: results.filter(r => !r.success && !r.skipped).length,
                skipped_steps: results.filter(r => r.skipped).length,
                services_connected: Object.values(serviceStatus).filter(s => s === 'CONNECTED').length,
                total_services: Object.keys(serviceStatus).length
            },
            recommendations: this.generateRecommendations(results, serviceStatus)
        };

        const reportPath = path.join(this.rootPath, 'docs', 'complete-setup-report.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        return report;
    }

    generateRecommendations(results, serviceStatus) {
        const recommendations = [];

        // Check failed steps
        const failedSteps = results.filter(r => !r.success && !r.skipped);
        if (failedSteps.length > 0) {
            recommendations.push(`Fix failed setup steps: ${failedSteps.map(r => r.step).join(', ')}`);
        }

        // Check disconnected services
        const disconnectedServices = Object.entries(serviceStatus)
            .filter(([_, status]) => status !== 'CONNECTED')
            .map(([service, _]) => service);

        if (disconnectedServices.length > 0) {
            recommendations.push(`Start missing services: ${disconnectedServices.join(', ')}`);
        }

        // Kong specific recommendations
        if (serviceStatus['Kong Admin'] !== 'CONNECTED') {
            recommendations.push('Reload Kong configuration: docker cp infra/kong/kong.yml ai-agency-kong:/kong/declarative/kong.yml && docker exec ai-agency-kong kong reload');
        }

        return recommendations.length > 0 ? recommendations : ['All components successfully configured'];
    }

    async run() {
        this.log('🎯 Starting Complete Setup Process');
        this.log('=' .repeat(60));

        const results = [];

        // Run setup steps
        for (const step of this.steps) {
            const result = await this.runStep(step);
            results.push({ step: step.name, ...result });
        }

        // Reload Kong configuration
        const kongResult = await this.runKongReload();
        results.push({ step: 'Kong Configuration Reload', ...kongResult });

        // Verify services
        const serviceStatus = await this.verifyServices();
        results.push({ step: 'Service Verification', success: true, services: serviceStatus });

        // Generate final report
        const report = this.generateFinalReport(results, serviceStatus);

        // Display results
        this.log(`\n📊 COMPLETE SETUP RESULTS`);
        this.log('=' .repeat(60));
        this.log(`Setup Steps: ${report.summary.completed_steps}/${report.summary.total_steps} completed`);
        this.log(`Services Connected: ${report.summary.services_connected}/${report.summary.total_services}`);
        this.log(`Failed Steps: ${report.summary.failed_steps}`);
        this.log(`Skipped Steps: ${report.summary.skipped_steps}`);

        if (report.recommendations.length > 0) {
            this.log(`\n🎯 RECOMMENDATIONS:`);
            report.recommendations.forEach(rec => this.log(`  • ${rec}`));
        }

        this.log(`\n💾 Detailed report saved to: docs/complete-setup-report.json`);

        const success = report.summary.failed_steps === 0 &&
                       report.summary.services_connected >= report.summary.total_services * 0.8;

        this.log(`\n${success ? '✅' : '⚠️'} Setup ${success ? 'completed successfully' : 'has issues requiring attention'}`);

        return success;
    }
}

// Run the complete setup
if (require.main === module) {
    const setup = new CompleteSetup();
    setup.run()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Setup failed:', error);
            process.exit(1);
        });
}

module.exports = CompleteSetup;