#!/bin/bash

echo "Testing MCP server connectivity..."

# Test npx availability
echo "Testing npx..."
which npx
npx --version

# Test 1Password CLI
echo "Testing 1Password CLI..."
which op
op --version 2>/dev/null || echo "op command failed"

# Test a simple MCP server
echo "Testing GitHub MCP server..."
timeout 10s npx github-mcp --help 2>&1 || echo "GitHub MCP test failed"

# Test environment variables
echo "Environment PATH: $PATH"
echo "NPM config:"
npm config list --global 2>/dev/null || echo "npm config failed"

echo "Test complete"
