#!/usr/bin/env node

/**
 * COMPREHENSIVE SYSTEM AUDIT - GOLDEN PATH ANALYSIS
 * Audit all integrations, schemas, environments, and golden paths
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class SystemAuditor {
  constructor() {
    this.auditResults = {
      mcp: {},
      pixi: {},
      docker: {},
      neo4j: {},
      network: {},
      schemas: {},
      goldenPaths: {},
      recommendations: []
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '🔴' : level === 'success' ? '✅' : level === 'warning' ? '⚠️' : '🔵';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async auditMCPIntegration() {
    this.log('🔍 AUDITING MCP INTEGRATION');

    try {
      // Check canonical config
      const canonicalConfig = path.join(process.env.HOME, '.canonical-mcp.json');
      if (fs.existsSync(canonicalConfig)) {
        const config = JSON.parse(fs.readFileSync(canonicalConfig, 'utf8'));
        this.auditResults.mcp.canonical = {
          exists: true,
          servers: Object.keys(config.mcpServers || {}).length,
          lastSync: config.lastSync,
          source: config.source
        };
        this.log(`Canonical MCP config: ${this.auditResults.mcp.canonical.servers} servers`, 'success');
      } else {
        this.auditResults.mcp.canonical = { exists: false };
        this.log('Canonical MCP config missing', 'error');
      }

      // Check Cursor settings
      const cursorSettings = path.join(process.env.HOME, 'Library/Application Support/Cursor/User/settings.json');
      if (fs.existsSync(cursorSettings)) {
        const settings = JSON.parse(fs.readFileSync(cursorSettings, 'utf8'));
        const mcpServers = settings.mcp?.servers || {};
        this.auditResults.mcp.cursor = {
          configured: true,
          servers: Object.keys(mcpServers).length,
          canonicalSource: settings.mcp?._canonicalSource,
          lastSync: settings.mcp?._lastSync,
          autoSync: settings.mcp?._autoSync
        };
        this.log(`Cursor MCP: ${this.auditResults.mcp.cursor.servers} servers configured`, 'success');
      }

      // Test MCP server connectivity
      this.auditResults.mcp.connectivity = await this.testMCPConnectivity();

    } catch (error) {
      this.log(`MCP audit failed: ${error.message}`, 'error');
    }
  }

  async testMCPConnectivity() {
    const tests = {
      npm: false,
      githubCli: false,
      servers: {}
    };

    // Test npm availability
    try {
      execSync('npm --version', { stdio: 'pipe' });
      tests.npm = true;
    } catch (e) {}

    // Test GitHub CLI
    try {
      execSync('gh auth status', { stdio: 'pipe' });
      tests.githubCli = true;
    } catch (e) {}

    return tests;
  }

  async auditPixiEnvironment() {
    this.log('🔍 AUDITING PIXI ENVIRONMENT');

    try {
      // Check pixi installation
      const pixiVersion = execSync('pixi --version', { encoding: 'utf8' }).trim();
      this.auditResults.pixi.version = pixiVersion;

      // Check pixi.toml
      const pixiToml = path.join(process.cwd(), 'pixi.toml');
      if (fs.existsSync(pixiToml)) {
        const content = fs.readFileSync(pixiToml, 'utf8');
        this.auditResults.pixi.config = {
          exists: true,
          environments: (content.match(/\[environments\./g) || []).length,
          features: (content.match(/\[feature\./g) || []).length,
          hasUseCaseCommon: content.includes('use-case-common')
        };
      }

      // Check environments
      const envInfo = execSync('pixi info --json', { encoding: 'utf8' });
      const envData = JSON.parse(envInfo);
      this.auditResults.pixi.environments = envData.environments || [];

      // Test ML packages
      this.auditResults.pixi.mlPackages = await this.testMLPackages();

      this.log(`Pixi environment: ${this.auditResults.pixi.environments.length} environments`, 'success');

    } catch (error) {
      this.log(`Pixi audit failed: ${error.message}`, 'error');
    }
  }

  async testMLPackages() {
    const packages = ['torch', 'torchvision', 'transformers', 'scikit-learn', 'optuna'];
    const results = {};

    for (const pkg of packages) {
      try {
        const output = execSync(`pixi run python -c "import ${pkg}; print(f'{pkg}: {getattr(${pkg}, '__version__', 'unknown')}')"`, {
          encoding: 'utf8',
          timeout: 5000
        });
        results[pkg] = { available: true, version: output.trim().split(': ')[1] };
      } catch (error) {
        results[pkg] = { available: false, error: error.message };
      }
    }

    return results;
  }

  async auditDockerNetwork() {
    this.log('🔍 AUDITING DOCKER NETWORK');

    try {
      // Check Docker availability
      const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
      this.auditResults.docker.version = dockerVersion;

      // Check running containers
      const containers = execSync('docker ps --format json', { encoding: 'utf8' });
      const containerList = containers.trim().split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
      this.auditResults.docker.containers = containerList.length;

      // Check networks
      const networks = execSync('docker network ls --format json', { encoding: 'utf8' });
      const networkList = networks.trim().split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
      this.auditResults.docker.networks = networkList.length;

      // Test inter-container connectivity
      this.auditResults.docker.connectivity = await this.testDockerConnectivity(containerList);

      this.log(`Docker network: ${containerList.length} containers, ${networkList.length} networks`, 'success');

    } catch (error) {
      this.log(`Docker audit failed: ${error.message}`, 'error');
    }
  }

  async testDockerConnectivity(containers) {
    const connectivity = {};

    for (const container of containers) {
      try {
        // Test basic connectivity
        const health = execSync(`docker exec ${container.ID} echo "healthy"`, {
          encoding: 'utf8',
          timeout: 3000
        }).trim();

        connectivity[container.Names?.[0] || container.ID] = {
          healthy: health === 'healthy',
          status: container.Status
        };
      } catch (error) {
        connectivity[container.Names?.[0] || container.ID] = {
          healthy: false,
          error: error.message
        };
      }
    }

    return connectivity;
  }

  async auditNeo4jIntegration() {
    this.log('🔍 AUDITING NEO4J INTEGRATION');

    try {
      // Check Neo4j container
      const neo4jStatus = execSync('docker ps --filter name=neo4j --format "{{.Status}}"', {
        encoding: 'utf8'
      }).trim();

      this.auditResults.neo4j.container = {
        running: neo4jStatus.includes('Up'),
        status: neo4jStatus
      };

      // Test Neo4j connectivity
      if (this.auditResults.neo4j.container.running) {
        try {
          const neo4jTest = execSync('docker exec neo4j cypher-shell -u neo4j -p password "MATCH () RETURN count(*) as nodes"', {
            encoding: 'utf8',
            timeout: 5000
          });
          this.auditResults.neo4j.connectivity = { connected: true, response: neo4jTest.trim() };
        } catch (error) {
          this.auditResults.neo4j.connectivity = { connected: false, error: error.message };
        }
      }

      this.log(`Neo4j integration: ${this.auditResults.neo4j.container.running ? 'connected' : 'disconnected'}`, 'success');

    } catch (error) {
      this.log(`Neo4j audit failed: ${error.message}`, 'error');
    }
  }

  async auditNetworkHealth() {
    this.log('🔍 AUDITING NETWORK HEALTH');

    const endpoints = [
      { name: 'GitHub API', url: 'https://api.github.com', critical: true },
      { name: 'Docker Hub', url: 'https://registry-1.docker.io', critical: true },
      { name: 'NPM Registry', url: 'https://registry.npmjs.org', critical: true },
      { name: 'PyPI', url: 'https://pypi.org', critical: true },
      { name: 'Ollama', url: 'http://localhost:11434', critical: false },
      { name: 'PostgreSQL', url: 'http://localhost:5432', critical: false },
      { name: 'Redis', url: 'http://localhost:6379', critical: false },
      { name: 'Neo4j', url: 'http://localhost:7474', critical: false },
      { name: 'Qdrant', url: 'http://localhost:6333', critical: false },
      { name: 'Kong API Gateway', url: 'http://localhost:8000', critical: false }
    ];

    const health = {};

    for (const endpoint of endpoints) {
      try {
        const result = execSync(`curl -s --max-time 5 -o /dev/null -w "%{http_code}" "${endpoint.url}"`, {
          encoding: 'utf8'
        });

        health[endpoint.name] = {
          url: endpoint.url,
          status: result.trim() === '200' ? 'healthy' : 'degraded',
          responseCode: result.trim(),
          critical: endpoint.critical
        };
      } catch (error) {
        health[endpoint.name] = {
          url: endpoint.url,
          status: 'unreachable',
          error: error.message,
          critical: endpoint.critical
        };
      }
    }

    this.auditResults.network.health = health;

    const healthyCount = Object.values(health).filter(h => h.status === 'healthy').length;
    const criticalHealthy = Object.values(health).filter(h => h.critical && h.status === 'healthy').length;
    const criticalTotal = Object.values(health).filter(h => h.critical).length;

    this.log(`Network health: ${healthyCount}/${Object.keys(health).length} endpoints healthy, ${criticalHealthy}/${criticalTotal} critical`, 'success');
  }

  async auditSchemaModeling() {
    this.log('🔍 AUDITING SCHEMA MODELING');

    const schemas = {
      graphql: [],
      protobuf: [],
      json: [],
      typescript: []
    };

    // Find schema files
    const findCmd = 'find . -name "*.graphql" -o -name "*.proto" -o -name "*.schema.json" -o -name "*.d.ts" | head -20';
    try {
      const schemaFiles = execSync(findCmd, { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(line => line.trim());

      for (const file of schemaFiles) {
        if (file.endsWith('.graphql')) schemas.graphql.push(file);
        else if (file.endsWith('.proto')) schemas.protobuf.push(file);
        else if (file.endsWith('.schema.json')) schemas.json.push(file);
        else if (file.endsWith('.d.ts')) schemas.typescript.push(file);
      }
    } catch (error) {}

    this.auditResults.schemas = {
      graphql: schemas.graphql.length,
      protobuf: schemas.protobuf.length,
      json: schemas.json.length,
      typescript: schemas.typescript.length,
      total: schemas.graphql.length + schemas.protobuf.length + schemas.json.length + schemas.typescript.length
    };

    this.log(`Schema modeling: ${this.auditResults.schemas.total} schema files found`, 'success');
  }

  async auditGoldenPaths() {
    this.log('🔍 AUDITING GOLDEN PATHS');

    const paths = {
      microservices: [],
      endpoints: [],
      integrations: [],
      pipelines: []
    };

    // Analyze microservice golden paths
    try {
      // Find service definitions
      const services = execSync('find . -name "docker-compose.yml" -o -name "docker-compose.yaml" | head -10', {
        encoding: 'utf8'
      }).trim().split('\n').filter(line => line.trim());

      paths.microservices = services.length;

      // Find API endpoints
      const endpoints = execSync('find . -name "*.py" -o -name "*.js" -o -name "*.ts" -o -name "*.go" -o -name "*.rs" | xargs grep -l "app\\.listen\\|app\\.run\\|serve\\|fastapi\\|gin\\|axum" | wc -l', {
        encoding: 'utf8'
      }).trim();

      paths.endpoints = parseInt(endpoints) || 0;

      // Find integration points
      const integrations = execSync('find . -name "*.py" -o -name "*.js" -o -name "*.ts" | xargs grep -l "redis\\|neo4j\\|postgresql\\|mongodb\\|kafka" | wc -l', {
        encoding: 'utf8'
      }).trim();

      paths.integrations = parseInt(integrations) || 0;

      // Find pipelines
      const pipelines = execSync('find . -name "*.yml" -o -name "*.yaml" | xargs grep -l "stages\\|jobs\\|workflow" | wc -l', {
        encoding: 'utf8'
      }).trim();

      paths.pipelines = parseInt(pipelines) || 0;

    } catch (error) {}

    this.auditResults.goldenPaths = paths;

    this.log(`Golden paths: ${paths.microservices} services, ${paths.endpoints} endpoints, ${paths.integrations} integrations`, 'success');
  }

  generateRecommendations() {
    this.auditResults.recommendations = [];

    // MCP recommendations
    if (!this.auditResults.mcp.canonical?.exists) {
      this.auditResults.recommendations.push({
        category: 'MCP',
        priority: 'critical',
        issue: 'Missing canonical MCP configuration',
        solution: 'Run canonical MCP synchronizer'
      });
    }

    if (this.auditResults.mcp.cursor?.servers < 10) {
      this.auditResults.recommendations.push({
        category: 'MCP',
        priority: 'high',
        issue: 'Insufficient MCP servers configured in Cursor',
        solution: 'Run MCP auto-sync to update from GitHub catalog'
      });
    }

    // Pixi recommendations
    const mlPackages = this.auditResults.pixi.mlPackages || {};
    const missingML = Object.values(mlPackages).filter(p => !p.available).length;
    if (missingML > 0) {
      this.auditResults.recommendations.push({
        category: 'Pixi',
        priority: 'high',
        issue: `${missingML} ML packages not available`,
        solution: 'Fix pixi environment configuration and install ML packages'
      });
    }

    // Docker recommendations
    if (this.auditResults.docker.containers < 5) {
      this.auditResults.recommendations.push({
        category: 'Docker',
        priority: 'medium',
        issue: 'Low number of running containers',
        solution: 'Start missing microservices and infrastructure'
      });
    }

    // Network recommendations
    const unhealthyNetworks = Object.values(this.auditResults.network.health || {})
      .filter(h => h.status !== 'healthy' && h.critical).length;
    if (unhealthyNetworks > 0) {
      this.auditResults.recommendations.push({
        category: 'Network',
        priority: 'critical',
        issue: `${unhealthyNetworks} critical network endpoints unhealthy`,
        solution: 'Fix network connectivity and start missing services'
      });
    }

    // Schema recommendations
    if (this.auditResults.schemas.total < 5) {
      this.auditResults.recommendations.push({
        category: 'Schema',
        priority: 'medium',
        issue: 'Limited schema modeling coverage',
        solution: 'Implement comprehensive GraphQL and Protobuf schemas'
      });
    }
  }

  async runComprehensiveAudit() {
    console.log('🔬 COMPREHENSIVE SYSTEM AUDIT - GOLDEN PATH ANALYSIS');
    console.log('====================================================');

    await this.auditMCPIntegration();
    await this.auditPixiEnvironment();
    await this.auditDockerNetwork();
    await this.auditNeo4jIntegration();
    await this.auditNetworkHealth();
    await this.auditSchemaModeling();
    await this.auditGoldenPaths();

    this.generateRecommendations();

    // Generate audit report
    const reportPath = path.join(process.cwd(), 'comprehensive-system-audit.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.auditResults, null, 2));

    console.log('\n====================================================');
    console.log('🎯 COMPREHENSIVE AUDIT COMPLETE');
    console.log(`✅ MCP: ${this.auditResults.mcp.cursor?.servers || 0} servers configured`);
    console.log(`✅ Pixi: ${Object.keys(this.auditResults.pixi.environments || {}).length} environments`);
    console.log(`✅ Docker: ${this.auditResults.docker.containers || 0} containers running`);
    console.log(`✅ Network: ${Object.values(this.auditResults.network.health || {}).filter(h => h.status === 'healthy').length} endpoints healthy`);
    console.log(`✅ Schemas: ${this.auditResults.schemas?.total || 0} schema files`);
    console.log(`✅ Golden Paths: ${this.auditResults.goldenPaths?.microservices || 0} microservices mapped`);

    console.log(`\n📊 Recommendations: ${this.auditResults.recommendations.length} items`);
    console.log(`📄 Full report: comprehensive-system-audit.json`);

    // Show critical recommendations
    const critical = this.auditResults.recommendations.filter(r => r.priority === 'critical');
    if (critical.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      critical.forEach(rec => console.log(`  - ${rec.category}: ${rec.issue}`));
    }

    return this.auditResults;
  }
}

// Run comprehensive audit
const auditor = new SystemAuditor();
auditor.runComprehensiveAudit();