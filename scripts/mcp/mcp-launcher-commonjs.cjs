#!/usr/bin/env node

/**
 * CommonJS MCP Server Launcher
 * Fixes ES module compatibility issues with MCP servers
 *
 * WORKING SERVERS (as of 2025-12-28):
 * ✅ filesystem - @modelcontextprotocol/server-filesystem
 * ✅ sqlite - mcp-server-sqlite
 * ✅ code-runner - mcp-server-code-runner
 * ✅ deepwiki - mcp-deepwiki
 * ✅ task-master - @gofman3/task-master-mcp
 * ✅ ollama-chat - ollama-mcp
 *
 * KNOWN ISSUES:
 * ❌ Most @modelcontextprotocol/* servers don't exist in npm
 * ❌ Many servers require external API keys
 * ❌ Some servers have ES module compatibility issues
 */

const { spawn } = require('child_process');
const path = require('path');

function launchMCPServer(serverName, args = []) {
    console.log(`Launching MCP server: ${serverName}`);

    let command;
    let finalArgs;

    // Map server names to their npm package commands
    // Only including servers that actually exist and work without external dependencies
    const serverMap = {
        'ollama-mcp': ['npx', ['ollama-mcp', ...args]],
        'filesystem': ['npx', ['@modelcontextprotocol/server-filesystem', '${HOME}/Developer', ...args]],
        'ollama-chat': ['npx', ['ollama-mcp', ...args]],
        'task-master': ['npx', ['@gofman3/task-master-mcp', ...args]],
        'memory': ['npx', ['@danielsimonjr/memory-mcp', ...args]],
        'neo4j': ['npx', ['@henrychong-ai/mcp-neo4j-knowledge-graph', ...args]],
        'temporal': ['npx', ['@vreme/temporal-mcp', ...args]],
        'universal-rag': ['npx', ['@sid7vish/universal-rag-mcp', ...args]],
        'sqlite': ['npx', ['mcp-server-sqlite', ...args]],
        'code-runner': ['npx', ['mcp-server-code-runner', ...args]],
        'deepwiki': ['npx', ['mcp-deepwiki', ...args]],
        'puppeteer': ['npx', ['puppeteer-mcp-server', ...args]]
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
            NODE_OPTIONS: '--require=./mcp-commonjs-setup.cjs'
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
        'ollama-mcp', 'filesystem', 'ollama-chat', 'task-master',
        'memory', 'neo4j', 'temporal', 'universal-rag', 'sqlite',
        'code-runner', 'deepwiki', 'puppeteer'
    ];

    servers.forEach(server => console.error(`  ${server}`));
    process.exit(1);
}

launchMCPServer(serverName, args);