#!/bin/bash

# MCP Server Testing using Playwright
# Vendor solution for automated testing

set -e

echo "🧪 MCP Server Testing with Playwright"
echo "======================================"

# Check if Playwright is installed
if ! command -v npx playwright --version >/dev/null 2>&1; then
    echo "❌ Playwright not found. Installing..."
    npm install -g @playwright/test
    npx playwright install
fi

echo "✅ Playwright found: $(npx playwright --version)"

# Create test configuration
cat > playwright-mcp-test.config.js << 'EOF'
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  use: {
    headless: true,
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'mcp-servers',
      testMatch: '**/*.mcp.test.js',
    },
  ],
});
EOF

# Create MCP server test
cat > tests/mcp-servers.test.js << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('MCP Server Integration Tests', () => {
  test('Filesystem MCP Server', async ({ page }) => {
    // Test filesystem MCP server connectivity
    const response = await page.request.post('/api/mcp/filesystem', {
      data: { action: 'list', path: '.' }
    });
    expect(response.ok()).toBeTruthy();
  });

  test('Task Master MCP Server', async ({ page }) => {
    // Test task master MCP server
    const response = await page.request.post('/api/mcp/task-master', {
      data: { action: 'list' }
    });
    expect(response.ok()).toBeTruthy();
  });

  test('Database MCP Servers', async ({ page }) => {
    // Test SQLite MCP server
    const sqliteResponse = await page.request.post('/api/mcp/sqlite', {
      data: { action: 'query', sql: 'SELECT 1' }
    });
    expect(sqliteResponse.ok()).toBeTruthy();
  });
});
EOF

# Run Playwright tests
echo "Running MCP server tests..."
npx playwright test --config playwright-mcp-test.config.js

echo "✅ MCP server testing completed with Playwright"
