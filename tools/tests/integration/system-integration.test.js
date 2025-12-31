const axios = require('axios');

describe('System Integration Tests', () => {
  test('Event Bus connectivity', async () => {
    // Test Kafka connectivity
    try {
      const response = await axios.get('http://localhost:9092', { timeout: 5000 });
      expect(response.status).toBeDefined();
    } catch (error) {
      // Kafka doesn't have HTTP endpoint, check if port is open
      const net = require('net');
      const client = net.createConnection({ port: 9092, host: 'localhost' });
      await new Promise((resolve, reject) => {
        client.on('connect', () => {
          client.end();
          resolve();
        });
        client.on('error', reject);
      });
    }
  });

  test('Cipher MCP server health', async () => {
    const response = await axios.get('http://localhost:3001/health', { timeout: 5000 });
    expect(response.status).toBe(200);
  });

  test('MCP server count', async () => {
    const { execSync } = require('child_process');
    const output = execSync('./scripts/event-driven-integration.sh check').toString();
    const mcpMatch = output.match(/MCP Servers: (\d+)\/(\d+)/);
    expect(mcpMatch).toBeTruthy();
    const running = parseInt(mcpMatch[1]);
    const total = parseInt(mcpMatch[2]);
    expect(running).toBeGreaterThanOrEqual(14); // At least 80% of servers
  });

  test('CLI tool availability', async () => {
    const { execSync } = require('child_process');
    const output = execSync('./scripts/event-driven-integration.sh check').toString();
    const cliMatch = output.match(/CLI Tools: (\d+)\/(\d+)/);
    expect(cliMatch).toBeTruthy();
    const available = parseInt(cliMatch[1]);
    const total = parseInt(cliMatch[2]);
    expect(available).toBeGreaterThanOrEqual(18); // At least 90% of tools
  });
});
