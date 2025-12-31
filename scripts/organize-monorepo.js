#!/usr/bin/env node
/**
 * Monorepo Directory Organization Script
 * Ensures all files are in proper directories according to standards
 */

const fs = require('fs');
const path = require('path');

class MonorepoOrganizer {
    constructor(rootPath = process.cwd()) {
        this.rootPath = rootPath;
        this.stats = {
            moved: 0,
            created: 0,
            errors: 0
        };
    }

    log(message, data = null) {
        console.log(`[${new Date().toISOString()}] ${message}`);
        if (data) console.log(JSON.stringify(data, null, 2));
    }

    ensureDirectory(dirPath) {
        const fullPath = path.join(this.rootPath, dirPath);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            this.stats.created++;
            this.log(`📁 Created directory: ${dirPath}`);
        }
    }

    moveFile(source, destination) {
        const sourcePath = path.join(this.rootPath, source);
        const destPath = path.join(this.rootPath, destination);

        try {
            if (fs.existsSync(sourcePath)) {
                // Ensure destination directory exists
                const destDir = path.dirname(destPath);
                this.ensureDirectory(destDir);

                fs.renameSync(sourcePath, destPath);
                this.stats.moved++;
                this.log(`📄 Moved: ${source} → ${destination}`);
            }
        } catch (error) {
            this.stats.errors++;
            this.log(`❌ Error moving ${source}: ${error.message}`);
        }
    }

    organizeRootFiles() {
        this.log('🔄 Organizing root directory files...');

        // Files that should be in configs/
        const configFiles = [
            'package.json',
            'package-lock.json',
            'pixi.toml',
            'requirements.txt',
            'pyproject.toml',
            'tsconfig.json',
            'jest.config.js',
            '.env',
            '.env.local',
            '.env.production'
        ];

        // Files that should be in docs/
        const docFiles = [
            'README.md',
            'CHANGELOG.md',
            'CONTRIBUTING.md',
            'LICENSE',
            'LICENSE.md'
        ];

        // Files that should be in logs/
        const logFiles = [
            '*.log',
            'npm-debug.log*',
            'yarn-error.log*'
        ];

        // Move config files
        configFiles.forEach(file => {
            if (fs.existsSync(path.join(this.rootPath, file))) {
                this.moveFile(file, `configs/${file}`);
            }
        });

        // Move doc files
        docFiles.forEach(file => {
            if (fs.existsSync(path.join(this.rootPath, file))) {
                this.moveFile(file, `docs/${file}`);
            }
        });

        // Handle log files
        fs.readdirSync(this.rootPath).forEach(file => {
            if (file.endsWith('.log') || file.includes('debug.log')) {
                this.moveFile(file, `logs/${file}`);
            }
        });
    }

    organizeSubdirectories() {
        this.log('🔄 Organizing subdirectories...');

        // Ensure all required directories exist
        const requiredDirs = [
            'src',
            'docs',
            'testing',
            'infra',
            'data',
            'api',
            'graphql',
            'federation',
            'logs',
            'configs',
            'scripts',
            'vendors',
            'services'
        ];

        requiredDirs.forEach(dir => this.ensureDirectory(dir));

        // Move misplaced files
        this.organizeMisplacedFiles();
    }

    organizeMisplacedFiles() {
        // Find and move misplaced files
        const misplacedPatterns = [
            { pattern: /.*\.test\.js$/, target: 'testing/' },
            { pattern: /.*\.test\.py$/, target: 'testing/' },
            { pattern: /.*\.spec\.js$/, target: 'testing/' },
            { pattern: /.*\.spec\.py$/, target: 'testing/' },
            { pattern: /Dockerfile.*/, target: 'infra/' },
            { pattern: /docker-compose\.yml/, target: 'infra/' },
            { pattern: /.*\.sql$/, target: 'data/' },
            { pattern: /.*\.graphql$/, target: 'graphql/' },
            { pattern: /.*\.proto$/, target: 'api/' }
        ];

        this.walkDirectory('.', (filePath) => {
            const fileName = path.basename(filePath);

            for (const { pattern, target } of misplacedPatterns) {
                if (pattern.test(fileName)) {
                    const relativePath = path.relative(this.rootPath, filePath);
                    const targetPath = path.join(target, fileName);
                    this.moveFile(relativePath, targetPath);
                    break;
                }
            }
        });
    }

    walkDirectory(dir, callback) {
        const fullPath = path.join(this.rootPath, dir);

        if (!fs.existsSync(fullPath)) return;

        const items = fs.readdirSync(fullPath);

        for (const item of items) {
            const itemPath = path.join(fullPath, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                // Skip certain directories
                if (!['node_modules', '.git', '__pycache__', '.next', '.nuxt'].includes(item)) {
                    this.walkDirectory(path.join(dir, item), callback);
                }
            } else {
                callback(itemPath);
            }
        }
    }

    validateOrganization() {
        this.log('🔍 Validating directory organization...');

        const validationResults = {
            missing_dirs: [],
            misplaced_files: [],
            correct_files: 0
        };

        // Check required directories
        const requiredDirs = [
            'src', 'docs', 'testing', 'infra', 'data',
            'api', 'graphql', 'federation', 'logs', 'configs'
        ];

        requiredDirs.forEach(dir => {
            if (!fs.existsSync(path.join(this.rootPath, dir))) {
                validationResults.missing_dirs.push(dir);
            }
        });

        // Check for misplaced files in root
        const rootFiles = fs.readdirSync(this.rootPath).filter(file => {
            const stat = fs.statSync(path.join(this.rootPath, file));
            return stat.isFile() && !file.startsWith('.');
        });

        const allowedRootFiles = ['Makefile', 'Taskfile.yml', 'justfile'];
        validationResults.misplaced_files = rootFiles.filter(file =>
            !allowedRootFiles.includes(file)
        );

        validationResults.correct_files = rootFiles.length - validationResults.misplaced_files.length;

        this.log('📊 Validation Results:', validationResults);

        return validationResults;
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            validation: this.validateOrganization(),
            recommendations: this.generateRecommendations()
        };

        const reportPath = path.join(this.rootPath, 'docs', 'organization-report.json');
        this.ensureDirectory('docs');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        this.log(`💾 Organization report saved to: ${reportPath}`);
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.stats.errors > 0) {
            recommendations.push(`${this.stats.errors} files could not be moved - check permissions`);
        }

        if (this.validateOrganization().missing_dirs.length > 0) {
            recommendations.push(`Create missing directories: ${this.validateOrganization().missing_dirs.join(', ')}`);
        }

        if (this.validateOrganization().misplaced_files.length > 0) {
            recommendations.push(`Move ${this.validateOrganization().misplaced_files.length} misplaced files from root directory`);
        }

        return recommendations.length > 0 ? recommendations : ['Directory organization is optimal'];
    }

    run() {
        this.log('🚀 Starting Monorepo Directory Organization');
        this.log('=' .repeat(50));

        try {
            this.organizeRootFiles();
            this.organizeSubdirectories();

            this.log(`\n📊 ORGANIZATION COMPLETE`);
            this.log('=' .repeat(50));
            this.log(`Directories created: ${this.stats.created}`);
            this.log(`Files moved: ${this.stats.moved}`);
            this.log(`Errors: ${this.stats.errors}`);

            this.generateReport();

            return this.stats.errors === 0;

        } catch (error) {
            this.log(`❌ Organization failed: ${error.message}`);
            return false;
        }
    }
}

// Run the organizer
if (require.main === module) {
    const organizer = new MonorepoOrganizer();
    const success = organizer.run();
    process.exit(success ? 0 : 1);
}

module.exports = MonorepoOrganizer;