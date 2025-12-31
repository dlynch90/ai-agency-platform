#!/usr/bin/env node

/**
 * Comprehensive Codebase Audit
 * Audits codebase for vendor compliance, schema modeling, and architecture rules
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const WORKSPACE_ROOT = '/Users/daniellynch/Developer';
const AUDIT_RESULTS_FILE = path.join(WORKSPACE_ROOT, 'docs', 'comprehensive-audit-results.json');

// Vendor compliance rules
const VENDOR_RULES = {
  // Prohibited patterns (more specific)
  prohibited: {
    customReactComponents: /import.*React.*from.*react/i,
    customVueComponents: /<template>|<script setup>/,
    customAngularComponents: /@Component|@NgModule/,
    customStyling: /\.(css|scss|less|styl)$/,
    customWebpackConfigs: /webpack\.config\.(js|ts)/,
    customViteConfigs: /vite\.config\.(js|ts)/,
    hardcodedSecrets: /(password|secret|token|key).*=/i,
    consoleLogs: /console\.(log|error|warn|info)/,
    localhostUrls: /localhost|127\.0\.0\.1|0\.0\.0\.0/
  },

  // Required vendor solutions
  required: {
    auth: ['clerk', 'supabase-auth', 'firebase-auth'],
    database: ['postgresql', 'neo4j', 'supabase', 'mongodb'],
    ml: ['huggingface', 'transformers', 'torch', 'langchain'],
    orchestration: ['temporal', 'n8n', 'apache-kafka'],
    ai: ['openai', 'anthropic', 'ollama', 'claude'],
    monitoring: ['datadog', 'sentry', 'logfire'],
    secrets: ['1password', 'infisical', 'vault']
  },

  // Directory structure requirements
  directories: {
    docs: 'docs/',
    logs: 'logs/',
    testing: 'testing/',
    infra: 'infra/',
    data: 'data/',
    api: 'api/',
    graphql: 'graphql/',
    federation: 'federation/'
  }
};

// Audit categories
const AUDIT_CATEGORIES = {
  vendorCompliance: [],
  schemaModeling: [],
  pythonEnvironments: [],
  architectureRules: [],
  fileOrganization: [],
  dependencyManagement: [],
  securityCompliance: []
};

class CodebaseAuditor {
  constructor() {
    this.results = { ...AUDIT_CATEGORIES };
    this.stats = {
      filesScanned: 0,
      violationsFound: 0,
      complianceScore: 100
    };
  }

  async audit() {
    console.log('🔍 Starting comprehensive codebase audit...');

    try {
      await this.checkFileOrganization();
      await this.checkVendorCompliance();
      await this.checkSchemaModeling();
      await this.checkPythonEnvironments();
      await this.checkArchitectureRules();
      await this.checkDependencyManagement();
      await this.checkSecurityCompliance();

      this.calculateComplianceScore();
      await this.generateReport();

      console.log(`✅ Audit complete! Compliance score: ${this.stats.complianceScore}%`);
      console.log(`📊 Scanned ${this.stats.filesScanned} files, found ${this.stats.violationsFound} violations`);

    } catch (error) {
      console.error('❌ Audit failed:', error.message);
      this.results.errors = [error.message];
    }
  }

  async checkFileOrganization() {
    console.log('📁 Checking file organization...');

    const requiredDirs = Object.values(VENDOR_RULES.directories);
    const issues = [];

    for (const dir of requiredDirs) {
      const fullPath = path.join(WORKSPACE_ROOT, dir);
      if (!fs.existsSync(fullPath)) {
        issues.push({
          type: 'missing_directory',
          path: dir,
          severity: 'high',
          message: `Required directory ${dir} does not exist`
        });
      }
    }

    // Check for loose files in root
    const rootFiles = fs.readdirSync(WORKSPACE_ROOT)
      .filter(file => !file.startsWith('.') && !fs.statSync(path.join(WORKSPACE_ROOT, file)).isDirectory())
      .filter(file => !['pixi.toml', 'pixi.lock', 'package.json', 'tsconfig.json', 'turbo.json'].includes(file));

    if (rootFiles.length > 0) {
      issues.push({
        type: 'loose_files',
        files: rootFiles,
        severity: 'high',
        message: `Found ${rootFiles.length} loose files in workspace root: ${rootFiles.join(', ')}`
      });
    }

    this.results.fileOrganization = issues;
  }

  async checkVendorCompliance() {
    console.log('🏢 Checking vendor compliance...');

    const issues = [];
    const files = this.getAllSourceFiles();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(WORKSPACE_ROOT, file);

      // Check for prohibited patterns
      for (const [patternName, regex] of Object.entries(VENDOR_RULES.prohibited)) {
        if (regex.test(content)) {
          const severity = patternName.includes('Secret') ? 'critical' :
                          patternName.includes('localhost') ? 'high' : 'medium';
          issues.push({
            type: 'prohibited_pattern',
            file: relativePath,
            pattern: patternName,
            severity: severity,
            message: `File contains prohibited ${patternName} pattern`
          });
        }
      }

      // Check for missing vendor imports in key files
      if (relativePath.includes('auth') || relativePath.includes('login')) {
        if (!content.includes('clerk') && !content.includes('supabase') && !content.includes('@supabase')) {
          issues.push({
            type: 'missing_vendor_auth',
            file: relativePath,
            severity: 'high',
            message: 'Authentication file not using approved vendor (Clerk/Supabase)'
          });
        }
      }

      // Check for proper database usage
      if (relativePath.includes('db') || relativePath.includes('database') || relativePath.includes('schema')) {
        const hasVendorDb = content.includes('postgresql') || content.includes('neo4j') ||
                           content.includes('supabase') || content.includes('mongodb') ||
                           content.includes('@prisma') || content.includes('drizzle');
        if (!hasVendorDb) {
          issues.push({
            type: 'missing_vendor_database',
            file: relativePath,
            severity: 'high',
            message: 'Database file not using approved vendor adapters'
          });
        }
      }
    }

    this.results.vendorCompliance = issues;
  }

  async checkSchemaModeling() {
    console.log('📋 Checking schema modeling...');

    const issues = [];
    const schemaFiles = this.findFilesByPattern(/schema.*\.(js|ts|py|sql|graphql)$/i);

    for (const file of schemaFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(WORKSPACE_ROOT, file);

      // Check for hardcoded values
      if (content.includes('localhost') || content.includes('127.0.0.1') || content.includes('http://')) {
        issues.push({
          type: 'hardcoded_values',
          file: relativePath,
          severity: 'medium',
          message: 'Schema contains hardcoded connection values'
        });
      }

      // Check for proper vendor adapters
      if (!content.includes('postgresql') && !content.includes('neo4j') && !content.includes('supabase')) {
        issues.push({
          type: 'missing_vendor_adapter',
          file: relativePath,
          severity: 'high',
          message: 'Schema does not use approved vendor database adapters'
        });
      }
    }

    this.results.schemaModeling = issues;
  }

  async checkPythonEnvironments() {
    console.log('🐍 Checking Python environments...');

    const issues = [];

    // Check pixi.toml
    const pixiPath = path.join(WORKSPACE_ROOT, 'pixi.toml');
    if (fs.existsSync(pixiPath)) {
      const pixiContent = fs.readFileSync(pixiPath, 'utf8');

      // Check for proper ML packages
      if (!pixiContent.includes('torch') || !pixiContent.includes('transformers')) {
        issues.push({
          type: 'missing_ml_packages',
          file: 'pixi.toml',
          severity: 'high',
          message: 'PyTorch and Transformers not properly configured in pixi environment'
        });
      }

      // Check for proper BLAS libraries
      if (!pixiContent.includes('libblas') || !pixiContent.includes('liblapack')) {
        issues.push({
          type: 'missing_blas_libs',
          file: 'pixi.toml',
          severity: 'high',
          message: 'BLAS libraries not configured for numpy/PyTorch compatibility'
        });
      }
    } else {
      issues.push({
        type: 'missing_pixi_config',
        file: 'pixi.toml',
        severity: 'critical',
        message: 'pixi.toml configuration file missing'
      });
    }

    // Check for orphaned virtual environments
    const venvPaths = ['.venv', '.cursor/env', 'CascadeProjects/cascade-hooks-ml/venv'];
    for (const venvPath of venvPaths) {
      const fullPath = path.join(WORKSPACE_ROOT, venvPath);
      if (fs.existsSync(fullPath)) {
        issues.push({
          type: 'orphaned_venv',
          path: venvPath,
          severity: 'medium',
          message: `Orphaned virtual environment found: ${venvPath}`
        });
      }
    }

    this.results.pythonEnvironments = issues;
  }

  async checkArchitectureRules() {
    console.log('🏗️ Checking architecture rules...');

    const issues = [];
    const files = this.getAllSourceFiles();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(WORKSPACE_ROOT, file);

      // Check for microservices architecture
      if (relativePath.includes('apps/') || relativePath.includes('services/')) {
        if (!content.includes('export') && !content.includes('module.exports')) {
          issues.push({
            type: 'missing_exports',
            file: relativePath,
            severity: 'low',
            message: 'Service file should export functionality'
          });
        }
      }

      // Check for event-driven patterns
      if (!content.includes('EventEmitter') && !content.includes('on(') && !content.includes('emit(')) {
        // This is informational, not necessarily an issue
      }
    }

    this.results.architectureRules = issues;
  }

  async checkDependencyManagement() {
    console.log('📦 Checking dependency management...');

    const issues = [];

    // Check package.json
    const packagePath = path.join(WORKSPACE_ROOT, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      // Check for proper dependency management
      if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 50) {
        issues.push({
          type: 'too_many_dependencies',
          file: 'package.json',
          severity: 'medium',
          message: `Too many direct dependencies: ${Object.keys(packageJson.dependencies).length}`
        });
      }
    }

    // Check for lock files
    const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'pixi.lock'];
    const missingLocks = lockFiles.filter(file => !fs.existsSync(path.join(WORKSPACE_ROOT, file)));

    if (missingLocks.length > 0) {
      issues.push({
        type: 'missing_lock_files',
        files: missingLocks,
        severity: 'high',
        message: `Missing lock files: ${missingLocks.join(', ')}`
      });
    }

    this.results.dependencyManagement = issues;
  }

  async checkSecurityCompliance() {
    console.log('🔒 Checking security compliance...');

    const issues = [];
    const files = this.getAllSourceFiles();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(WORKSPACE_ROOT, file);

      // Check for hardcoded secrets
      if (content.includes('password') || content.includes('secret') || content.includes('token')) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if ((line.includes('password') || line.includes('secret') || line.includes('token')) &&
              !line.includes('op://') && !line.includes('1password') && !line.includes('process.env')) {
            issues.push({
              type: 'hardcoded_secret',
              file: relativePath,
              line: i + 1,
              severity: 'critical',
              message: `Potential hardcoded secret on line ${i + 1}`
            });
          }
        }
      }

      // Check for proper authentication
      if (relativePath.includes('auth') || relativePath.includes('login')) {
        if (!content.includes('clerk') && !content.includes('supabase')) {
          issues.push({
            type: 'non_vendor_auth',
            file: relativePath,
            severity: 'high',
            message: 'Authentication implementation not using approved vendors (Clerk/Supabase)'
          });
        }
      }
    }

    this.results.securityCompliance = issues;
  }

  getAllSourceFiles() {
    const files = [];
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.rs', '.go', '.sql', '.graphql'];

    // Directories to exclude from audit
    const excludeDirs = [
      'node_modules', '.git', '.pixi', 'target', 'dist', 'build',
      '.chezmoi', '.cursor', 'vendor-imports', 'packages', 'logs',
      'cache-debug-report.json', 'nuclear-cache-fix.js', 'final-cache-surgery.js'
    ];

    function scan(dir) {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);

        // Skip excluded directories and files
        if (excludeDirs.includes(item) || item.startsWith('.') || item.includes('backup')) {
          continue;
        }

        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }

    scan(WORKSPACE_ROOT);
    this.stats.filesScanned = files.length;
    return files;
  }

  findFilesByPattern(pattern) {
    const files = this.getAllSourceFiles();
    return files.filter(file => pattern.test(file));
  }

  calculateComplianceScore() {
    const allIssues = Object.values(this.results).flat();
    this.stats.violationsFound = allIssues.length;

    // Calculate score based on severity (more reasonable penalties)
    const weights = { critical: 5, high: 2, medium: 1, low: 0.5 };
    const totalPenalty = allIssues.reduce((sum, issue) => sum + weights[issue.severity] || 0, 0);

    // Cap penalty at 100 and ensure minimum score of 0
    this.stats.complianceScore = Math.max(0, Math.min(100, 100 - totalPenalty));
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      workspace: WORKSPACE_ROOT,
      stats: this.stats,
      results: this.results,
      recommendations: this.generateRecommendations()
    };

    // Ensure docs directory exists
    const docsDir = path.dirname(AUDIT_RESULTS_FILE);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    fs.writeFileSync(AUDIT_RESULTS_FILE, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to ${AUDIT_RESULTS_FILE}`);
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.results.vendorCompliance.length > 0) {
      recommendations.push({
        category: 'Vendor Compliance',
        priority: 'Critical',
        actions: [
          'Replace all custom implementations with vendor solutions',
          'Remove prohibited patterns and custom components',
          'Use only approved vendor libraries and SDKs'
        ]
      });
    }

    if (this.results.pythonEnvironments.length > 0) {
      recommendations.push({
        category: 'Python Environment',
        priority: 'High',
        actions: [
          'Clean up orphaned virtual environments',
          'Ensure pixi.toml has all required ML packages',
          'Configure BLAS libraries for numpy compatibility'
        ]
      });
    }

    if (this.results.securityCompliance.length > 0) {
      recommendations.push({
        category: 'Security',
        priority: 'Critical',
        actions: [
          'Replace hardcoded secrets with 1Password references',
          'Implement vendor authentication solutions',
          'Conduct security audit of all authentication flows'
        ]
      });
    }

    return recommendations;
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new CodebaseAuditor();
  auditor.audit().catch(console.error);
}

module.exports = CodebaseAuditor;