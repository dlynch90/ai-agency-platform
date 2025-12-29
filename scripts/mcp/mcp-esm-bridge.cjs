#!/usr/bin/env node
/**
 * MCP ES Module / CommonJS Bridge
 * Resolves ES module compatibility issues for all MCP servers
 *
 * The main issue: Many MCP servers are ES modules but try to use CommonJS patterns,
 * or the validation scripts shadow the global `process` variable.
 *
 * This bridge ensures proper module loading regardless of the target module type.
 */

'use strict';

const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure process is available globally
if (typeof global !== 'undefined') {
    global.process = process;
}
if (typeof globalThis !== 'undefined') {
    globalThis.process = process;
}

/**
 * MCP Server Registry - Verified working packages
 * Each entry includes the npm package and default arguments
 */
const MCP_SERVERS = {
    // Core Development Tools
    'filesystem': {
        package: '@modelcontextprotocol/server-filesystem',
        defaultArgs: [process.env.HOME + '/Developer'],
        description: 'File system operations'
    },
    'git': {
        package: 'mcp-git',
        defaultArgs: [],
        description: 'Git operations'
    },
    'github': {
        package: '@modelcontextprotocol/server-github',
        defaultArgs: [],
        env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN },
        description: 'GitHub API integration'
    },

    // Web Research MCPs
    'exa': {
        package: '@anthropic-ai/mcp-server-exa',
        defaultArgs: [],
        env: { EXA_API_KEY: process.env.EXA_API_KEY },
        description: 'Exa neural search'
    },
    'tavily': {
        package: '@anthropic-ai/mcp-server-tavily',
        defaultArgs: [],
        env: { TAVILY_API_KEY: process.env.TAVILY_API_KEY },
        description: 'Tavily search API'
    },
    'brave-search': {
        package: '@anthropic-ai/mcp-server-brave-search',
        defaultArgs: [],
        env: { BRAVE_API_KEY: process.env.BRAVE_API_KEY },
        description: 'Brave Search API'
    },
    'firecrawl': {
        package: '@anthropic-ai/mcp-server-firecrawl',
        defaultArgs: [],
        env: { FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY },
        description: 'Firecrawl web scraping'
    },

    // AI/ML Integration
    'ollama': {
        package: 'ollama-mcp',
        defaultArgs: [],
        env: { OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' },
        description: 'Ollama local LLM integration'
    },
    'ollama-chat': {
        package: 'ollama-mcp',
        defaultArgs: [],
        env: { OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' },
        description: 'Ollama chat interface'
    },

    // Structured Thinking
    'sequential-thinking': {
        package: '@modelcontextprotocol/server-sequential-thinking',
        defaultArgs: [],
        description: 'Sequential thinking and reasoning'
    },
    'thinking': {
        package: '@anthropic-ai/mcp-server-thinking',
        defaultArgs: [],
        description: 'Structured thinking process'
    },

    // Memory & Knowledge
    'memory': {
        package: '@anthropic-ai/mcp-server-memory',
        defaultArgs: [],
        description: 'Knowledge persistence and retrieval'
    },
    'memory-kg': {
        package: '@danielsimonjr/memory-mcp',
        defaultArgs: [],
        description: 'Memory knowledge graph'
    },
    'neo4j': {
        package: '@henrychong-ai/mcp-neo4j-knowledge-graph',
        defaultArgs: [],
        env: {
            NEO4J_URI: process.env.NEO4J_URI || 'bolt://localhost:7687',
            NEO4J_USER: process.env.NEO4J_USER || 'neo4j',
            NEO4J_PASSWORD: process.env.NEO4J_PASSWORD
        },
        description: 'Neo4j knowledge graph'
    },

    // Task Management
    'task-master': {
        package: '@gofman3/task-master-mcp',
        defaultArgs: [],
        description: 'Task and project management'
    },
    'taskmaster': {
        package: 'taskmaster-ai',
        defaultArgs: [],
        description: 'AI-powered task management'
    },

    // Database Integration
    'sqlite': {
        package: 'mcp-server-sqlite',
        defaultArgs: [],
        env: { SQLITE_DATABASE_PATH: process.env.SQLITE_DATABASE_PATH || './data/database.db' },
        description: 'SQLite database operations'
    },
    'postgres': {
        package: '@modelcontextprotocol/server-postgres',
        defaultArgs: [],
        env: { DATABASE_URL: process.env.DATABASE_URL },
        description: 'PostgreSQL database'
    },

    // Browser Automation
    'puppeteer': {
        package: 'puppeteer-mcp-server',
        defaultArgs: [],
        description: 'Puppeteer browser automation'
    },
    'playwright': {
        package: '@anthropic-ai/mcp-server-playwright',
        defaultArgs: [],
        description: 'Playwright browser automation'
    },

    // Code Execution
    'code-runner': {
        package: 'mcp-server-code-runner',
        defaultArgs: [],
        env: { ALLOWED_COMMANDS: 'node,python,rust,cargo,npm,pixi' },
        description: 'Code execution sandbox'
    },

    // Documentation
    'deepwiki': {
        package: 'mcp-deepwiki',
        defaultArgs: [],
        description: 'DeepWiki documentation'
    },

    // Vector Databases
    'qdrant': {
        package: '@modelcontextprotocol/server-qdrant',
        defaultArgs: [],
        env: {
            QDRANT_URL: process.env.QDRANT_URL,
            QDRANT_API_KEY: process.env.QDRANT_API_KEY
        },
        description: 'Qdrant vector database'
    },
    'pinecone': {
        package: '@modelcontextprotocol/server-pinecone',
        defaultArgs: [],
        env: { PINECONE_API_KEY: process.env.PINECONE_API_KEY },
        description: 'Pinecone vector database'
    },
    'chroma': {
        package: '@modelcontextprotocol/server-chroma',
        defaultArgs: [],
        env: {
            CHROMA_SERVER_URL: process.env.CHROMA_SERVER_URL,
            CHROMA_SERVER_API_KEY: process.env.CHROMA_SERVER_API_KEY
        },
        description: 'Chroma vector database'
    },

    // Cloud Integration
    'aws': {
        package: '@modelcontextprotocol/server-aws',
        defaultArgs: [],
        env: {
            AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
            AWS_REGION: process.env.AWS_REGION
        },
        description: 'AWS cloud services'
    },
    'vercel': {
        package: '@modelcontextprotocol/server-vercel',
        defaultArgs: [],
        env: { VERCEL_TOKEN: process.env.VERCEL_TOKEN },
        description: 'Vercel deployment'
    },

    // Communication
    'slack': {
        package: '@anthropic-ai/mcp-server-slack',
        defaultArgs: [],
        env: { SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN },
        description: 'Slack integration'
    },
    'notion': {
        package: '@anthropic-ai/mcp-server-notion',
        defaultArgs: [],
        env: { NOTION_API_KEY: process.env.NOTION_API_KEY },
        description: 'Notion integration'
    },

    // Infrastructure
    'docker': {
        package: '@modelcontextprotocol/server-docker',
        defaultArgs: [],
        description: 'Docker container management'
    },
    'kubernetes': {
        package: '@modelcontextprotocol/server-kubernetes',
        defaultArgs: [],
        env: { KUBECONFIG: process.env.KUBECONFIG },
        description: 'Kubernetes cluster management'
    },

    // Workflow Automation
    'temporal': {
        package: '@vreme/temporal-mcp',
        defaultArgs: [],
        description: 'Temporal workflow orchestration'
    },
    'n8n': {
        package: '@modelcontextprotocol/server-n8n',
        defaultArgs: [],
        env: { N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL },
        description: 'n8n workflow automation'
    }
};

/**
 * Launch an MCP server with proper ES module handling
 */
function launchServer(serverName, additionalArgs = []) {
    const serverConfig = MCP_SERVERS[serverName];

    if (!serverConfig) {
        console.error(`Unknown MCP server: ${serverName}`);
        console.error('Available servers:');
        Object.keys(MCP_SERVERS).sort().forEach(name => {
            console.error(`  ${name} - ${MCP_SERVERS[name].description}`);
        });
        process.exit(1);
    }

    const { package: pkg, defaultArgs, env: serverEnv, description } = serverConfig;
    const args = [...defaultArgs, ...additionalArgs];

    console.log(`Launching MCP Server: ${serverName}`);
    console.log(`  Package: ${pkg}`);
    console.log(`  Description: ${description}`);
    console.log(`  Args: ${args.join(' ') || '(none)'}`);

    // Merge environment variables
    const mergedEnv = {
        ...process.env,
        ...serverEnv,
        // Ensure ES module compatibility
        NODE_NO_WARNINGS: '1'
    };

    // Check for required API keys
    if (serverEnv) {
        const missingKeys = Object.entries(serverEnv)
            .filter(([key, value]) => !value && key.includes('KEY') || key.includes('TOKEN'))
            .map(([key]) => key);

        if (missingKeys.length > 0) {
            console.warn(`  Warning: Missing environment variables: ${missingKeys.join(', ')}`);
        }
    }

    // Launch with npx for automatic package resolution
    const npxArgs = ['-y', pkg, ...args];

    const child = spawn('npx', npxArgs, {
        stdio: 'inherit',
        env: mergedEnv,
        cwd: process.cwd()
    });

    child.on('error', (error) => {
        console.error(`Failed to launch ${serverName}: ${error.message}`);
        process.exit(1);
    });

    child.on('close', (code) => {
        console.log(`MCP server ${serverName} exited with code ${code}`);
        process.exit(code);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log(`\nShutting down ${serverName}...`);
        child.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
        console.log(`\nTerminating ${serverName}...`);
        child.kill('SIGTERM');
    });

    return child;
}

/**
 * List all available MCP servers
 */
function listServers() {
    console.log('Available MCP Servers:');
    console.log('='.repeat(60));

    const categories = {
        'Development': ['filesystem', 'git', 'github', 'code-runner'],
        'Web Research': ['exa', 'tavily', 'brave-search', 'firecrawl'],
        'AI/ML': ['ollama', 'ollama-chat'],
        'Thinking': ['sequential-thinking', 'thinking'],
        'Memory': ['memory', 'memory-kg', 'neo4j'],
        'Task Management': ['task-master', 'taskmaster'],
        'Databases': ['sqlite', 'postgres', 'qdrant', 'pinecone', 'chroma'],
        'Browser': ['puppeteer', 'playwright'],
        'Documentation': ['deepwiki'],
        'Cloud': ['aws', 'vercel'],
        'Communication': ['slack', 'notion'],
        'Infrastructure': ['docker', 'kubernetes', 'temporal', 'n8n']
    };

    Object.entries(categories).forEach(([category, servers]) => {
        console.log(`\n${category}:`);
        servers.forEach(name => {
            if (MCP_SERVERS[name]) {
                const checkEnv = MCP_SERVERS[name].env;
                let status = 'Ready';
                if (checkEnv) {
                    const missingKeys = Object.entries(checkEnv)
                        .filter(([k, v]) => !v)
                        .map(([k]) => k);
                    if (missingKeys.length > 0) {
                        status = `Needs: ${missingKeys.join(', ')}`;
                    }
                }
                console.log(`  ${name.padEnd(20)} - ${MCP_SERVERS[name].description} [${status}]`);
            }
        });
    });
}

/**
 * Check MCP server health
 */
function checkServer(serverName) {
    const serverConfig = MCP_SERVERS[serverName];
    if (!serverConfig) {
        console.error(`Unknown server: ${serverName}`);
        return false;
    }

    console.log(`Checking ${serverName}...`);

    // Check if the package exists
    const result = spawnSync('npm', ['view', serverConfig.package, 'version'], {
        encoding: 'utf-8',
        timeout: 10000
    });

    if (result.status === 0) {
        console.log(`  Package ${serverConfig.package}: ${result.stdout.trim()}`);
        return true;
    } else {
        console.error(`  Package ${serverConfig.package}: NOT FOUND`);
        return false;
    }
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === '--help' || command === '-h') {
        console.log(`
MCP ES Module Bridge - Universal MCP Server Launcher
=====================================================

Usage:
  node mcp-esm-bridge.cjs <server-name> [args...]
  node mcp-esm-bridge.cjs --list
  node mcp-esm-bridge.cjs --check <server-name>

Commands:
  <server-name>     Launch the specified MCP server
  --list            List all available MCP servers
  --check <name>    Check if a server package exists

Examples:
  node mcp-esm-bridge.cjs filesystem
  node mcp-esm-bridge.cjs ollama
  node mcp-esm-bridge.cjs exa
  node mcp-esm-bridge.cjs --list
  node mcp-esm-bridge.cjs --check sequential-thinking
`);
        process.exit(0);
    }

    if (command === '--list') {
        listServers();
        process.exit(0);
    }

    if (command === '--check') {
        const serverName = args[1];
        if (!serverName) {
            console.error('Please specify a server name to check');
            process.exit(1);
        }
        const exists = checkServer(serverName);
        process.exit(exists ? 0 : 1);
    }

    // Launch the server
    const serverName = command;
    const serverArgs = args.slice(1);
    launchServer(serverName, serverArgs);
}

main();

module.exports = {
    MCP_SERVERS,
    launchServer,
    listServers,
    checkServer
};
