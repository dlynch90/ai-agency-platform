#!/usr/bin/env node

/**
 * Microservice Architecture Analyzer
 * Analyzes golden paths, endpoint mappings, and service dependencies
 */

const fs = require('fs');
const path = require('path');

class MicroserviceArchitectureAnalyzer {
  constructor() {
    this.workspaceRoot = '/Users/daniellynch/Developer';
    this.services = {};
    this.endpoints = {};
    this.dependencies = {};
    this.goldenPaths = {};
    this.architecture = {
      layers: {
        frontend: [],
        api: [],
        services: [],
        data: [],
        infrastructure: []
      },
      connections: [],
      goldenPaths: []
    };
  }

  async analyze() {
    console.log('🔍 Analyzing microservice architecture...');

    try {
      await this.discoverServices();
      await this.analyzeEndpoints();
      await this.mapDependencies();
      await this.identifyGoldenPaths();
      await this.generateArchitectureReport();

      console.log('✅ Microservice architecture analysis complete!');

    } catch (error) {
      console.error('❌ Architecture analysis failed:', error.message);
      this.architecture.error = error.message;
    }
  }

  async discoverServices() {
    console.log('🔎 Discovering services...');

    const serviceDirectories = [
      'apps',
      'api',
      'services',
      'federation',
      'graphql-server',
      'database',
      'infrastructure',
      'deployment'
    ];

    for (const dir of serviceDirectories) {
      const fullPath = path.join(this.workspaceRoot, dir);
      if (fs.existsSync(fullPath)) {
        const services = this.scanDirectoryForServices(fullPath, dir);
        this.services[dir] = services;
      }
    }

    // Categorize services by layer
    this.categorizeServices();
  }

