#!/usr/bin/env node

/**
 * CommonJS MCP Server Launcher
 * Fixes ES module compatibility issues with MCP servers
 */

const { spawn } = require('child_process');
const path = require('path');

function launchMCPServer(serverName, args = []) {
    console.log(`Launching MCP server: ${serverName}`);

    let command;
    let finalArgs;

    // Map server names to their npm package commands
    const serverMap = {
        'ollama-mcp': ['npx', ['ollama-mcp', ...args]],
        'filesystem': ['npx', ['@modelcontextprotocol/server-filesystem', ...args]],
        'git': ['npx', ['@modelcontextprotocol/server-git', '--repository', process.cwd(), ...args]],
        'sequential-thinking': ['npx', ['@modelcontextprotocol/server-sequential-thinking', ...args]],
        'anthropic': ['npx', ['@modelcontextprotocol/server-anthropic', ...args]],
        'openai': ['npx', ['@modelcontextprotocol/server-openai', ...args]],
        'huggingface': ['npx', ['@modelcontextprotocol/server-huggingface', ...args]],
        'replicate': ['npx', ['@modelcontextprotocol/server-replicate', ...args]],
        'modal': ['npx', ['@modelcontextprotocol/server-modal', ...args]],
        'langchain': ['npx', ['@modelcontextprotocol/server-langchain', ...args]],
        'llamaindex': ['npx', ['@modelcontextprotocol/server-llamaindex', ...args]],
        'qdrant': ['npx', ['@modelcontextprotocol/server-qdrant', ...args]],
        'weaviate': ['npx', ['@modelcontextprotocol/server-weaviate', ...args]],
        'chroma': ['npx', ['@modelcontextprotocol/server-chroma', ...args]],
        'pinecone': ['npx', ['@modelcontextprotocol/server-pinecone', ...args]],
        'aws': ['npx', ['@modelcontextprotocol/server-aws', ...args]],
        'azure': ['npx', ['@modelcontextprotocol/server-azure', ...args]],
        'gcp': ['npx', ['@modelcontextprotocol/server-gcp', ...args]],
        'vercel': ['npx', ['@modelcontextprotocol/server-vercel', ...args]],
        'supabase': ['npx', ['@modelcontextprotocol/server-supabase', ...args]],
        'clerk': ['npx', ['@modelcontextprotocol/server-clerk', ...args]],
        'task-master': ['npx', ['@gofman3/task-master-mcp', ...args]],
        'memory': ['npx', ['@danielsimonjr/memory-mcp', ...args]],
        'neo4j': ['npx', ['@henrychong-ai/mcp-neo4j-knowledge-graph', ...args]],
        'ollama-chat': ['npx', ['ollama-mcp', ...args]],
        'github-copilot': ['npx', ['@ama-mcp/github', ...args]],
        'temporal': ['npx', ['@vreme/temporal-mcp', ...args]],
        'context7': ['npx', ['@upstash/context7-mcp', ...args]],
        'ref-tools': ['npx', ['ref-tools-mcp', ...args]],
        'firecrawl': ['npx', ['firecrawl-mcp', ...args]],
        'universal-rag': ['npx', ['@sid7vish/universal-rag-mcp', ...args]],
        'n8n': ['npx', ['n8n-mcp', ...args]],
        'notion': ['npx', ['@notionhq/notion-mcp-server', ...args]],
        'playwright': ['npx', ['@playwright/mcp', ...args]],
        'docker': ['npx', ['docker-mcp-server', ...args]],
        'kubernetes': ['npx', ['kubernetes-mcp-server', ...args]],
        'sqlite': ['npx', ['mcp-server-sqlite', ...args]],
        'code-runner': ['npx', ['mcp-server-code-runner', ...args]],
        'deepwiki': ['npx', ['mcp-deepwiki', ...args]],
        'puppeteer': ['npx', ['puppeteer-mcp-server', ...args]],
        'slack': ['npx', ['slack-mcp-server', ...args]],
        'excalidraw': ['npx', ['@szjc/szjc-mcp-server', ...args]],
        'xcode': ['npx', ['xcodebuildmcp', ...args]]
    };

    if (!serverMap[serverName]) {
        console.error(`Unknown MCP server: ${serverName}`);
        console.error(`Available servers: ${Object.keys(serverMap).join(', ')}`);
        process.exit(1);
    }

    [command, finalArgs] = serverMap[serverName];

    console.log(`Executing: ${command} ${finalArgs.join(' ')}`);

    const child = spawn(command, finalArgs, {
        stdio: 'inherit',
        env: {
            ...process.env,
            // Ensure CommonJS compatibility
            NODE_OPTIONS: '--require=./mcp-commonjs-setup.js'
        },
        cwd: process.cwd()
    });

    child.on('close', (code) => {
        console.log(`MCP server ${serverName} exited with code ${code}`);
        process.exit(code);
    });

    child.on('error', (error) => {
        console.error(`Failed to start MCP server ${serverName}:`, error);
        process.exit(1);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log(`Shutting down MCP server ${serverName}...`);
        child.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
        console.log(`Terminating MCP server ${serverName}...`);
        child.kill('SIGTERM');
    });
}

// Main execution
const serverName = process.argv[2];
const args = process.argv.slice(3);

if (!serverName) {
    console.error('Usage: node mcp-launcher-commonjs.js <server-name> [args...]');
    console.error('');
    console.error('Available servers:');
    const servers = [
        'ollama-mcp', 'filesystem', 'git', 'sequential-thinking',
        'anthropic', 'openai', 'huggingface', 'replicate', 'modal',
        'langchain', 'llamaindex', 'qdrant', 'weaviate', 'chroma',
        'pinecone', 'aws', 'azure', 'gcp', 'vercel', 'supabase',
        'clerk', 'task-master', 'memory', 'neo4j', 'ollama-chat',
        'github-copilot', 'temporal', 'context7', 'ref-tools',
        'firecrawl', 'universal-rag', 'n8n', 'notion', 'playwright',
        'docker', 'kubernetes', 'sqlite', 'code-runner', 'deepwiki',
        'puppeteer', 'slack', 'excalidraw', 'xcode'
    ];

    servers.forEach(server => console.error(`  ${server}`));
    process.exit(1);
}

launchMCPServer(serverName, args);