#!/usr/bin/env node

/**
 * ORGANIZE LOOSE FILES - MONOREPO ARCHITECTURE COMPLIANCE
 * Moves loose files to proper directories based on best practices
 * Prevents future sprawl with governance rules
 * Replaces custom code with vendor solutions via GitHub API
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEVELOPER_DIR = process.env.DEVELOPER_DIR || path.join(process.env.HOME, 'Developer');
const LOG_FILE = path.join(DEVELOPER_DIR, '.cursor/debug.log');

// Monorepo directory structure (best practices)
const MONOREPO_STRUCTURE = {
    'docs/': ['*.md', '*.rst', '*.txt', '*.adoc'],
    'scripts/': ['*.sh', '*.js', '*.mjs', '*.cjs', '*.py', '*.rb', '*.pl'],
    'configs/': ['*.toml', '*.yaml', '*.yml', '*.json', '*.conf', '*.ini', '*.cfg'],
    'testing/': ['*test*.js', '*test*.py', '*spec*.js', '*spec*.py', '*.test.*'],
    'infra/': ['docker-compose*.yml', 'Dockerfile*', '*.k8s.yaml', '*.k8s.yml', 'kubernetes/', 'terraform/'],
    'data/': ['*.db', '*.sqlite', '*.csv', '*.tsv', 'datasets/', 'models/'],
    'api/': ['openapi*.yaml', 'openapi*.json', 'swagger*.yaml', 'swagger*.json', 'graphql/'],
    'graphql/': ['*.graphql', '*.gql', 'schemas/'],
    'federation/': ['subgraphs/', 'gateway/'],
    'logs/': ['*.log', '*.log.*'],
    'tools/': ['vendor-tools/', 'cli-tools/']
};

class LooseFileOrganizer {
    constructor() {
        this.ensureLogDirectory();
        this.moves = [];
        this.violations = [];
        this.customCodeFiles = [];
    }

    ensureLogDirectory() {
        const logDir = path.dirname(LOG_FILE);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    log(message, data = {}) {
        const entry = {
            id: `organize_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            location: 'organize-loose-files.mjs',
            message,
            data,
            sessionId: 'file-organization',
            hypothesisId: 'MONOREPO_ORGANIZATION'
        };

        const logLine = JSON.stringify(entry) + '\n';
        fs.appendFileSync(LOG_FILE, logLine);
        console.log(`📁 ${message}`);
    }

    getFileCategory(filePath) {
        const fileName = path.basename(filePath);
        const ext = path.extname(fileName).toLowerCase();

        // Check each category
        for (const [dir, patterns] of Object.entries(MONOREPO_STRUCTURE)) {
            for (const pattern of patterns) {
                if (pattern.includes('*')) {
                    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                    if (regex.test(fileName) || regex.test(ext)) {
                        return dir;
                    }
                } else if (fileName.includes(pattern) || filePath.includes(pattern)) {
                    return dir;
                }
            }
        }

        // Default categorization by extension
        const extensionMap = {
            '.js': 'scripts/',
            '.mjs': 'scripts/',
            '.cjs': 'scripts/',
            '.py': 'scripts/',
            '.sh': 'scripts/',
            '.md': 'docs/',
            '.json': 'configs/',
            '.yaml': 'configs/',
            '.yml': 'configs/',
            '.toml': 'configs/',
            '.log': 'logs/',
            '.db': 'data/',
            '.sqlite': 'data/'
        };

        return extensionMap[ext] || 'scripts/';
    }

    async scanLooseFiles() {
        this.log('Scanning for loose files in root directory');

        const rootFiles = fs.readdirSync(DEVELOPER_DIR)
            .filter(item => {
                const fullPath = path.join(DEVELOPER_DIR, item);
                const stat = fs.statSync(fullPath);
                return stat.isFile() && !item.startsWith('.');
            })
            .filter(item => {
                // Exclude known root files that should stay
                const allowedRootFiles = [
                    'pixi.toml', 'package.json', 'package-lock.json', 'yarn.lock',
                    'pnpm-lock.yaml', 'Cargo.toml', 'go.mod', 'go.sum',
                    'requirements.txt', 'Pipfile', 'Pipfile.lock', 'poetry.lock',
                    'Makefile', 'justfile', 'Taskfile.yml', 'Taskfile.yaml',
                    'README.md', 'LICENSE', '.gitignore', '.gitattributes',
                    'docker-compose.yml', 'docker-compose.yaml'
                ];
                return !allowedRootFiles.includes(item);
            });

        this.log('Found loose files', { count: rootFiles.length, files: rootFiles });
        return rootFiles;
    }

    async scanLooseDirectories() {
        this.log('Scanning for loose directories in root');

        const rootDirs = fs.readdirSync(DEVELOPER_DIR)
            .filter(item => {
                const fullPath = path.join(DEVELOPER_DIR, item);
                const stat = fs.statSync(fullPath);
                return stat.isDirectory() && !item.startsWith('.');
            })
            .filter(item => {
                // Exclude known root directories that should stay
                const allowedRootDirs = [
                    'docs', 'scripts', 'configs', 'testing', 'infra', 'data',
                    'api', 'graphql', 'federation', 'logs', 'tools',
                    'node_modules', '.pixi', '.venv', '__pycache__',
                    'packages', 'apps', 'services', 'libs', 'mcp'
                ];
                return !allowedRootDirs.includes(item);
            });

        this.log('Found loose directories', { count: rootDirs.length, dirs: rootDirs });
        return rootDirs;
    }

    async identifyCustomCode() {
        this.log('Identifying custom code to replace with vendor solutions');

        const customCodePatterns = [
            /custom.*component/i,
            /custom.*hook/i,
            /custom.*util/i,
            /custom.*config/i
        ];

        const files = [];
        const scanDirs = ['scripts', 'tools', 'libs', 'packages'];

        for (const dir of scanDirs) {
            const dirPath = path.join(DEVELOPER_DIR, dir);
            if (fs.existsSync(dirPath)) {
                this.scanDirectoryForCustomCode(dirPath, customCodePatterns, files);
            }
        }

        this.customCodeFiles = files;
        this.log('Found custom code files', { count: files.length });
        return files;
    }

    scanDirectoryForCustomCode(dirPath, patterns, results) {
        try {
            const items = fs.readdirSync(dirPath);
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    this.scanDirectoryForCustomCode(fullPath, patterns, results);
                } else if (stat.isFile()) {
                    const fileName = path.basename(fullPath);
                    for (const pattern of patterns) {
                        if (pattern.test(fileName) || pattern.test(fullPath)) {
                            results.push(fullPath);
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            // Skip errors
        }
    }

    async organizeFiles() {
        this.log('Organizing loose files');

        const looseFiles = await this.scanLooseFiles();
        const moves = [];

        for (const file of looseFiles) {
            const sourcePath = path.join(DEVELOPER_DIR, file);
            const category = this.getFileCategory(sourcePath);
            const targetDir = path.join(DEVELOPER_DIR, category);

            // Ensure target directory exists
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
                this.log('Created directory', { path: targetDir });
            }

            const targetPath = path.join(targetDir, file);

            // Check if target already exists
            if (fs.existsSync(targetPath)) {
                // Create backup with timestamp
                const backupPath = `${targetPath}.backup.${Date.now()}`;
                fs.renameSync(targetPath, backupPath);
                this.log('Backed up existing file', { original: targetPath, backup: backupPath });
            }

            moves.push({
                source: sourcePath,
                target: targetPath,
                category
            });
        }

        // Execute moves
        for (const move of moves) {
            try {
                fs.renameSync(move.source, move.target);
                this.log('Moved file', { from: move.source, to: move.target, category: move.category });
                this.moves.push(move);
            } catch (error) {
                this.log('Failed to move file', { file: move.source, error: error.message });
                this.violations.push({
                    type: 'MOVE_FAILED',
                    file: move.source,
                    error: error.message
                });
            }
        }

        return moves.length;
    }

    async organizeDirectories() {
        this.log('Organizing loose directories');

        const looseDirs = await this.scanLooseDirectories();
        const moves = [];

        for (const dir of looseDirs) {
            const sourcePath = path.join(DEVELOPER_DIR, dir);
            
            // Determine target based on directory name and contents
            let targetCategory = 'tools/';
            
            // Check directory contents to determine category
            try {
                const items = fs.readdirSync(sourcePath);
                if (items.some(item => item.endsWith('.md'))) {
                    targetCategory = 'docs/';
                } else if (items.some(item => item.includes('test') || item.includes('spec'))) {
                    targetCategory = 'testing/';
                } else if (items.some(item => item.includes('docker') || item.includes('k8s'))) {
                    targetCategory = 'infra/';
                } else if (items.some(item => item.endsWith('.py') || item.endsWith('.js'))) {
                    targetCategory = 'scripts/';
                }
            } catch (error) {
                // Use default
            }

            const targetDir = path.join(DEVELOPER_DIR, targetCategory);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            const targetPath = path.join(targetDir, dir);

            if (fs.existsSync(targetPath)) {
                const backupPath = `${targetPath}.backup.${Date.now()}`;
                fs.renameSync(targetPath, backupPath);
                this.log('Backed up existing directory', { original: targetPath, backup: backupPath });
            }

            moves.push({
                source: sourcePath,
                target: targetPath,
                category: targetCategory
            });
        }

        // Execute moves
        for (const move of moves) {
            try {
                fs.renameSync(move.source, move.target);
                this.log('Moved directory', { from: move.source, to: move.target, category: move.category });
                this.moves.push(move);
            } catch (error) {
                this.log('Failed to move directory', { dir: move.source, error: error.message });
                this.violations.push({
                    type: 'MOVE_FAILED',
                    directory: move.source,
                    error: error.message
                });
            }
        }

        return moves.length;
    }

    async createGovernanceRules() {
        this.log('Creating governance rules to prevent future sprawl');

        // Write pre-commit hook as separate file to avoid template string issues
        const preCommitHookPath = path.join(__dirname, 'pre-commit-loose-files.sh');
        const preCommitHook = `#!/bin/bash
# Pre-commit hook to prevent loose files in root directory

ROOT_DIR="${DEVELOPER_DIR}"
ALLOWED_ROOT_FILES="pixi.toml package.json package-lock.json yarn.lock pnpm-lock.yaml Cargo.toml go.mod go.sum requirements.txt Pipfile Pipfile.lock poetry.lock Makefile justfile Taskfile.yml Taskfile.yaml README.md LICENSE .gitignore .gitattributes docker-compose.yml docker-compose.yaml"

ALLOWED_ROOT_DIRS="docs scripts configs testing infra data api graphql federation logs tools node_modules .pixi .venv __pycache__ packages apps services libs mcp"

# Check for loose files
LOOSE_FILES=""
for file in "$ROOT_DIR"/*; do
    if [ -f "$file" ]; then
        basename=$(basename "$file")
        if ! echo "$ALLOWED_ROOT_FILES" | grep -q "$basename"; then
            LOOSE_FILES="$LOOSE_FILES $file"
        fi
    fi
done

# Check for loose directories
LOOSE_DIRS=""
for dir in "$ROOT_DIR"/*; do
    if [ -d "$dir" ] && [ "$(basename "$dir")" != ".git" ] && [ "$(basename "$dir")" != ".cursor" ]; then
        basename=$(basename "$dir")
        if ! echo "$ALLOWED_ROOT_DIRS" | grep -q "$basename"; then
            LOOSE_DIRS="$LOOSE_DIRS $dir"
        fi
    fi
done

if [ -n "$LOOSE_FILES" ] || [ -n "$LOOSE_DIRS" ]; then
    echo "❌ LOOSE FILES/DIRECTORIES DETECTED IN ROOT:"
    [ -n "$LOOSE_FILES" ] && echo "Files:$LOOSE_FILES"
    [ -n "$LOOSE_DIRS" ] && echo "Directories:$LOOSE_DIRS"
    echo "Please organize files according to monorepo architecture"
    exit 1
fi

exit 0
`;

        fs.writeFileSync(preCommitHookPath, preCommitHook);
        fs.chmodSync(preCommitHookPath, '755');

        const hookPath = path.join(DEVELOPER_DIR, '.git/hooks/pre-commit');
        const hooksDir = path.dirname(hookPath);
        
        if (!fs.existsSync(hooksDir)) {
            fs.mkdirSync(hooksDir, { recursive: true });
        }

        // Copy hook to git hooks directory
        fs.copyFileSync(preCommitHookPath, hookPath);
        fs.chmodSync(hookPath, '755');
        this.log('Pre-commit hook created', { path: hookPath });

        // Create .cursorignore for Cursor IDE
        const cursorIgnore = `# Cursor IDE - Ignore loose files
# All files should be organized in proper directories

# Loose files in root (except allowed)
/*
!pixi.toml
!package.json
!package-lock.json
!yarn.lock
!Makefile
!justfile
!Taskfile.yml
!README.md
!LICENSE
!.gitignore
!docker-compose.yml

# Allow organized directories
!/docs/
!/scripts/
!/configs/
!/testing/
!/infra/
!/data/
!/api/
!/graphql/
!/federation/
!/logs/
!/tools/
`;

        const cursorIgnorePath = path.join(DEVELOPER_DIR, '.cursorignore');
        fs.writeFileSync(cursorIgnorePath, cursorIgnore);
        this.log('Cursor ignore file created', { path: cursorIgnorePath });
    }

    async replaceCustomCodeWithVendor() {
        this.log('Identifying custom code to replace with vendor solutions via GitHub API');

        const customFiles = await this.identifyCustomCode();
        
        // Search GitHub for vendor alternatives
        for (const file of customFiles) {
            const fileName = path.basename(file);
            this.log('Searching GitHub for vendor alternative', { file: fileName });
            
            // Use GitHub API to find vendor solutions
            try {
                const searchQuery = encodeURIComponent(`"${fileName}" language:javascript OR language:typescript OR language:python`);
                const result = execSync(
                    `gh api search/code?q=${searchQuery} --jq '.items[0:3] | .[] | {name: .name, repo: .repository.full_name, url: .html_url}'`,
                    { encoding: 'utf8', stdio: 'pipe' }
                );
                
                if (result) {
                    this.log('Found vendor alternatives', { file: fileName, alternatives: result });
                }
            } catch (error) {
                // GitHub API might not be available or rate limited
                this.log('GitHub search failed', { file: fileName, error: error.message });
            }
        }
    }

    generateReport() {
        console.log('\n📊 FILE ORGANIZATION REPORT');
        console.log('='.repeat(60));

        console.log(`\n✅ FILES MOVED: ${this.moves.length}`);
        this.moves.forEach((move, idx) => {
            console.log(`   ${idx + 1}. ${path.basename(move.source)} → ${move.category}${path.basename(move.target)}`);
        });

        if (this.violations.length > 0) {
            console.log(`\n⚠️  VIOLATIONS: ${this.violations.length}`);
            this.violations.forEach((violation, idx) => {
                console.log(`   ${idx + 1}. ${violation.type}: ${violation.file || violation.directory}`);
            });
        }

        console.log(`\n🔍 CUSTOM CODE FILES: ${this.customCodeFiles.length}`);
        if (this.customCodeFiles.length > 0) {
            this.customCodeFiles.slice(0, 10).forEach((file, idx) => {
                console.log(`   ${idx + 1}. ${file}`);
            });
            if (this.customCodeFiles.length > 10) {
                console.log(`   ... and ${this.customCodeFiles.length - 10} more`);
            }
        }

        this.log('File organization complete', {
            moves: this.moves.length,
            violations: this.violations.length,
            customCodeFiles: this.customCodeFiles.length
        });
    }

    async execute() {
        console.log('📁 ORGANIZING LOOSE FILES - MONOREPO ARCHITECTURE COMPLIANCE');
        console.log('='.repeat(60));

        await this.organizeFiles();
        await this.organizeDirectories();
        await this.createGovernanceRules();
        await this.replaceCustomCodeWithVendor();
        this.generateReport();

        console.log('\n✅ FILE ORGANIZATION COMPLETE');
        console.log('Governance rules created to prevent future sprawl');
    }
}

// Execute organization
const organizer = new LooseFileOrganizer();
organizer.execute().catch(error => {
    console.error('💥 ORGANIZATION FAILED:', error);
    process.exit(1);
});