  scanDirectoryForServices(dirPath, category) {
    const services = [];

    function scan(dir) {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Check if it's a service directory
          if (this.isServiceDirectory(fullPath)) {
            services.push({
              name: item,
              path: fullPath,
              category: category,
              type: this.detectServiceType(fullPath),
              config: this.readServiceConfig(fullPath)
            });
          } else {
            // Recurse into subdirectories
            scan(fullPath);
          }
        } else if (this.isServiceFile(item)) {
          services.push({
            name: item.replace(/\.(js|ts|py|java)$/, ''),
            path: fullPath,
            category: category,
            type: this.detectServiceTypeFromFile(fullPath),
            config: this.readServiceConfig(fullPath)
          });
        }
      }
    }

    scan.call(this, dirPath);
    return services;
  }

  isServiceDirectory(dirPath) {
    const indicators = ['package.json', 'pyproject.toml', 'Dockerfile', 'docker-compose.yml', 'server.js', 'app.py'];
    return indicators.some(file => fs.existsSync(path.join(dirPath, file)));
  }

  isServiceFile(filename) {
    const serviceExtensions = ['.js', '.ts', '.py', '.java', '.rs', '.go'];
    return serviceExtensions.some(ext => filename.endsWith(ext)) &&
           !filename.includes('test') &&
           !filename.includes('spec') &&
           !filename.includes('config');
  }

  detectServiceType(dirPath) {
    if (fs.existsSync(path.join(dirPath, 'package.json'))) {
      return 'nodejs';
    } else if (fs.existsSync(path.join(dirPath, 'pyproject.toml')) || fs.existsSync(path.join(dirPath, 'requirements.txt'))) {
      return 'python';
    } else if (fs.existsSync(path.join(dirPath, 'pom.xml'))) {
      return 'java';
    } else if (fs.existsSync(path.join(dirPath, 'go.mod'))) {
      return 'go';
    } else if (fs.existsSync(path.join(dirPath, 'Cargo.toml'))) {
      return 'rust';
    }
    return 'unknown';
  }

  detectServiceTypeFromFile(filePath) {
    const ext = path.extname(filePath);
    const extMap = {
      '.js': 'nodejs',
      '.ts': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.rs': 'rust',
      '.go': 'go'
    };
    return extMap[ext] || 'unknown';
  }

  readServiceConfig(dirPath) {
    const configFiles = ['package.json', 'pyproject.toml', 'Cargo.toml', 'pom.xml'];

    for (const configFile of configFiles) {
      const configPath = path.join(dirPath, configFile);
      if (fs.existsSync(configPath)) {
        try {
          const content = fs.readFileSync(configPath, 'utf8');
          if (configFile.endsWith('.json')) {
            return JSON.parse(content);
          }
          // For other formats, just mark as present
          return { type: configFile, present: true };
        } catch (error) {
          return { error: error.message };
        }
      }
    }

    return null;
  }

  categorizeServices() {
    // Categorize services by architectural layer
    Object.entries(this.services).forEach(([category, services]) => {
      services.forEach(service => {
        if (category === 'apps' || service.name.includes('frontend') || service.name.includes('ui')) {
          this.architecture.layers.frontend.push(service);
        } else if (category === 'api' || service.name.includes('api') || service.name.includes('gateway')) {
          this.architecture.layers.api.push(service);
        } else if (category === 'services' || service.name.includes('service')) {
          this.architecture.layers.services.push(service);
        } else if (category === 'database' || service.name.includes('db')) {
          this.architecture.layers.data.push(service);
        } else {
          this.architecture.layers.infrastructure.push(service);
        }
      });
    });
  }

  async analyzeEndpoints() {
    console.log('🔗 Analyzing endpoints...');

    // Analyze API endpoints
    const apiDirs = ['api', 'federation', 'graphql-server'];
    for (const dir of apiDirs) {
      const fullPath = path.join(this.workspaceRoot, dir);
      if (fs.existsSync(fullPath)) {
        const endpoints = this.extractEndpoints(fullPath);
        this.endpoints[dir] = endpoints;
      }
    }
  }

  extractEndpoints(dirPath) {
    const endpoints = [];

    function scan(dir) {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (item.endsWith('.js') || item.endsWith('.ts') || item.endsWith('.py')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const fileEndpoints = this.parseEndpointsFromFile(content, fullPath);
          endpoints.push(...fileEndpoints);
        }
      }
    }

    scan.call(this, dirPath);
    return endpoints;
  }

  parseEndpointsFromFile(content, filePath) {
    const endpoints = [];
    const lines = content.split('\n');

    // Patterns for different frameworks
    const patterns = [
      // Express.js/FastAPI routes
      /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      // GraphQL resolvers
      /resolvers?\s*\[\s*['"`]([^'"`]+)['"`]\s*\]/g,
      // Python FastAPI
      /@(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      // Java Spring
      /@(?:Get|Post|Put|Delete|Patch)Mapping\s*\(\s*['"`]([^'"`]+)['"`]/g
    ];

    lines.forEach((line, index) => {
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const method = match[1] || 'unknown';
          const path = match[2] || match[1];

          endpoints.push({
            method: method.toUpperCase(),
            path: path,
            file: filePath,
            line: index + 1,
            framework: this.detectFramework(filePath)
          });
        }
      });
    });

    return endpoints;
  }

  detectFramework(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('express') || content.includes('app.listen')) {
      return 'express';
    } else if (content.includes('fastapi') || content.includes('FastAPI')) {
      return 'fastapi';
    } else if (content.includes('@RestController') || content.includes('SpringBootApplication')) {
      return 'spring';
    } else if (content.includes('apollo') || content.includes('graphql')) {
      return 'graphql';
    }

    return 'unknown';
  }

  async mapDependencies() {
    console.log('🔗 Mapping dependencies...');

    // Analyze package.json, pyproject.toml, etc. for dependencies
    Object.values(this.services).flat().forEach(service => {
      if (service.config) {
        const deps = this.extractDependencies(service.config, service.type);
        this.dependencies[service.name] = deps;
      }
    });

    // Map service-to-service dependencies
    this.mapServiceDependencies();
  }

  extractDependencies(config, type) {
    const deps = { internal: [], external: [] };

    try {
      if (type === 'nodejs' && config.dependencies) {
        Object.keys(config.dependencies).forEach(dep => {
          if (this.isInternalService(dep)) {
            deps.internal.push(dep);
          } else {
            deps.external.push(dep);
          }
        });
      } else if (type === 'python' && config.tool && config.tool.poetry && config.tool.poetry.dependencies) {
        Object.keys(config.tool.poetry.dependencies).forEach(dep => {
          if (this.isInternalService(dep)) {
            deps.internal.push(dep);
          } else {
            deps.external.push(dep);
          }
        });
      }
    } catch (error) {
      // Ignore parsing errors
    }

    return deps;
  }

  isInternalService(name) {
    // Check if the dependency refers to another service in this workspace
    const allServiceNames = Object.values(this.services).flat().map(s => s.name);
    return allServiceNames.includes(name) || allServiceNames.some(sname => name.includes(sname));
  }

  mapServiceDependencies() {
    // Create connections between services based on dependencies and endpoints
    const connections = [];

    Object.entries(this.dependencies).forEach(([serviceName, deps]) => {
      deps.internal.forEach(internalDep => {
        connections.push({
          from: serviceName,
          to: internalDep,
          type: 'dependency'
        });
      });
    });

    // Add API connections
    Object.entries(this.endpoints).forEach(([apiName, endpoints]) => {
      endpoints.forEach(endpoint => {
        // Find services that might consume this endpoint
        Object.values(this.services).flat().forEach(service => {
          if (service.name !== apiName && this.serviceMightUseEndpoint(service, endpoint)) {
            connections.push({
              from: service.name,
              to: apiName,
              type: 'api_call',
              endpoint: endpoint
            });
          }
        });
      });
    });

    this.architecture.connections = connections;
  }

  serviceMightUseEndpoint(service, endpoint) {
    // Simple heuristic: check if service config mentions similar paths
    if (service.config && typeof service.config === 'object') {
      const configStr = JSON.stringify(service.config).toLowerCase();
      const endpointPath = endpoint.path.toLowerCase();

      // Check for similar path patterns
      return configStr.includes(endpointPath) ||
             endpointPath.split('/').some(segment =>
               configStr.includes(segment) && segment.length > 3
             );
    }
    return false;
  }

  async identifyGoldenPaths() {
    console.log('🏆 Identifying golden paths...');

    const goldenPaths = [];

    // User authentication flow
    const authPath = this.findPathThroughServices(['auth', 'login', 'clerk', 'supabase'], ['api', 'database']);
    if (authPath.length > 0) {
      goldenPaths.push({
        name: 'User Authentication',
        description: 'Complete user authentication and authorization flow',
        services: authPath,
        criticality: 'high'
      });
    }

    // API request flow
    const apiPath = this.findPathThroughServices(['api', 'gateway', 'federation'], ['database', 'redis', 'neo4j']);
    if (apiPath.length > 0) {
      goldenPaths.push({
        name: 'API Request Processing',
        description: 'End-to-end API request processing through gateway to data layer',
        services: apiPath,
        criticality: 'high'
      });
    }

    // ML inference flow
    const mlPath = this.findPathThroughServices(['inference', 'ml', 'ai'], ['transformers', 'torch', 'ollama']);
    if (mlPath.length > 0) {
      goldenPaths.push({
        name: 'ML Inference Pipeline',
        description: 'Machine learning model inference and processing pipeline',
        services: mlPath,
        criticality: 'medium'
      });
    }

    // Data processing flow
    const dataPath = this.findPathThroughServices(['database', 'postgres', 'neo4j'], ['api', 'services']);
    if (dataPath.length > 0) {
      goldenPaths.push({
        name: 'Data Processing',
        description: 'Data ingestion, processing, and serving pipeline',
        services: dataPath,
        criticality: 'high'
      });
    }

    this.architecture.goldenPaths = goldenPaths;
  }

  findPathThroughServices(startPatterns, endPatterns) {
    const path = [];

    // Find services matching start patterns
    const startServices = Object.values(this.services).flat()
      .filter(service =>
        startPatterns.some(pattern =>
          service.name.toLowerCase().includes(pattern.toLowerCase())
        )
      );

    // Find services matching end patterns
    const endServices = Object.values(this.services).flat()
      .filter(service =>
        endPatterns.some(pattern =>
          service.name.toLowerCase().includes(pattern.toLowerCase())
        )
      );

    if (startServices.length > 0 && endServices.length > 0) {
      path.push(...startServices.map(s => s.name));

      // Add intermediate services from connections
      const connectedServices = new Set();
      startServices.forEach(startService => {
        this.architecture.connections
          .filter(conn => conn.from === startService.name)
          .forEach(conn => connectedServices.add(conn.to));
      });

      path.push(...Array.from(connectedServices));

      // Add end services
      path.push(...endServices.map(s => s.name));
    }

    return [...new Set(path)]; // Remove duplicates
  }

  async generateArchitectureReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalServices: Object.values(this.services).flat().length,
        layers: Object.keys(this.architecture.layers).reduce((acc, layer) => {
          acc[layer] = this.architecture.layers[layer].length;
          return acc;
        }, {}),
        totalEndpoints: Object.values(this.endpoints).flat().length,
        totalConnections: this.architecture.connections.length,
        goldenPaths: this.architecture.goldenPaths.length
      },
      architecture: this.architecture,
      services: this.services,
      endpoints: this.endpoints,
      dependencies: this.dependencies
    };

    const reportPath = path.join(this.workspaceRoot, 'docs', 'microservice-architecture-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📄 Architecture report saved to ${reportPath}`);
    this.printArchitectureSummary();
  }

  printArchitectureSummary() {
    const summary = {
      totalServices: Object.values(this.services).flat().length,
      layers: Object.keys(this.architecture.layers).reduce((acc, layer) => {
        acc[layer] = this.architecture.layers[layer].length;
        return acc;
      }, {}),
      totalEndpoints: Object.values(this.endpoints).flat().length,
      totalConnections: this.architecture.connections.length,
      goldenPaths: this.architecture.goldenPaths.length
    };

    console.log('\n🏗️ Microservice Architecture Summary:');
    console.log(`Total Services: ${summary.totalServices}`);
    console.log(`Layers: ${JSON.stringify(summary.layers, null, 2)}`);
    console.log(`API Endpoints: ${summary.totalEndpoints}`);
    console.log(`Service Connections: ${summary.totalConnections}`);
    console.log(`Golden Paths: ${summary.goldenPaths}`);

    if (summary.goldenPaths > 0) {
      console.log('\n🏆 Critical Golden Paths:');
      this.architecture.goldenPaths.forEach(path => {
        console.log(`- ${path.name}: ${path.services.join(' → ')}`);
      });
    }
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new MicroserviceArchitectureAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = MicroserviceArchitectureAnalyzer;