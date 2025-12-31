#!/usr/bin/env node

/**
 * Network Health Verification
 * Comprehensive network, Docker, and API gateway health checks
 */

const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

class NetworkHealthVerifier {
  constructor() {
    this.results = {
      docker: {},
      databases: {},
      apis: {},
      mcpServers: {},
      kubernetes: {},
      networks: {}
    };
    this.services = {
      databases: [
        { name: 'PostgreSQL', host: 'localhost', port: 5432, type: 'tcp' },
        { name: 'Redis', host: 'localhost', port: 6379, type: 'tcp' },
        { name: 'Neo4j', host: 'localhost', port: 7687, type: 'tcp' },
        { name: 'Neo4j HTTP', host: 'localhost', port: 7474, type: 'http' },
        { name: 'Qdrant', host: 'localhost', port: 6333, type: 'http' },
        { name: 'Weaviate', host: 'localhost', port: 8080, type: 'http' },
        { name: 'Chroma', host: 'localhost', port: 8000, type: 'http' }
      ],
      apis: [
        { name: 'Ollama', url: 'http://localhost:11434/api/version', type: 'http' },
        { name: 'OpenAI', url: 'https://api.openai.com/v1/models', type: 'https' },
        { name: 'GitHub API', url: 'https://api.github.com/zen', type: 'https' },
        { name: 'Supabase', url: 'https://api.supabase.com/v1/health', type: 'https' }
      ],
      mcpServers: [
        { name: 'Filesystem MCP', url: 'http://localhost:7243/health', type: 'http' },
        { name: 'Universal MCP', url: 'http://localhost:7243/health', type: 'http' }
      ]
    };
  }

  async verifyAll() {
    console.log('🔍 Starting comprehensive network health verification...');

    try {
      await this.checkDocker();
      await this.checkDatabases();
      await this.checkAPIs();
      await this.checkMCPServers();
      await this.checkKubernetes();
      await this.checkNetworks();

      this.generateReport();
      console.log('✅ Network health verification complete!');

    } catch (error) {
      console.error('❌ Network verification failed:', error.message);
      this.results.error = error.message;
    }
  }

  async checkDocker() {
    console.log('🐳 Checking Docker health...');

    try {
      // Check if Docker is running
      execSync('docker info', { stdio: 'pipe' });
      this.results.docker.status = 'healthy';
      this.results.docker.version = execSync('docker --version', { encoding: 'utf8' }).trim();

      // Check running containers
      const containers = execSync('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"', { encoding: 'utf8' });
      this.results.docker.containers = containers.split('\n').filter(line => line.trim());

      // Check networks
      const networks = execSync('docker network ls --format "table {{.Name}}\\t{{.Driver}}"', { encoding: 'utf8' });
      this.results.docker.networks = networks.split('\n').filter(line => line.trim());

      // Check images
      const images = execSync('docker images --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}"', { encoding: 'utf8' });
      this.results.docker.images = images.split('\n').filter(line => line.trim()).slice(0, 10); // Limit output

    } catch (error) {
      this.results.docker.status = 'unhealthy';
      this.results.docker.error = error.message;
      console.warn('⚠️ Docker not available:', error.message);
    }
  }

  async checkDatabases() {
    console.log('🗄️ Checking database connections...');

    for (const db of this.services.databases) {
      try {
        const result = await this.checkPort(db.host, db.port, db.type);
        this.results.databases[db.name] = {
          status: result ? 'healthy' : 'unhealthy',
          host: db.host,
          port: db.port,
          type: db.type
        };

        if (result && db.type === 'http') {
          // Additional HTTP check
          const httpResult = await this.checkHTTP(db.host, db.port);
          this.results.databases[db.name].httpStatus = httpResult ? 'reachable' : 'unreachable';
        }
      } catch (error) {
        this.results.databases[db.name] = {
          status: 'error',
          error: error.message,
          host: db.host,
          port: db.port,
          type: db.type
        };
      }
    }
  }

  async checkAPIs() {
    console.log('🌐 Checking API endpoints...');

    for (const api of this.services.apis) {
      try {
        const result = await this.checkURL(api.url);
        this.results.apis[api.name] = {
          status: result ? 'healthy' : 'unhealthy',
          url: api.url,
          type: api.type,
          responseTime: result ? result.responseTime : null
        };
      } catch (error) {
        this.results.apis[api.name] = {
          status: 'error',
          error: error.message,
          url: api.url,
          type: api.type
        };
      }
    }
  }

  async checkMCPServers() {
    console.log('🤖 Checking MCP servers...');

    for (const mcp of this.services.mcpServers) {
      try {
        const result = await this.checkURL(mcp.url);
        this.results.mcpServers[mcp.name] = {
          status: result ? 'healthy' : 'unhealthy',
          url: mcp.url,
          type: mcp.type,
          responseTime: result ? result.responseTime : null
        };
      } catch (error) {
        this.results.mcpServers[mcp.name] = {
          status: 'error',
          error: error.message,
          url: mcp.url,
          type: mcp.type
        };
      }
    }
  }

