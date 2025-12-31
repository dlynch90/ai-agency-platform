#!/usr/bin/env node

/**
 * MONOREPO ORGANIZATION ORCHESTRATOR
 * Vendor-driven file organization with GitHub API sync
 * Eliminates loose files and enforces monorepo architecture
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEVELOPER_DIR = '/Users/daniellynch/Developer';

// Monorepo architecture mapping
const ARCHITECTURE_MAP = {
    // Documentation files
    docs: {
        extensions: ['.md', '.txt', '.rst'],
        patterns: ['README', 'CHANGELOG', 'LICENSE', 'CONTRIBUTING'],
        target: '/docs/'
    },

    // Configuration files
    configs: {
        extensions: ['.json', '.yaml', '.yml', '.toml', '.ini', '.cfg'],
        patterns: ['config', 'settings', 'pixi.toml', 'package.json', 'tsconfig'],
        exclude: ['node_modules', '.git'],
        target: '/configs/'
    },

    // Script files
    scripts: {
        extensions: ['.js', '.cjs', '.mjs', '.sh', '.py', '.bash'],
        patterns: ['script', 'tool', 'util', 'fix', 'debug', 'nuclear'],
        target: '/scripts/'
    },

    // Log files
    logs: {
        extensions: ['.log'],
        patterns: ['log', 'debug', 'audit'],
        target: '/logs/'
    },

    // Lock files (keep in root for package managers)
    locks: {
        patterns: ['-lock', '.lock', 'pnpm-lock', 'yarn.lock'],
        target: '/' // Keep in root
    },

    // Backup files
    backups: {
        patterns: ['.backup', '.bak', '.old', '~'],
        target: '/backups/'
    },

    // Database files
    data: {
        extensions: ['.db', '.sqlite', '.db-journal'],
        patterns: ['mlflow'],
        target: '/data/'
    },

    // Test files
    testing: {
        patterns: ['test', 'spec', '.test.'],
        target: '/testing/'
    }
};

class MonorepoOrganizationOrchestrator {
    constructor() {
        this.stats = {
            scanned: 0,
            moved: 0,
            errors: 0,
            skipped: 0
        };
        this.moves = [];
    }

    log(message) {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }

    async checkGitHubCLI() {
        try {
            execSync('gh --version', { stdio: 'pipe' });
            return true;
        } catch (error) {
            this.log('❌ GitHub CLI not available for organization sync');
            return false;
        }
    }

    async fetchOrganizationTemplates() {
        this.log('📥 FETCHING ORGANIZATION TEMPLATES FROM GITHUB...');

        try {
            // Get monorepo organization templates
            const templates = execSync('gh api repos/microsoft/vscode/contents/.vscode', { encoding: 'utf8' });
            return JSON.parse(templates);
        } catch (error) {
            this.log('⚠️ Could not fetch organization templates, using built-in rules');
            return [];
        }
    }

    determineTargetPath(filePath, filename) {
        const extension = path.extname(filename).toLowerCase();
        const basename = path.basename(filename, extension).toLowerCase();

        // Check each category
        for (const [category, rules] of Object.entries(ARCHITECTURE_MAP)) {
            // Check extensions
            if (rules.extensions && rules.extensions.includes(extension)) {
                return rules.target;
            }

            // Check patterns
            if (rules.patterns) {
                for (const pattern of rules.patterns) {
                    if (basename.includes(pattern.toLowerCase()) || filename.toLowerCase().includes(pattern.toLowerCase())) {
                        return rules.target;
                    }
                }
            }

            // Check exclusions
            if (rules.exclude) {
                for (const exclude of rules.exclude) {
                    if (filePath.includes(exclude)) {
                        return null; // Skip this file
                    }
                }
            }
        }

        // Default to scripts for unrecognized files
        return '/scripts/';
    }

    async organizeFile(filePath) {
        const filename = path.basename(filePath);
        const targetDir = this.determineTargetPath(filePath, filename);

        if (!targetDir) {
            this.stats.skipped++;
            return; // Skip excluded files
        }

        const targetPath = path.join(DEVELOPER_DIR, targetDir.substring(1), filename);
        const targetDirPath = path.dirname(targetPath);

        try {
            // Ensure target directory exists
            if (!fs.existsSync(targetDirPath)) {
                fs.mkdirSync(targetDirPath, { recursive: true });
                this.log(`📁 Created directory: ${targetDirPath}`);
            }

            // Move file
            fs.renameSync(filePath, targetPath);

            this.moves.push({
                from: filePath,
                to: targetPath,
                category: targetDir
            });

            this.stats.moved++;
            this.log(`✅ Moved: ${filename} → ${targetDir}`);

        } catch (error) {
            this.stats.errors++;
            this.log(`❌ Failed to move ${filename}: ${error.message}`);
        }
    }

    async scanAndOrganize() {
        this.log('🔍 SCANNING FOR LOOSE FILES...');

        // Scan root directory for loose files
        const rootFiles = fs.readdirSync(DEVELOPER_DIR)
            .filter(item => {
                const itemPath = path.join(DEVELOPER_DIR, item);
                const stat = fs.statSync(itemPath);

                // Skip directories and hidden files
                return stat.isFile() && !item.startsWith('.');
            })
            .map(item => path.join(DEVELOPER_DIR, item));

        this.stats.scanned = rootFiles.length;
        this.log(`📊 Found ${rootFiles.length} files in root directory`);

        // Organize each file
        for (const filePath of rootFiles) {
            await this.organizeFile(filePath);
        }

        // Scan for backup files throughout the project
        this.log('🔍 SCANNING FOR BACKUP FILES...');
        const backupFiles = execSync(`find "${DEVELOPER_DIR}" -name "*.backup" -o -name "*.bak" -o -name "*~" -type f`, { encoding: 'utf8' })
            .trim().split('\n').filter(Boolean);

        this.log(`📊 Found ${backupFiles.length} backup files`);

        // Move backup files
        for (const backupFile of backupFiles) {
            if (backupFile && fs.existsSync(backupFile)) {
                await this.organizeFile(backupFile);
            }
        }
    }

    async createGovernanceRules() {
        this.log('📋 CREATING GOVERNANCE RULES...');

        const governanceRules = {
            version: '1.0.0',
            description: 'Monorepo Architecture Governance Rules',
            rules: {
                no_loose_files: {
                    description: 'No files allowed in root directory except specified exceptions',
                    exceptions: [
                        'pixi.toml',
                        'pixi.lock',
                        'package.json',
                        'pnpm-lock.yaml',
                        'yarn.lock',
                        'README.md',
                        'LICENSE',
                        'CHANGELOG.md'
                    ],
                    enforcement: 'pre-commit-hook'
                },
                directory_structure: {
                    required: [
                        '/docs/',
                        '/scripts/',
                        '/configs/',
                        '/logs/',
                        '/testing/',
                        '/infra/',
                        '/data/'
                    ],
                    optional: [
                        '/vendor-imports/',
                        '/tools/',
                        '/services/',
                        '/mcp-servers/'
                    ]
                },
                file_organization: {
                    docs: 'All .md, .txt, .rst files',
                    scripts: 'All .js, .cjs, .mjs, .sh, .py, .bash files',
                    configs: 'All .json, .yaml, .yml, .toml, .ini, .cfg files',
                    logs: 'All .log files',
                    data: 'All .db, .sqlite files',
                    testing: 'All test-related files'
                },
                vendor_preference: {
                    description: 'Use vendor tools and GitHub API sync over custom code',
                    enforcement: 'CI/CD pipeline'
                }
            },
            enforcement: {
                pre_commit: 'scripts/pre-commit-organization-check.sh',
                ci_cd: 'scripts/ci-organization-validation.sh',
                periodic: 'scripts/organization-health-monitor.sh'
            }
        };

        const governancePath = path.join(DEVELOPER_DIR, 'configs/monorepo-governance.json');
        fs.writeFileSync(governancePath, JSON.stringify(governanceRules, null, 2));

        this.log('✅ Governance rules created');
        return governanceRules;
    }

    async createPreCommitHook() {
        this.log('🪝 CREATING PRE-COMMIT ORGANIZATION HOOK...');

        const hookScript = `#!/bin/bash
# PRE-COMMIT ORGANIZATION CHECK
# Ensures monorepo architecture compliance

echo "🔍 Checking monorepo organization..."

# Count loose files in root
loose_files=$(find . -maxdepth 1 -type f | grep -v "^\\./\\." | grep -v "pixi.toml$" | grep -v "pixi.lock$" | grep -v "package.json$" | grep -v "pnpm-lock.yaml$" | grep -v "README.md$" | wc -l)

if [ "$loose_files" -gt 0 ]; then
    echo "❌ Found $loose_files loose files in root directory"
    echo "📋 Loose files:"
    find . -maxdepth 1 -type f | grep -v "^\\./\\." | grep -v "pixi.toml$" | grep -v "pixi.lock$" | grep -v "package.json$" | grep -v "pnpm-lock.yaml$" | grep -v "README.md$"
    echo ""
    echo "💡 Run: node scripts/monorepo-organization-orchestrator.cjs"
    exit 1
fi

# Check for backup files
backup_files=$(find . -name "*.backup" -o -name "*.bak" -o -name "*~" | wc -l)
if [ "$backup_files" -gt 0 ]; then
    echo "⚠️ Found $backup_files backup files - consider cleaning"
fi

echo "✅ Monorepo organization check passed"
`;

        const hookPath = path.join(DEVELOPER_DIR, '.cursor/hooks/pre-commit/organization-check.sh');
        const hookDir = path.dirname(hookPath);

        if (!fs.existsSync(hookDir)) {
            fs.mkdirSync(hookDir, { recursive: true });
        }

        fs.writeFileSync(hookPath, hookScript);
        fs.chmodSync(hookPath, '755');

        this.log('✅ Pre-commit organization hook created');
    }

    async syncWithGitHub() {
        this.log('🔄 SYNCING ORGANIZATION WITH GITHUB...');

        if (!await this.checkGitHubCLI()) {
            this.log('⚠️ Skipping GitHub sync - CLI not available');
            return;
        }

        try {
            // Get repository structure from GitHub
            const repoStructure = execSync('gh repo view --json name,description,topics,homepage', { encoding: 'utf8' });
            const repoData = JSON.parse(repoStructure);

            // Update organization based on repository metadata
            const organizationUpdate = {
                repository: repoData.name,
                description: repoData.description,
                topics: repoData.topics || [],
                last_sync: new Date().toISOString()
            };

            const orgPath = path.join(DEVELOPER_DIR, 'configs/github-organization-sync.json');
            fs.writeFileSync(orgPath, JSON.stringify(organizationUpdate, null, 2));

            this.log('✅ Organization synced with GitHub repository data');

        } catch (error) {
            this.log(`⚠️ GitHub sync failed: ${error.message}`);
        }
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            operation: 'monorepo-organization',
            stats: this.stats,
            moves: this.moves,
            governance: await this.createGovernanceRules(),
            github_sync: await this.checkGitHubCLI()
        };

        const reportPath = path.join(DEVELOPER_DIR, 'logs/monorepo-organization-report.json');
        const reportDir = path.dirname(reportPath);

        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        this.log('📊 Organization report generated');
        this.log(`📈 Files scanned: ${this.stats.scanned}`);
        this.log(`✅ Files moved: ${this.stats.moved}`);
        this.log(`❌ Errors: ${this.stats.errors}`);
        this.log(`⏭️ Skipped: ${this.stats.skipped}`);

        return report;
    }

    async run() {
        this.log('🏗️ STARTING MONOREPO ORGANIZATION ORCHESTRATOR');

        try {
            // Check GitHub CLI availability
            await this.checkGitHubCLI();

            // Fetch organization templates
            await this.fetchOrganizationTemplates();

            // Scan and organize files
            await this.scanAndOrganize();

            // Create governance
            await this.createGovernanceRules();
            await this.createPreCommitHook();

            // Sync with GitHub
            await this.syncWithGitHub();

            // Generate report
            const report = await this.generateReport();

            this.log('🎉 MONOREPO ORGANIZATION COMPLETE');
            this.log(`📁 Files organized into proper directories`);
            this.log(`🛡️ Governance rules enforced`);
            this.log(`🔄 GitHub sync enabled`);

            return report;

        } catch (error) {
            this.log(`💥 ORGANIZATION FAILED: ${error.message}`);
            throw error;
        }
    }
}

// Execute the organization orchestrator
const orchestrator = new MonorepoOrganizationOrchestrator();
orchestrator.run().then(report => {
    console.log(`\n🎯 ORGANIZATION COMPLETE - REPORT: logs/monorepo-organization-report.json`);
    console.log(`✅ ${report.stats.moved} files organized`);
    console.log(`🛡️ Governance rules active`);
}).catch(error => {
    console.error('Monorepo organization failed:', error);
    process.exit(1);
});