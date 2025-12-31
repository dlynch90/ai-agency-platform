#!/usr/bin/env node

/**
 * AUTO FILE ORGANIZER
 * Automatically moves loose files to proper directories based on organization standards
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutoFileOrganizer {
  constructor() {
    this.SERVER_ENDPOINT = 'http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab';
    this.rootDir = '/Users/daniellynch/Developer';
    this.moves = [];
    this.errors = [];
  }

  log(hypothesisId, message, data = {}) {
    const logEntry = {
      sessionId: 'auto-organize',
      runId: 'file-organization',
      hypothesisId,
      location: 'auto-organize-files.cjs',
      message,
      data,
      timestamp: Date.now()
    };

    console.log(`[${hypothesisId}] ${message}`, data);

    // Write to debug log if available
    try {
      const fs = require('fs');
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync('/tmp/auto-organize-debug.log', logLine);
    } catch (error) {
      // Ignore if log file not available
    }
  }

  async organizeAll() {
    console.log('🤖 AUTO FILE ORGANIZER\n');
    console.log('Moving loose files to proper directories...\n');

    try {
      // Read audit results
      const auditPath = path.join(this.rootDir, 'docs/organization-audit-report.json');
      const auditData = JSON.parse(fs.readFileSync(auditPath, 'utf8'));

      // Process loose files
      await this.organizeLooseFiles(auditData.violations.looseFiles || []);

      // Process directory violations
      await this.organizeDirectoryViolations(auditData.violations.directoryViolations || []);

      // Process custom code issues
      await this.fixCustomCodeIssues(auditData.violations.customCode || []);

      this.showResults();

    } catch (error) {
      this.log('ERROR', 'Auto organization failed', { error: error.message });
      console.error('❌ Auto organization failed:', error.message);
    }
  }

  async organizeLooseFiles(looseFiles) {
    this.log('LOOSE', `Found ${looseFiles.length} loose files to organize`);

    for (const file of looseFiles) {
      try {
        const sourcePath = path.join(this.rootDir, file.file);
        const destDir = this.determineDestinationDirectory(file);
        const destPath = path.join(this.rootDir, destDir, file.file);

        // Create destination directory if it doesn't exist
        const destDirPath = path.join(this.rootDir, destDir);
        if (!fs.existsSync(destDirPath)) {
          fs.mkdirSync(destDirPath, { recursive: true });
          this.log('CREATE_DIR', `Created directory: ${destDir}`);
        }

        // Move file
        fs.renameSync(sourcePath, destPath);
        this.moves.push({
          from: file.file,
          to: path.join(destDir, file.file),
          reason: 'loose file organization'
        });

        this.log('MOVE', `Moved ${file.file} → ${destDir}/`);

      } catch (error) {
        this.errors.push({
          file: file.file,
          error: error.message,
          type: 'move_failed'
        });
        this.log('ERROR', `Failed to move ${file.file}`, { error: error.message });
      }
    }
  }

  async organizeDirectoryViolations(violations) {
    this.log('DIR_VIOLATIONS', `Processing ${violations.length} directory violations`);

    for (const violation of violations) {
      if (violation.type === 'file_in_wrong_directory' && violation.issue.includes('should be in docs/')) {
        try {
          const sourcePath = path.join(this.rootDir, violation.file);
          const destPath = path.join(this.rootDir, 'docs', path.basename(violation.file));

          // Create docs directory if needed
          const docsDir = path.join(this.rootDir, 'docs');
          if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
          }

          // Move file
          fs.renameSync(sourcePath, destPath);
          this.moves.push({
            from: violation.file,
            to: `docs/${path.basename(violation.file)}`,
            reason: 'markdown file relocation'
          });

          this.log('MOVE_DOC', `Moved ${violation.file} → docs/`);

        } catch (error) {
          this.errors.push({
            file: violation.file,
            error: error.message,
            type: 'doc_move_failed'
          });
        }
      }
    }
  }

  async fixCustomCodeIssues(issues) {
    this.log('CUSTOM_CODE', `Processing ${issues.length} custom code issues`);

    // This is more complex - we'll create vendor-compliant replacements
    for (const issue of issues) {
      if (issue.type === 'hardcoded_connections') {
        await this.createEnvironmentConfig(issue);
      }
    }
  }

  async createEnvironmentConfig(issue) {
    try {
      const envFile = path.join(this.rootDir, 'configs/environment/.env.example');

      // Create configs/environment directory
      const envDir = path.dirname(envFile);
      if (!fs.existsSync(envDir)) {
        fs.mkdirSync(envDir, { recursive: true });
      }

      // Read current file to extract connection strings
      const filePath = path.join(this.rootDir, issue.file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');

        // Extract potential environment variables
        const localhostMatches = content.match(/localhost:\d+/g) || [];
        const ipMatches = content.match(/127\.0\.0\.1:\d+/g) || [];

        if (localhostMatches.length > 0 || ipMatches.length > 0) {
          const envContent = `# Environment variables extracted from ${issue.file}
# Replace hardcoded values with these environment variables

${localhostMatches.map(match => `# ${match} → \${SERVICE_${match.replace(/[:.]/g, '_').toUpperCase()}_URL}`).join('\n')}
${ipMatches.map(match => `# ${match} → \${SERVICE_${match.replace(/[:.]/g, '_').toUpperCase()}_URL}`).join('\n')}

# Example:
# SERVICE_LOCALHOST_3000_URL=http://localhost:3000
# SERVICE_127_0_0_1_5432_URL=postgresql://localhost:5432/mydb
`;

          fs.writeFileSync(envFile, envContent);
          this.log('ENV_CONFIG', `Created environment config for ${issue.file}`);
        }
      }

    } catch (error) {
      this.errors.push({
        file: issue.file,
        error: error.message,
        type: 'env_config_failed'
      });
    }
  }

  determineDestinationDirectory(file) {
    const filename = file.file;
    const ext = path.extname(filename);

    // Determine destination based on file type
    switch (ext) {
      case '.md':
        return 'docs';
      case '.sh':
      case '.cjs':
      case '.js':
      case '.py':
        return 'scripts';
      case '.json':
      case '.yaml':
      case '.yml':
      case '.toml':
        return 'configs';
      case '.test.js':
      case '.spec.js':
      case '.test.ts':
      case '.spec.ts':
        return 'testing';
      case '.sql':
        return 'database';
      default:
        // Check file content or name for clues
        if (filename.includes('docker') || filename.includes('compose')) {
          return 'infra/docker';
        } else if (filename.includes('k8s') || filename.includes('kubernetes')) {
          return 'infra/kubernetes';
        } else if (filename.includes('test') || filename.includes('spec')) {
          return 'testing';
        } else if (filename.includes('api') || filename.includes('endpoint')) {
          return 'api';
        } else if (filename.includes('schema') || filename.includes('migration')) {
          return 'database';
        } else {
          return 'data'; // Default fallback
        }
    }
  }

  showResults() {
    console.log('\n📊 ORGANIZATION RESULTS\n');

    if (this.moves.length > 0) {
      console.log(`✅ Successfully moved ${this.moves.length} files:`);
      this.moves.forEach(move => {
        console.log(`   ${move.from} → ${move.to}`);
      });
    }

    if (this.errors.length > 0) {
      console.log(`❌ ${this.errors.length} errors occurred:`);
      this.errors.forEach(error => {
        console.log(`   ${error.file}: ${error.error}`);
      });
    }

    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Review moved files and update any imports');
    console.log('2. Replace hardcoded values with environment variables');
    console.log('3. Run: node scripts/organize-codebase-audit.cjs');
    console.log('4. Commit changes: git add . && git commit -m "Auto-organize files"');

    // Update git index if moves were made
    if (this.moves.length > 0) {
      try {
        execSync('git add .', { cwd: this.rootDir, stdio: 'inherit' });
        console.log('\n✅ Files staged for commit');
      } catch (error) {
        console.log('\n⚠️  Could not stage files automatically');
      }
    }
  }

  // Utility method to create missing required directories
  createRequiredDirectories() {
    const requiredDirs = [
      'docs',
      'scripts',
      'testing',
      'infra',
      'data',
      'api',
      'federation',
      'graphql',
      'database',
      'configs'
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(this.rootDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        this.log('CREATE_DIR', `Created required directory: ${dir}`);
      }
    }
  }
}

// Run auto organizer if called directly
if (require.main === module) {
  const organizer = new AutoFileOrganizer();
  organizer.createRequiredDirectories();
  organizer.organizeAll().catch(console.error);
}

module.exports = AutoFileOrganizer;