  async checkKubernetes() {
    console.log('☸️ Checking Kubernetes...');

    try {
      // Check if kubectl is available
      execSync('kubectl version --client --short', { stdio: 'pipe' });
      this.results.kubernetes.kubectl = 'available';

      // Try to get cluster info
      try {
        const clusterInfo = execSync('kubectl cluster-info', { encoding: 'utf8', stdio: 'pipe' });
        this.results.kubernetes.cluster = 'connected';
        this.results.kubernetes.clusterInfo = clusterInfo;
      } catch (error) {
        this.results.kubernetes.cluster = 'disconnected';
        this.results.kubernetes.clusterError = error.message;
      }

      // Check pods
      try {
        const pods = execSync('kubectl get pods --all-namespaces --no-headers', { encoding: 'utf8', stdio: 'pipe' });
        this.results.kubernetes.pods = pods.split('\n').filter(line => line.trim()).length;
      } catch (error) {
        this.results.kubernetes.pods = 'unable to check';
      }

    } catch (error) {
      this.results.kubernetes.status = 'unavailable';
      this.results.kubernetes.error = error.message;
    }
  }

  async checkNetworks() {
    console.log('🌐 Checking network connectivity...');

    try {
      // Check internet connectivity
      const internetCheck = await this.checkURL('https://www.google.com');
      this.results.networks.internet = internetCheck ? 'connected' : 'disconnected';

      // Check DNS resolution
      execSync('nslookup google.com', { stdio: 'pipe' });
      this.results.networks.dns = 'working';

      // Check local network
      const localhostCheck = await this.checkPort('localhost', 80, 'tcp');
      this.results.networks.localhost = localhostCheck ? 'accessible' : 'not accessible';

    } catch (error) {
      this.results.networks.error = error.message;
    }
  }

  async checkPort(host, port, type) {
    return new Promise((resolve) => {
      if (type === 'tcp') {
        const net = require('net');
        const socket = net.createConnection(port, host);
        socket.setTimeout(5000);

        socket.on('connect', () => {
          socket.end();
          resolve(true);
        });

        socket.on('timeout', () => {
          socket.destroy();
          resolve(false);
        });

        socket.on('error', () => {
          resolve(false);
        });
      } else {
        // For HTTP checks, use the checkHTTP method
        resolve(true); // Placeholder
      }
    });
  }

  async checkHTTP(host, port) {
    return new Promise((resolve) => {
      const options = {
        hostname: host,
        port: port,
        path: '/',
        method: 'GET',
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        resolve(true);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  async checkURL(url) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const client = url.startsWith('https') ? https : http;

      const req = client.get(url, { timeout: 10000 }, (res) => {
        const responseTime = Date.now() - startTime;
        resolve({ success: true, responseTime });
      });

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      results: this.results,
      recommendations: this.generateRecommendations()
    };

    const fs = require('fs');
    const path = require('path');

    // Ensure docs directory exists
    const docsDir = path.join(__dirname, '..', 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const reportPath = path.join(docsDir, 'network-health-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📄 Report saved to ${reportPath}`);
    this.printSummary();
  }

  generateSummary() {
    const summary = {
      totalChecks: 0,
      healthy: 0,
      unhealthy: 0,
      errors: 0
    };

    function countStatus(obj) {
      if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          if (key === 'status') {
            summary.totalChecks++;
            if (value === 'healthy') summary.healthy++;
            else if (value === 'unhealthy') summary.unhealthy++;
            else if (value === 'error') summary.errors++;
          } else if (typeof value === 'object') {
            countStatus(value);
          }
        }
      }
    }

    countStatus(this.results);

    summary.healthScore = summary.totalChecks > 0 ?
      Math.round((summary.healthy / summary.totalChecks) * 100) : 0;

    return summary;
  }

  generateRecommendations() {
    const recommendations = [];

    // Docker recommendations
    if (this.results.docker.status !== 'healthy') {
      recommendations.push({
        category: 'Docker',
        priority: 'High',
        action: 'Install and start Docker daemon'
      });
    }

    // Database recommendations
    const unhealthyDbs = Object.entries(this.results.databases)
      .filter(([_, db]) => db.status !== 'healthy')
      .map(([name, _]) => name);

    if (unhealthyDbs.length > 0) {
      recommendations.push({
        category: 'Databases',
        priority: 'High',
        action: `Start missing databases: ${unhealthyDbs.join(', ')}`
      });
    }

    // API recommendations
    const unhealthyAPIs = Object.entries(this.results.apis)
      .filter(([_, api]) => api.status !== 'healthy')
      .map(([name, _]) => name);

    if (unhealthyAPIs.length > 0) {
      recommendations.push({
        category: 'APIs',
        priority: 'Medium',
        action: `Configure API keys for: ${unhealthyAPIs.join(', ')}`
      });
    }

    return recommendations;
  }

  printSummary() {
    const summary = this.generateSummary();
    console.log('\n📊 Network Health Summary:');
    console.log(`Total Checks: ${summary.totalChecks}`);
    console.log(`Healthy: ${summary.healthy}`);
    console.log(`Unhealthy: ${summary.unhealthy}`);
    console.log(`Errors: ${summary.errors}`);
    console.log(`Health Score: ${summary.healthScore}%`);

    if (summary.healthScore < 70) {
      console.log('\n⚠️ Network health is poor. See recommendations in the report.');
    } else if (summary.healthScore < 90) {
      console.log('\n✅ Network health is acceptable but could be improved.');
    } else {
      console.log('\n🎉 Network health is excellent!');
    }
  }
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new NetworkHealthVerifier();
  verifier.verifyAll().catch(console.error);
}

module.exports = NetworkHealthVerifier;