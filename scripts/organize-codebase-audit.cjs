#!/usr/bin/env node

/**
 * CODEBASE ORGANIZATION AUDIT & GOVERNANCE
 * Audit loose files, enforce monorepo architecture, replace custom code with vendor solutions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CodebaseOrganizer {
  constructor() {
    this.results = {
      looseFiles: [],
      directoryViolations: [],
      customCode: [],
      vendorCompliance: [],
      governance: []
    };
    this.SERVER_ENDPOINT = 'http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab';
  }

  log(hypothesisId, message, data = {}) {
    const logEntry = {
      sessionId: 'organization-audit',
      runId: 'comprehensive-audit',
      hypothesisId,
      location: 'organize-codebase-audit.cjs',
      message,
      data,
      timestamp: Date.now()
    };

    console.log(`[${hypothesisId}] ${message}`, data);

    // Write to debug log if available
    try {
      const fs = require('fs');
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync('/tmp/organization-debug.log', logLine);
    } catch (error) {
      // Ignore if log file not available
    }
  }

  async auditAll() {
    console.log('🔍 COMPREHENSIVE CODEBASE ORGANIZATION AUDIT\n');

    try {
      // Hypothesis A: Loose files in root directory
      await this.auditLooseFiles();

      // Hypothesis B: Multiple conflicting configurations
      await this.auditConfigurationConflicts();

      // Hypothesis C: Custom code instead of vendor solutions
      await this.auditCustomCode();

      // Hypothesis D: Poor directory structure
      await this.auditDirectoryStructure();

      // Hypothesis E: Missing governance
      await this.auditGovernance();

      this.analyzeResults();

    } catch (error) {
      this.log('ERROR', 'Organization audit failed', { error: error.message });
    }
  }

  async auditLooseFiles() {
    this.log('A', 'Auditing loose files in root directory');

    const rootDir = '/Users/daniellynch/Developer';
    const items = fs.readdirSync(rootDir);

    const allowedRootItems = [
      'pixi.toml', 'pixi.lock', 'package.json', 'tsconfig.json', 'turbo.json',
      'README.md', 'LICENSE', 'CONTRIBUTING.md', '.gitignore', '.cursorignore',
      'Makefile', 'justfile', 'pyproject.toml'
    ];

    const directories = [];
    const looseFiles = [];
    const configFiles = [];

    for (const item of items) {
      const fullPath = path.join(rootDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Check if directory name follows conventions
        if (!item.startsWith('.') && !this.isValidDirectoryName(item)) {
          this.results.directoryViolations.push({
            type: 'poor_directory_naming',
            path: item,
            severity: 'medium',
            message: `Directory ${item} doesn't follow naming conventions`
          });
        }
        directories.push(item);
      } else if (item.endsWith('.json') || item.endsWith('.toml') || item.endsWith('.yaml') || item.endsWith('.yml')) {
        configFiles.push(item);
      } else if (!allowedRootItems.includes(item) && !item.startsWith('.')) {
        looseFiles.push({
          file: item,
          size: stat.size,
          type: this.getFileType(item)
        });
      }
    }

    this.results.looseFiles = looseFiles;
    this.log('A', `Found ${looseFiles.length} loose files, ${configFiles.length} config files, ${directories.length} directories`);

    if (looseFiles.length > 0) {
      this.results.directoryViolations.push({
        type: 'loose_files_in_root',
        files: looseFiles,
        severity: 'high',
        message: `Found ${looseFiles.length} loose files in root directory`
      });
    }

    // Check for multiple config files of same type
    const configTypes = {};
    for (const file of configFiles) {
      const ext = path.extname(file);
      if (!configTypes[ext]) configTypes[ext] = [];
      configTypes[ext].push(file);
    }

    for (const [ext, files] of Object.entries(configTypes)) {
      if (files.length > 1) {
        this.results.directoryViolations.push({
          type: 'multiple_config_files',
          extension: ext,
          files: files,
          severity: 'medium',
          message: `Multiple ${ext} config files: ${files.join(', ')}`
        });
      }
    }
  }

  async auditConfigurationConflicts() {
    this.log('B', 'Auditing configuration conflicts');

    const configFiles = [
      'pixi.toml',
      'package.json',
      'tsconfig.json',
      'pyproject.toml'
    ];

    for (const configFile of configFiles) {
      const filePath = path.join('/Users/daniellynch/Developer', configFile);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');

          // Check for conflicting package managers
          if (configFile === 'pixi.toml' && content.includes('package.json')) {
            this.results.directoryViolations.push({
              type: 'conflicting_package_managers',
              file: configFile,
              severity: 'high',
              message: 'Using both pixi and npm/yarn package managers'
            });
          }

          // Check for hardcoded paths
          const hardcodedPaths = content.match(/\/Users\/daniellynch\/Developer\/[^$]/g);
          if (hardcodedPaths && hardcodedPaths.length > 0) {
            this.results.directoryViolations.push({
              type: 'hardcoded_paths',
              file: configFile,
              paths: hardcodedPaths.slice(0, 3),
              severity: 'medium',
              message: `Found ${hardcodedPaths.length} hardcoded paths in ${configFile}`
            });
          }

        } catch (error) {
          this.log('B', `Error reading ${configFile}`, { error: error.message });
        }
      }
    }
  }

  async auditCustomCode() {
    this.log('C', 'Auditing custom code vs vendor solutions');

    const scriptsDir = '/Users/daniellynch/Developer/scripts';
    if (fs.existsSync(scriptsDir)) {
      const scriptFiles = fs.readdirSync(scriptsDir).filter(file =>
        file.endsWith('.sh') || file.endsWith('.cjs') || file.endsWith('.js')
      );

      for (const scriptFile of scriptFiles) {
        const filePath = path.join(scriptsDir, scriptFile);
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for custom implementations that should be vendor
        if (content.includes('docker run') || content.includes('kubectl') || content.includes('npm install')) {
          this.results.customCode.push({
            type: 'custom_infrastructure_script',
            file: `scripts/${scriptFile}`,
            severity: 'medium',
            message: `${scriptFile} contains custom infrastructure code that should use vendor tools`
          });
        }

        // Check for hardcoded values
        if (content.includes('localhost') || content.includes('127.0.0.1')) {
          this.results.customCode.push({
            type: 'hardcoded_connections',
            file: `scripts/${scriptFile}`,
            severity: 'low',
            message: `${scriptFile} contains hardcoded connection strings`
          });
        }
      }
    }
  }

  async auditDirectoryStructure() {
    this.log('D', 'Auditing directory structure compliance');

    const requiredDirs = {
      'docs/': 'Documentation',
      'scripts/': 'Build and automation scripts',
      'testing/': 'Test suites and frameworks',
      'infra/': 'Infrastructure as Code',
      'data/': 'Datasets and data files',
      'api/': 'API definitions',
      'federation/': 'GraphQL federation',
      'graphql/': 'GraphQL schemas',
      'database/': 'Database schemas and migrations'
    };

    for (const [dir, purpose] of Object.entries(requiredDirs)) {
      const fullPath = path.join('/Users/daniellynch/Developer', dir);
      if (!fs.existsSync(fullPath)) {
        this.results.directoryViolations.push({
          type: 'missing_required_directory',
          directory: dir,
          purpose: purpose,
          severity: 'medium',
          message: `Required directory ${dir} (${purpose}) is missing`
        });
      }
    }

    // Check for files in wrong directories
    const wrongLocations = await this.findFilesInWrongDirectories();
    this.results.directoryViolations.push(...wrongLocations);
  }

  async auditGovernance() {
    this.log('E', 'Auditing governance and enforcement mechanisms');

    // Check for pre-commit hooks
    const hooksDir = '/Users/daniellynch/Developer/.cursor/hooks';
    if (!fs.existsSync(hooksDir)) {
      this.results.governance.push({
        type: 'missing_pre_commit_hooks',
        severity: 'high',
        message: 'No pre-commit hooks to enforce organization rules'
      });
    }

    // Check for linting configurations
    const lintConfigs = ['.eslintrc', 'eslint.config.js', 'pyproject.toml'];
    let hasLinting = false;
    for (const config of lintConfigs) {
      if (fs.existsSync(path.join('/Users/daniellynch/Developer', config))) {
        hasLinting = true;
        break;
      }
    }

    if (!hasLinting) {
      this.results.governance.push({
        type: 'missing_linting',
        severity: 'medium',
        message: 'No linting configuration to enforce code quality'
      });
    }

    // Check for CI/CD
    const ciFiles = ['.github/workflows', '.gitlab-ci.yml', 'azure-pipelines.yml'];
    let hasCI = false;
    for (const ciFile of ciFiles) {
      if (fs.existsSync(path.join('/Users/daniellynch/Developer', ciFile))) {
        hasCI = true;
        break;
      }
    }

    if (!hasCI) {
      this.results.governance.push({
        type: 'missing_ci_cd',
        severity: 'high',
        message: 'No CI/CD configuration to enforce quality gates'
      });
    }
  }

  async findFilesInWrongDirectories() {
    const violations = [];
    const wrongFiles = [];

    // Find .md files outside docs/
    const mdFiles = await this.findFilesByPattern('**/*.md');
    for (const file of mdFiles) {
      if (!file.startsWith('docs/') && !file.startsWith('README.md')) {
        wrongFiles.push({
          file: file,
          issue: 'Markdown files should be in docs/',
          severity: 'low'
        });
      }
    }

    // Find config files in wrong places
    const configFiles = await this.findFilesByPattern('**/*.{json,yaml,yml,toml}');
    for (const file of configFiles) {
      if (file.includes('/src/') || file.includes('/lib/')) {
        wrongFiles.push({
          file: file,
          issue: 'Config files should not be in source directories',
          severity: 'medium'
        });
      }
    }

    return wrongFiles.map(item => ({
      type: 'file_in_wrong_directory',
      ...item
    }));
  }

  async findFilesByPattern(pattern) {
    const files = [];
    const searchDir = '/Users/daniellynch/Developer';

    function scan(dir, relativePath = '') {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relPath = path.join(relativePath, item);

        // Skip certain directories
        if (['node_modules', '.git', '.pixi', '.cursor'].includes(item)) continue;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scan(fullPath, relPath);
        } else {
          // Simple pattern matching
          if (pattern.includes('*.md') && item.endsWith('.md')) {
            files.push(relPath);
          } else if (pattern.includes('{json,yaml,yml,toml}')) {
            if (item.endsWith('.json') || item.endsWith('.yaml') || item.endsWith('.yml') || item.endsWith('.toml')) {
              files.push(relPath);
            }
          }
        }
      }
    }

    scan(searchDir);
    return files;
  }

  isValidDirectoryName(name) {
    // Check for kebab-case, snake_case, or camelCase
    const validPatterns = [
      /^[a-z]+(-[a-z]+)*$/,  // kebab-case
      /^[a-z]+(_[a-z]+)*$/,  // snake_case
      /^[a-z]+([A-Z][a-z]*)*$/  // camelCase
    ];

    return validPatterns.some(pattern => pattern.test(name));
  }

  getFileType(filename) {
    const ext = path.extname(filename);
    switch (ext) {
      case '.js': case '.cjs': case '.mjs': return 'JavaScript';
      case '.ts': case '.tsx': return 'TypeScript';
      case '.py': return 'Python';
      case '.sh': return 'Shell Script';
      case '.json': return 'JSON Config';
      case '.md': return 'Markdown';
      case '.yaml': case '.yml': return 'YAML Config';
      case '.toml': return 'TOML Config';
      default: return 'Other';
    }
  }

  analyzeResults() {
    console.log('\n📊 ORGANIZATION AUDIT ANALYSIS\n');

    const totalViolations = Object.values(this.results).flat().length;

    console.log(`Total organization violations found: ${totalViolations}`);

    console.log('\n🔍 VIOLATION BREAKDOWN:');

    console.log(`Loose files in root: ${this.results.looseFiles.length}`);
    console.log(`Directory violations: ${this.results.directoryViolations.length}`);
    console.log(`Custom code issues: ${this.results.customCode.length}`);
    console.log(`Governance gaps: ${this.results.governance.length}`);

    console.log('\n🎯 CRITICAL ISSUES:');

    const criticalIssues = Object.values(this.results).flat().filter(v => v.severity === 'high');
    if (criticalIssues.length > 0) {
      criticalIssues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.message}`);
      });
    } else {
      console.log('✅ No critical issues found');
    }

    console.log('\n💡 RECOMMENDED FIXES:');

    if (this.results.looseFiles.length > 0) {
      console.log('1. 📁 Move loose files to appropriate directories:');
      this.results.looseFiles.forEach(file => {
        console.log(`   - ${file.file} (${file.type}) → Move to relevant directory`);
      });
    }

    if (this.results.directoryViolations.length > 0) {
      console.log('2. 🏗️ Fix directory structure violations');
    }

    if (this.results.customCode.length > 0) {
      console.log('3. 🏢 Replace custom code with vendor solutions');
    }

    if (this.results.governance.length > 0) {
      console.log('4. 📋 Implement governance mechanisms:');
      console.log('   - Add pre-commit hooks');
      console.log('   - Configure linting');
      console.log('   - Set up CI/CD quality gates');
    }
  }

  generateOrganizationPlan() {
    const plan = {
      timestamp: new Date().toISOString(),
      violations: this.results,
      recommendations: this.generateRecommendations(),
      implementationSteps: this.generateImplementationSteps()
    };

    const reportPath = '/Users/daniellynch/Developer/docs/organization-audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(plan, null, 2));

    console.log(`📄 Organization plan saved to ${reportPath}`);
  }

  generateRecommendations() {
    return [
      {
        priority: 'High',
        category: 'File Organization',
        actions: [
          'Move all loose files from root directory to appropriate subdirectories',
          'Consolidate multiple configuration files of the same type',
          'Remove redundant or obsolete configuration files'
        ]
      },
      {
        priority: 'High',
        category: 'Directory Structure',
        actions: [
          'Create missing required directories (docs/, scripts/, testing/, etc.)',
          'Move files to correct directories based on type and purpose',
          'Rename directories to follow consistent naming conventions'
        ]
      },
      {
        priority: 'Medium',
        category: 'Vendor Compliance',
        actions: [
          'Replace custom infrastructure scripts with vendor tools',
          'Use vendor CLI tools instead of custom implementations',
          'Integrate with vendor APIs and services'
        ]
      },
      {
        priority: 'High',
        category: 'Governance',
        actions: [
          'Implement pre-commit hooks to prevent loose files',
          'Add linting and formatting rules',
          'Set up CI/CD pipelines with quality gates',
          'Create organization standards documentation'
        ]
      }
    ];
  }

  generateImplementationSteps() {
    return [
      '1. Create required directory structure',
      '2. Move loose files to appropriate directories',
      '3. Consolidate and clean up configuration files',
      '4. Replace custom scripts with vendor tools',
      '5. Implement governance mechanisms (hooks, linting, CI/CD)',
      '6. Update documentation with organization standards',
      '7. Train team on new organization practices'
    ];
  }
}

// Run audit if called directly
if (require.main === module) {
  const organizer = new CodebaseOrganizer();
  organizer.auditAll().then(() => {
    organizer.generateOrganizationPlan();
  }).catch(console.error);
}

module.exports = CodebaseOrganizer;