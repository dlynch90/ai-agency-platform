#!/usr/bin/env node

/**
 * Detailed Network Debugging
 * Comprehensive network connectivity and service health analysis
 */

const { execSync } = require('child_process');
const https = require('https');
const http = require('http');
const net = require('net');

class NetworkDebugger {
  constructor() {
    this.results = {};
    this.issues = [];
    this.recommendations = [];
  }

  async debugAll() {
    console.log('🔍 Starting detailed network debugging...');

    try {
      await this.debugDockerNetworks();
      await this.debugServiceConnectivity();
      await this.debugInterContainerCommunication();
      await this.debugExternalConnectivity();
      await this.debugPortConflicts();
      await this.debugDNSResolution();
      await this.debugLoadBalancing();

      this.analyzeIssues();
      this.generateReport();

      console.log('✅ Detailed network debugging complete!');
      this.printSummary();

    } catch (error) {
      console.error('❌ Network debugging failed:', error.message);
      this.results.error = error.message;
    }
  }

  async debugDockerNetworks() {
    console.log('🐳 Debugging Docker networks...');

    try {
      // Get network details
      const networks = execSync('docker network ls --format json', { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      this.results.networks = {};

      for (const network of networks) {
        const inspect = execSync(`docker network inspect ${network.Name}`, { encoding: 'utf8' });
        const networkDetails = JSON.parse(inspect)[0];

        this.results.networks[network.Name] = {
          name: network.Name,
          driver: network.Driver,
          scope: network.Scope,
          containers: Object.keys(networkDetails.Containers || {}),
          subnets: networkDetails.IPAM?.Config || [],
          options: networkDetails.Options || {}
        };

        // Check for isolated networks
        if (networkDetails.Containers && Object.keys(networkDetails.Containers).length === 0) {
          this.issues.push({
            type: 'isolated_network',
            network: network.Name,
            severity: 'low',
            message: `Network ${network.Name} has no connected containers`
          });
        }
      }

      // Check network connectivity between containers
      const containers = execSync('docker ps --format "{{.Names}}:{{.Networks}}"', { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.trim());

      for (const container of containers) {
        const [name, networks] = container.split(':');
        if (!networks || networks === '<no value>') {
          this.issues.push({
            type: 'container_no_network',
            container: name,
            severity: 'medium',
            message: `Container ${name} is not connected to any network`
          });
        }
      }

    } catch (error) {
      this.results.networks = { error: error.message };
    }
  }

  async debugServiceConnectivity() {
    console.log('🔗 Debugging service connectivity...');

    const services = [
      { name: 'PostgreSQL', host: 'localhost', port: 5432, protocol: 'tcp' },
      { name: 'Redis', host: 'localhost', port: 6379, protocol: 'tcp' },
      { name: 'Neo4j Bolt', host: 'localhost', port: 7687, protocol: 'tcp' },
      { name: 'Neo4j HTTP', host: 'localhost', port: 7474, protocol: 'http' },
      { name: 'Qdrant', host: 'localhost', port: 6333, protocol: 'http' },
      { name: 'Temporal gRPC', host: 'localhost', port: 7233, protocol: 'tcp' },
      { name: 'Temporal HTTP', host: 'localhost', port: 7239, protocol: 'http' },
      { name: 'Kong Gateway', host: 'localhost', port: 8000, protocol: 'http' },
      { name: 'Kong Admin', host: 'localhost', port: 8001, protocol: 'http' },
      { name: 'Traefik HTTP', host: 'localhost', port: 19080, protocol: 'http' },
      { name: 'Traefik HTTPS', host: 'localhost', port: 19443, protocol: 'https' },
      { name: 'Grafana', host: 'localhost', port: 3000, protocol: 'http' },
      { name: 'Jupyter', host: 'localhost', port: 8888, protocol: 'http' },
      { name: 'PyTorch Mem0', host: 'localhost', port: 3002, protocol: 'http' },
      { name: 'Nest API', host: 'localhost', port: 3003, protocol: 'http' },
      { name: 'Vendor Orchestrator', host: 'localhost', port: 3333, protocol: 'http' }
    ];

    this.results.services = {};

    for (const service of services) {
      try {
        let result;
        if (service.protocol === 'tcp') {
          result = await this.testTcpConnection(service.host, service.port);
        } else {
          result = await this.testHttpConnection(service.host, service.port, service.protocol === 'https');
        }

        this.results.services[service.name] = {
          ...service,
          status: result.success ? 'reachable' : 'unreachable',
          responseTime: result.responseTime,
          error: result.error
        };

        if (!result.success) {
          this.issues.push({
            type: 'service_unreachable',
            service: service.name,
            port: service.port,
            severity: 'high',
            message: `${service.name} on port ${service.port} is unreachable`
          });
        }

      } catch (error) {
        this.results.services[service.name] = {
          ...service,
          status: 'error',
          error: error.message
        };

        this.issues.push({
          type: 'service_error',
          service: service.name,
          severity: 'high',
          message: `Error testing ${service.name}: ${error.message}`
        });
      }
    }
  }

  async debugInterContainerCommunication() {
    console.log('📦 Debugging inter-container communication...');

    try {
      // Test container-to-container communication
      const containers = execSync('docker ps --format "{{.Names}}:{{.Ports}}"', { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.trim());

      this.results.interContainer = {};

      // Test communication from one container to another
      for (const container of containers.slice(0, 3)) { // Test first 3 containers
        const [name] = container.split(':');
        this.results.interContainer[name] = {};

        try {
          // Test DNS resolution within Docker network
          const dnsTest = execSync(`docker exec ${name} nslookup postgres 2>/dev/null || echo "DNS_FAIL"`, { encoding: 'utf8' });
          this.results.interContainer[name].dnsResolution = !dnsTest.includes('DNS_FAIL');

          // Test network connectivity to other services
          const pingTest = execSync(`docker exec ${name} ping -c 1 -W 2 postgres 2>/dev/null || echo "PING_FAIL"`, { encoding: 'utf8' });
          this.results.interContainer[name].networkConnectivity = !pingTest.includes('PING_FAIL');

        } catch (error) {
          this.results.interContainer[name].error = error.message;
        }
      }

    } catch (error) {
      this.results.interContainer = { error: error.message };
    }
  }

  async debugExternalConnectivity() {
    console.log('🌐 Debugging external connectivity...');

    const externalServices = [
      { name: 'GitHub API', url: 'https://api.github.com/zen' },
      { name: 'OpenAI API', url: 'https://api.openai.com/v1/models' },
      { name: 'Supabase API', url: 'https://api.supabase.com/v1/health' },
      { name: 'HuggingFace Hub', url: 'https://huggingface.co/api/whoami' },
      { name: 'PyPI', url: 'https://pypi.org/' },
      { name: 'NPM Registry', url: 'https://registry.npmjs.org/' }
    ];

    this.results.external = {};

    for (const service of externalServices) {
      try {
        const result = await this.testHttpConnection(service.url.replace('https://', '').replace('http://', ''), 443, service.url.startsWith('https'));
        this.results.external[service.name] = {
          url: service.url,
          status: result.success ? 'reachable' : 'unreachable',
          responseTime: result.responseTime,
          error: result.error
        };

        if (!result.success) {
          this.issues.push({
            type: 'external_service_unreachable',
            service: service.name,
            severity: 'medium',
            message: `External service ${service.name} is unreachable`
          });
        }

      } catch (error) {
        this.results.external[service.name] = {
          url: service.url,
          status: 'error',
          error: error.message
        };
      }
    }
  }

  async debugPortConflicts() {
    console.log('🔌 Debugging port conflicts...');

    try {
      // Get all listening ports
      const netstat = execSync('netstat -tulpn 2>/dev/null || ss -tulpn 2>/dev/null || echo "NETSTAT_UNAVAILABLE"', { encoding: 'utf8' });

      if (netstat === 'NETSTAT_UNAVAILABLE') {
        this.results.ports = { status: 'netstat_unavailable' };
        return;
      }

      // Parse listening ports
      const lines = netstat.split('\n').filter(line => line.includes('LISTEN'));
      const ports = {};

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          const address = parts[3];
          const portMatch = address.match(/:(\d+)$/);
          if (portMatch) {
            const port = portMatch[1];
            if (ports[port]) {
              this.issues.push({
                type: 'port_conflict',
                port: port,
                severity: 'critical',
                message: `Port ${port} is being used by multiple services`
              });
            }
            ports[port] = (ports[port] || 0) + 1;
          }
        }
      }

      this.results.ports = { listeningPorts: Object.keys(ports).length, conflicts: Object.entries(ports).filter(([_, count]) => count > 1) };

    } catch (error) {
      this.results.ports = { error: error.message };
    }
  }

  async debugDNSResolution() {
    console.log('📡 Debugging DNS resolution...');

    const domains = [
      'github.com',
      'api.github.com',
      'pypi.org',
      'registry.npmjs.org',
      'huggingface.co',
      'api.supabase.com',
      'api.openai.com'
    ];

    this.results.dns = {};

    for (const domain of domains) {
      try {
        const startTime = Date.now();
        const addresses = await this.resolveDNS(domain);
        const resolveTime = Date.now() - startTime;

        this.results.dns[domain] = {
          status: addresses.length > 0 ? 'resolved' : 'failed',
          addresses: addresses.slice(0, 3), // Limit output
          resolveTime
        };

        if (addresses.length === 0) {
          this.issues.push({
            type: 'dns_resolution_failed',
            domain: domain,
            severity: 'high',
            message: `DNS resolution failed for ${domain}`
          });
        }

      } catch (error) {
        this.results.dns[domain] = {
          status: 'error',
          error: error.message
        };

        this.issues.push({
          type: 'dns_error',
          domain: domain,
          severity: 'high',
          message: `DNS error for ${domain}: ${error.message}`
        });
      }
    }
  }

  async debugLoadBalancing() {
    console.log('⚖️ Debugging load balancing...');

    try {
      // Check Traefik configuration
      const traefikContainers = execSync('docker ps --filter name=traefik --format "{{.Names}}"', { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.trim());

      if (traefikContainers.length > 0) {
        this.results.loadBalancing = { traefik: 'running' };

        // Test Traefik dashboard
        const dashboardTest = await this.testHttpConnection('localhost', 19090, false);
        this.results.loadBalancing.traefikDashboard = dashboardTest.success ? 'accessible' : 'inaccessible';

        // Check Kong configuration
        const kongContainers = execSync('docker ps --filter name=kong --format "{{.Names}}"', { encoding: 'utf8' })
          .split('\n')
          .filter(line => line.trim());

        if (kongContainers.length > 0) {
          this.results.loadBalancing.kong = 'running';

          // Test Kong admin API
          const kongAdminTest = await this.testHttpConnection('localhost', 8001, false);
          this.results.loadBalancing.kongAdmin = kongAdminTest.success ? 'accessible' : 'inaccessible';
        }

      } else {
        this.results.loadBalancing = { status: 'no_load_balancer' };
        this.issues.push({
          type: 'no_load_balancer',
          severity: 'medium',
          message: 'No load balancer (Traefik/Kong) detected'
        });
      }

    } catch (error) {
      this.results.loadBalancing = { error: error.message };
    }
  }

  async testTcpConnection(host, port) {
    return new Promise((resolve) => {
      const socket = net.createConnection(port, host);
      const startTime = Date.now();

      socket.setTimeout(5000);

      socket.on('connect', () => {
        const responseTime = Date.now() - startTime;
        socket.end();
        resolve({ success: true, responseTime });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({ success: false, error: 'Connection timeout' });
      });

      socket.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });
    });
  }

  async testHttpConnection(host, port, useHttps = false) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const options = {
        hostname: host.replace(/^https?:\/\//, ''),
        port: port,
        path: '/',
        method: 'GET',
        timeout: 10000,
        rejectUnauthorized: false // Allow self-signed certificates
      };

      const req = (useHttps ? https : http).request(options, (res) => {
        const responseTime = Date.now() - startTime;
        resolve({ success: true, responseTime, statusCode: res.statusCode });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Request timeout' });
      });

      req.end();
    });
  }

  async resolveDNS(domain) {
    return new Promise((resolve) => {
      const dns = require('dns');
      dns.resolve4(domain, (error, addresses) => {
        if (error) {
          resolve([]);
        } else {
          resolve(addresses);
        }
      });
    });
  }

  analyzeIssues() {
    console.log('🔍 Analyzing network issues...');

    // Categorize issues by severity
    const critical = this.issues.filter(i => i.severity === 'critical');
    const high = this.issues.filter(i => i.severity === 'high');
    const medium = this.issues.filter(i => i.severity === 'medium');
    const low = this.issues.filter(i => i.severity === 'low');

    this.analysis = {
      totalIssues: this.issues.length,
      critical,
      high,
      medium,
      low
    };

    // Generate recommendations
    if (critical.length > 0) {
      this.recommendations.push({
        priority: 'Critical',
        action: 'Fix critical network issues immediately',
        issues: critical.map(i => i.message)
      });
    }

    if (high.length > 0) {
      this.recommendations.push({
        priority: 'High',
        action: 'Address high-priority network issues',
        issues: high.map(i => i.message)
      });
    }

    // Network optimization recommendations
    if (this.results.networks && Object.keys(this.results.networks).length > 10) {
      this.recommendations.push({
        priority: 'Medium',
        action: 'Consider consolidating Docker networks',
        issues: ['Multiple isolated networks detected']
      });
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      analysis: this.analysis,
      results: this.results,
      issues: this.issues,
      recommendations: this.recommendations
    };

    const fs = require('fs');
    const path = require('path');

    // Ensure docs directory exists
    const docsDir = path.join(__dirname, '..', 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const reportPath = path.join(docsDir, 'detailed-network-debug-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📄 Detailed report saved to ${reportPath}`);
  }

  printSummary() {
    console.log('\n📊 Detailed Network Debug Summary:');
    console.log(`Total Issues Found: ${this.analysis.totalIssues}`);
    console.log(`Critical: ${this.analysis.critical.length}`);
    console.log(`High: ${this.analysis.high.length}`);
    console.log(`Medium: ${this.analysis.medium.length}`);
    console.log(`Low: ${this.analysis.low.length}`);

    if (this.analysis.totalIssues === 0) {
      console.log('\n🎉 Network is in excellent condition!');
    } else {
      console.log('\n⚠️ Network issues detected. See detailed report for recommendations.');
      console.log('\nTop Recommendations:');
      this.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`${i + 1}. ${rec.priority}: ${rec.action}`);
      });
    }
  }
}

// Run debug if called directly
if (require.main === module) {
  const networkDebugger = new NetworkDebugger();
  networkDebugger.debugAll().catch(console.error);
}

module.exports = NetworkDebugger;