#!/usr/bin/env node

/**
 * VENDOR REPLACEMENT VIA GITHUB API
 * Replaces custom code with vendor solutions from GitHub
 * Syncs with GitHub API to find approved vendor alternatives
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEVELOPER_DIR = process.env.DEVELOPER_DIR || path.join(process.env.HOME, 'Developer');
const LOG_FILE = path.join(DEVELOPER_DIR, '.cursor/debug.log');

class VendorReplacementSystem {
    constructor() {
        this.ensureLogDirectory();
        this.replacements = [];
        this.vendorRegistry = {};
    }

    ensureLogDirectory() {
        const logDir = path.dirname(LOG_FILE);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    log(message, data = {}) {
        const entry = {
            id: `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            location: 'vendor-replacement-via-github.mjs',
            message,
            data,
            sessionId: 'vendor-replacement',
            hypothesisId: 'VENDOR_REPLACEMENT'
        };

        const logLine = JSON.stringify(entry) + '\n';
        fs.appendFileSync(LOG_FILE, logLine);
        console.log(`🔄 ${message}`);
    }

    async syncVendorRegistryFromGitHub() {
        this.log('Syncing vendor registry from GitHub API');

        try {
            // Search for approved vendor solutions
            const vendors = [
                'lodash', 'ramda', 'axios', 'date-fns', 'moment',
                'react-query', 'zustand', 'jotai', 'recoil',
                'prisma', 'typeorm', 'sequelize', 'drizzle-orm',
                'tailwindcss', 'radix-ui', 'shadcn', 'chakra-ui',
                'next-auth', 'clerk', 'auth0', 'supabase',
                'langchain', 'langgraph', 'ollama', 'openai',
                'redis', 'ioredis', 'bull', 'agenda',
                'celery', 'dramatiq', 'rq', 'bullmq'
            ];

            const registry = {};
            for (const vendor of vendors) {
                try {
                    const result = execSync(
                        `gh api search/repositories?q=${encodeURIComponent(`language:typescript OR language:javascript ${vendor} stars:>1000`)} --jq '.items[0:3] | .[] | {name: .name, full_name: .full_name, stars: .stargazers_count, url: .html_url}'`,
                        { encoding: 'utf8', stdio: 'pipe', timeout: 5000 }
                    );
                    registry[vendor] = JSON.parse(`[${result.split('\n').filter(l => l.trim()).join(',')}]`);
                    this.log('Found vendor alternatives', { vendor, count: registry[vendor].length });
                } catch (error) {
                    this.log('Vendor search failed', { vendor, error: error.message });
                }
            }

            // Save registry
            const registryPath = path.join(DEVELOPER_DIR, 'configs/vendor-registry.json');
            fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
            this.log('Vendor registry saved', { path: registryPath, vendors: Object.keys(registry).length });

            this.vendorRegistry = registry;
            return registry;
        } catch (error) {
            this.log('Vendor registry sync failed', { error: error.message });
            return {};
        }
    }

    async identifyCustomCode() {
        this.log('Identifying custom code to replace');

        const customPatterns = [
            /^custom/i,
            /util\.(js|ts|py)$/i,
            /helper\.(js|ts|py)$/i,
            /^my[A-Z]/,
            /^local[A-Z]/
        ];

        const customFiles = [];
        const scanDirs = ['scripts', 'tools', 'libs', 'packages', 'services'];

        for (const dir of scanDirs) {
            const dirPath = path.join(DEVELOPER_DIR, dir);
            if (fs.existsSync(dirPath)) {
                this.scanForCustomCode(dirPath, customPatterns, customFiles);
            }
        }

        this.log('Custom code identified', { count: customFiles.length });
        return customFiles;
    }

    scanForCustomCode(dirPath, patterns, results) {
        try {
            const items = fs.readdirSync(dirPath);
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !item.startsWith('.') && !item.includes('node_modules')) {
                    this.scanForCustomCode(fullPath, patterns, results);
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

    async generateReplacementPlan() {
        this.log('Generating vendor replacement plan');

        const customFiles = await this.identifyCustomCode();
        const plan = [];

        for (const file of customFiles) {
            const content = fs.readFileSync(file, 'utf8');
            const fileName = path.basename(file);

            // Analyze file to determine what vendor solution to use
            let vendorSuggestion = null;

            if (content.includes('fetch') || content.includes('axios') || content.includes('http')) {
                vendorSuggestion = 'axios';
            } else if (content.includes('date') || content.includes('Date') || content.includes('time')) {
                vendorSuggestion = 'date-fns';
            } else if (content.includes('state') || content.includes('useState') || content.includes('store')) {
                vendorSuggestion = 'zustand';
            } else if (content.includes('database') || content.includes('db') || content.includes('query')) {
                vendorSuggestion = 'prisma';
            } else if (content.includes('cache') || content.includes('redis')) {
                vendorSuggestion = 'ioredis';
            }

            if (vendorSuggestion && this.vendorRegistry[vendorSuggestion]) {
                plan.push({
                    file,
                    fileName,
                    vendor: vendorSuggestion,
                    alternatives: this.vendorRegistry[vendorSuggestion],
                    recommendation: this.vendorRegistry[vendorSuggestion][0]
                });
            }
        }

        this.log('Replacement plan generated', { replacements: plan.length });
        return plan;
    }

    async execute() {
        console.log('🔄 VENDOR REPLACEMENT VIA GITHUB API');
        console.log('='.repeat(60));

        await this.syncVendorRegistryFromGitHub();
        const plan = await this.generateReplacementPlan();

        console.log('\n📋 VENDOR REPLACEMENT PLAN:');
        plan.forEach((item, idx) => {
            console.log(`\n${idx + 1}. ${item.fileName}`);
            console.log(`   File: ${item.file}`);
            console.log(`   Recommended Vendor: ${item.vendor}`);
            if (item.recommendation) {
                console.log(`   Top Alternative: ${item.recommendation.full_name} (${item.recommendation.stars} stars)`);
                console.log(`   URL: ${item.recommendation.url}`);
            }
        });

        // Save plan
        const planPath = path.join(DEVELOPER_DIR, 'configs/vendor-replacement-plan.json');
        fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
        this.log('Replacement plan saved', { path: planPath });

        console.log(`\n✅ Vendor replacement plan generated: ${planPath}`);
    }
}

// Execute
const replacer = new VendorReplacementSystem();
replacer.execute().catch(error => {
    console.error('💥 VENDOR REPLACEMENT FAILED:', error);
    process.exit(1);
});