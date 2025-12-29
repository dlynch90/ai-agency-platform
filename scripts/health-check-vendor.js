#!/usr/bin/env node

/**
 * Vendor-Only Health Check System
 * Uses Prometheus client, Redis, and vendor monitoring tools
 * No custom implementations - only vendor libraries
 */

import { register, collectDefaultMetrics, Gauge, Counter } from 'prom-client';
import { createClient } from 'redis';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Vendor metrics using prom-client
const healthStatus = new Gauge({
  name: 'ai_agency_health_status',
  help: 'Overall health status (1=healthy, 0=unhealthy)',
  labelNames: ['service', 'component']
});

const serviceUptime = new Gauge({
  name: 'ai_agency_service_uptime_seconds',
  help: 'Service uptime in seconds',
  labelNames: ['service']
});

const errorCount = new Counter({
  name: 'ai_agency_errors_total',
  help: 'Total number of errors',
  labelNames: ['service', 'type']
});

// Start collecting default metrics (CPU, memory, etc.)
collectDefaultMetrics({ prefix: 'ai_agency_' });

class VendorHealthChecker {
  constructor() {
    this.redis = createClient({ url: 'redis://localhost:6379' });
    this.services = [
      { name: 'ollama', check: this.checkOllama.bind(this) },
      { name: 'redis', check: this.checkRedis.bind(this) },
      { name: 'prometheus', check: this.checkPrometheus.bind(this) },
      { name: 'mcp-servers', check: this.checkMCPServers.bind(this) },
      { name: 'turborepo', check: this.checkTurborepo.bind(this) }
    ];
  }

  async checkOllama() {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      return response.ok ? { status: 'healthy', details: 'Ollama API responding' } : { status: 'unhealthy', details: 'Ollama API not responding' };
    } catch (error) {
      return { status: 'unhealthy', details: `Ollama check failed: ${error.message}` };
    }
  }

  async checkRedis() {
    try {
      await this.redis.ping();
      return { status: 'healthy', details: 'Redis responding' };
    } catch (error) {
      return { status: 'unhealthy', details: `Redis check failed: ${error.message}` };
    }
  }

  async checkPrometheus() {
    try {
      const response = await fetch('http://localhost:9090/-/ready');
      return response.ok ? { status: 'healthy', details: 'Prometheus ready' } : { status: 'unhealthy', details: 'Prometheus not ready' };
    } catch (error) {
      return { status: 'unhealthy', details: `Prometheus check failed: ${error.message}` };
    }
  }

  async checkMCPServers() {
    try {
      const mcpConfigPath = path.join(process.cwd(), '.cursor', 'mcp', 'servers.json');
      if (!fs.existsSync(mcpConfigPath)) {
        return { status: 'unhealthy', details: 'MCP config not found' };
      }

      const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
      const serverCount = Object.keys(config.mcpServers || {}).length;

      return { status: 'healthy', details: `${serverCount} MCP servers configured` };
    } catch (error) {
      return { status: 'unhealthy', details: `MCP check failed: ${error.message}` };
    }
  }

  async checkTurborepo() {
    try {
      await execAsync('pnpm turbo --version');
      return { status: 'healthy', details: 'Turborepo available' };
    } catch (error) {
      return { status: 'unhealthy', details: `Turborepo check failed: ${error.message}` };
    }
  }

  async runHealthChecks() {
    console.log('🔍 Running vendor-based health checks...\n');

    const results = {};

    for (const service of this.services) {
      console.log(`Checking ${service.name}...`);
      try {
        const result = await service.check();
        results[service.name] = result;

        // Update Prometheus metrics
        healthStatus.set({ service: service.name, component: 'overall' }, result.status === 'healthy' ? 1 : 0);

        if (result.status === 'healthy') {
          console.log(`✅ ${service.name}: ${result.details}`);
        } else {
          console.log(`❌ ${service.name}: ${result.details}`);
          errorCount.inc({ service: service.name, type: 'health_check' });
        }
      } catch (error) {
        results[service.name] = { status: 'error', details: error.message };
        console.log(`💥 ${service.name}: Health check error - ${error.message}`);
        healthStatus.set({ service: service.name, component: 'overall' }, 0);
        errorCount.inc({ service: service.name, type: 'exception' });
      }
    }

    return results;
  }

  async getMetrics() {
    return register.metrics();
  }

  async startMetricsServer(port = 9464) {
    const express = (await import('express')).default;
    const app = express();

    app.get('/metrics', async (req, res) => {
      res.set('Content-Type', register.contentType);
      res.end(await this.getMetrics());
    });

    app.get('/health', async (req, res) => {
      const results = await this.runHealthChecks();
      const allHealthy = Object.values(results).every(r => r.status === 'healthy');

      res.json({
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: results
      });
    });

    return new Promise((resolve) => {
      app.listen(port, () => {
        console.log(`📊 Health check server running on port ${port}`);
        resolve(app);
      });
    });
  }
}

// CLI usage
async function main() {
  const checker = new VendorHealthChecker();

  try {
    await checker.redis.connect();
  } catch (error) {
    console.warn('⚠️  Redis connection failed, continuing without Redis monitoring');
  }

  const args = process.argv.slice(2);

  if (args.includes('--server')) {
    await checker.startMetricsServer();
  } else {
    const results = await checker.runHealthChecks();

    const allHealthy = Object.values(results).every(r => r.status === 'healthy');
    console.log(`\n🏥 Overall Health: ${allHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);

    process.exit(allHealthy ? 0 : 1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { VendorHealthChecker };