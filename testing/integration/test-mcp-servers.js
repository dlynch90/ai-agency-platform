// MCP Server Testing Script
// Validates all configured MCP servers for Cursor IDE integration

const { spawn } = require('child_process');
const fs = require('fs');

const mcpConfig = JSON.parse(fs.readFileSync('/Users/daniellynch/.cursor/mcp.json', 'utf8'));
const results = {};

async function testMcpServer(serverName, config) {
  return new Promise((resolve) => {
    console.log(`Testing ${serverName}...`);

    const child = spawn(config.command, config.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...config.env },
      timeout: 5000
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      const success = code === 0 && !errorOutput.includes('Error') && !errorOutput.includes('failed');
      results[serverName] = {
        status: success ? 'WORKING' : 'FAILED',
        exitCode: code,
        output: output.substring(0, 200), // Limit output
        error: errorOutput.substring(0, 200),
        command: `${config.command} ${config.args.join(' ')}`
      };
      resolve();
    });

    child.on('error', (error) => {
      results[serverName] = {
        status: 'ERROR',
        error: error.message,
        command: `${config.command} ${config.args.join(' ')}`
      };
      resolve();
    });

    // Timeout after 3 seconds
    setTimeout(() => {
      child.kill();
      results[serverName] = {
        status: 'TIMEOUT',
        command: `${config.command} ${config.args.join(' ')}`
      };
      resolve();
    }, 3000);
  });
}

async function runAllTests() {
  console.log('🚀 Starting MCP Server Validation...\n');

  const testPromises = Object.entries(mcpConfig.mcpServers).map(([name, config]) =>
    testMcpServer(name, config)
  );

  await Promise.all(testPromises);

  console.log('\n📊 MCP SERVER TEST RESULTS:\n');

  let working = 0;
  let failed = 0;

  Object.entries(results).forEach(([name, result]) => {
    const status = result.status === 'WORKING' ? '✅' : result.status === 'TIMEOUT' ? '⏱️' : '❌';
    console.log(`${status} ${name}: ${result.status}`);

    if (result.status === 'WORKING') working++;
    else failed++;

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log(`\n📈 SUMMARY: ${working} working, ${failed} failed`);
  console.log(`🎯 Success Rate: ${((working / (working + failed)) * 100).toFixed(1)}%`);

  // Save results
  fs.writeFileSync('/Users/daniellynch/Developer/mcp-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Results saved to mcp-test-results.json');
}

runAllTests().catch(console.error);