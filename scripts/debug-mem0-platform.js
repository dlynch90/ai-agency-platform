#!/usr/bin/env node

// Debug script for Mem0 Platform API integration and memory operations
import { execSync } from 'child_process';
import fs from 'fs';

// #region agent log
const logEntry = JSON.stringify({
  location: 'scripts/debug-mem0-platform.js:6',
  message: 'Starting Mem0 Platform API debug',
  data: { timestamp: Date.now() },
  timestamp: Date.now(),
  sessionId: 'debug-mem0-platform',
  runId: 'platform-debug',
  hypothesisId: 'A'
}) + '\n';
try {
  fs.appendFileSync('${HOME}/Developer/.cursor/debug.log', logEntry);
} catch (e) {
  console.error('Failed to write debug log:', e.message);
}
// #endregion

// Test mem0ai package installation in virtual environment
console.log('=== TESTING MEM0AI PACKAGE ===');

let mem0aiInstalled = false;
const venvPython = '${HOME}/Developer/venv-mcp/bin/python3';

try {
  execSync(`${venvPython} -c "import mem0ai; print('mem0ai version:', mem0ai.__version__)"`, { stdio: 'inherit' });
  mem0aiInstalled = true;
  console.log('✅ mem0ai package available in virtual environment');
} catch (e) {
  console.log('❌ mem0ai package not available in virtual environment');
  console.log('Installing mem0ai in venv...');
  try {
    execSync(`source ${HOME}/Developer/venv-mcp/bin/activate && python3 -m pip install mem0ai`, { stdio: 'inherit', shell: '/bin/bash' });
    mem0aiInstalled = true;
    console.log('✅ mem0ai installed in virtual environment');
  } catch (installError) {
    console.log('❌ Failed to install mem0ai in venv:', installError.message);
  }
}

// #region agent log
const packageLog = JSON.stringify({
  location: 'scripts/debug-mem0-platform.js:45',
  message: 'Mem0ai package installation check',
  data: { mem0aiInstalled: mem0aiInstalled },
  timestamp: Date.now(),
  sessionId: 'debug-mem0-platform',
  runId: 'platform-debug',
  hypothesisId: 'B'
}) + '\n';
try {
  fs.appendFileSync('${HOME}/Developer/.cursor/debug.log', packageLog);
} catch (e) {
  console.error('Failed to write package debug log:', e.message);
}
// #endregion

if (!mem0aiInstalled) {
  console.error('Cannot proceed without mem0ai package');
  process.exit(1);
}

// Test API key configuration
console.log('\n=== TESTING API CONFIGURATION ===');
const mem0ApiKey = process.env.MEM0_API_KEY || 'test-key-for-debug';
const testUserId = process.env.MEM0_DEFAULT_USER_ID || 'test-user-debug';

// Environment validation
function validateMem0Environment() {
  const issues = [];

  if (!mem0ApiKey || mem0ApiKey === 'test-key-for-debug') {
    issues.push('❌ MEM0_API_KEY not set or using test key');
    issues.push('   Get your API key from: https://app.mem0.ai/settings/api-keys');
  }

  if (!testUserId || testUserId === 'test-user-debug') {
    issues.push('⚠️  MEM0_DEFAULT_USER_ID using test value');
  }

  // Check if we can access the config file
  const fs = require('fs');
  const configPath = './configs/mem0-config.toml';
  if (!fs.existsSync(configPath)) {
    issues.push('❌ Mem0 config file not found at ./configs/mem0-config.toml');
  }

  return issues;
}

const envIssues = validateMem0Environment();
console.log(`\n=== ENVIRONMENT VALIDATION ===`);
if (envIssues.length === 0) {
  console.log('✅ All environment variables configured correctly');
} else {
  console.log('❌ Environment configuration issues:');
  envIssues.forEach(issue => console.log(`   ${issue}`));
}

console.log(`\n=== CURRENT CONFIGURATION ===`);
console.log(`MEM0_API_KEY: ${mem0ApiKey ? 'SET' : 'NOT SET'}`);
console.log(`MEM0_DEFAULT_USER_ID: ${testUserId}`);
console.log(`Using API Key: ${mem0ApiKey.substring(0, 8)}...`);

// Check for actual API key sources
console.log('\n=== CHECKING API KEY SOURCES ===');
const envSources = [
  'MEM0_API_KEY',
  'MEM0_ORG_ID',
  'MEM0_PROJECT_ID',
  'MEM0_BASE_URL'
];

envSources.forEach(envVar => {
  const value = process.env[envVar];
  console.log(`${envVar}: ${value ? 'SET' : 'NOT SET'}`);
  if (value) console.log(`  Value: ${envVar === 'MEM0_API_KEY' ? value.substring(0, 8) + '...' : value}`);
});

// #region agent log
const envCheckLog = JSON.stringify({
  location: 'scripts/debug-mem0-platform.js:70',
  message: 'Environment variable check',
  data: {
    mem0ApiKey: mem0ApiKey.substring(0, 8) + '...',
    testUserId: testUserId,
    envSources: envSources.reduce((acc, env) => {
      acc[env] = !!process.env[env];
      return acc;
    }, {})
  },
  timestamp: Date.now(),
  sessionId: 'debug-mem0-platform',
  runId: 'platform-debug',
  hypothesisId: 'A'
}) + '\n';

const apiLog = JSON.stringify({
  location: 'scripts/debug-mem0-platform.js:70',
  message: 'API configuration check',
  data: {
    hasApiKey: !!mem0ApiKey,
    hasUserId: !!testUserId,
    apiKeyLength: mem0ApiKey?.length || 0,
    isTestKey: mem0ApiKey === 'test-key-for-debug'
  },
  timestamp: Date.now(),
  sessionId: 'debug-mem0-platform',
  runId: 'platform-debug',
  hypothesisId: 'B'
}) + '\n';
try {
  fs.appendFileSync('${HOME}/Developer/.cursor/debug.log', apiLog);
} catch (e) {
  console.error('Failed to write API debug log:', e.message);
}
// #endregion

// Create test script for memory operations
const testScript = `
import os
import json
import time
from mem0 import MemoryClient

# Set API key for testing
os.environ['MEM0_API_KEY'] = '${mem0ApiKey}'

# #region agent log
init_debug = json.dumps({
    "location": "mem0-test-script.py:1",
    "message": "Starting memory test script",
    "data": {
        "api_key_set": bool(os.environ.get('MEM0_API_KEY')),
        "api_key_length": len(os.environ.get('MEM0_API_KEY', '')),
        "test_user_id": "${testUserId}"
    },
    "timestamp": int(time.time() * 1000),
    "sessionId": "debug-mem0-platform",
    "runId": "platform-debug",
    "hypothesisId": "C"
})
print("DEBUG_INIT:", init_debug)
# #endregion

try:
    print("DEBUG: Creating MemoryClient...")
    client = MemoryClient(api_key=os.environ['MEM0_API_KEY'])

    # #region agent log
    client_debug = json.dumps({
        "location": "mem0-test-script.py:20",
        "message": "MemoryClient created successfully",
        "data": {"client_initialized": True},
        "timestamp": int(time.time() * 1000),
        "sessionId": "debug-mem0-platform",
        "runId": "platform-debug",
        "hypothesisId": "C"
    })
    print("DEBUG_CLIENT:", client_debug)
    # #endregion

    print("✅ MemoryClient initialized successfully")

    # Test add memory
    print("DEBUG: Adding memory...")
    messages = [
        {"role": "user", "content": "I'm a vegetarian and allergic to nuts."},
        {"role": "assistant", "content": "Got it! I'll remember your dietary preferences."}
    ]
    result = client.add(messages, user_id="${testUserId}")

    # #region agent log
    add_debug = json.dumps({
        "location": "mem0-test-script.py:30",
        "message": "Memory add operation completed",
        "data": {
            "add_success": True,
            "result_keys": list(result.keys()) if result else [],
            "results_count": len(result.get('results', [])) if result else 0
        },
        "timestamp": int(time.time() * 1000),
        "sessionId": "debug-mem0-platform",
        "runId": "platform-debug",
        "hypothesisId": "D"
    })
    print("DEBUG_ADD:", add_debug)
    # #endregion

    print("✅ Memory added successfully")
    print(f"Added {len(result.get('results', []))} memories")
    
    # Test search memory
    print("DEBUG: Searching memory...")
    search_query = "What are my dietary restrictions?"
    search_filters = {"user_id": "${testUserId}"}

    # #region agent log
    search_start_debug = json.dumps({
        "location": "mem0-test-script.py:40",
        "message": "Starting memory search",
        "data": {
            "query": search_query,
            "filters": search_filters
        },
        "timestamp": int(time.time() * 1000),
        "sessionId": "debug-mem0-platform",
        "runId": "platform-debug",
        "hypothesisId": "E"
    })
    print("DEBUG_SEARCH_START:", search_start_debug)
    # #endregion

    results = client.search(search_query, filters=search_filters)

    # #region agent log
    search_result_debug = json.dumps({
        "location": "mem0-test-script.py:45",
        "message": "Memory search completed",
        "data": {
            "search_success": True,
            "results_keys": list(results.keys()) if results else [],
            "results_count": len(results.get('results', [])) if results else 0
        },
        "timestamp": int(time.time() * 1000),
        "sessionId": "debug-mem0-platform",
        "runId": "platform-debug",
        "hypothesisId": "E"
    })
    print("DEBUG_SEARCH_RESULT:", search_result_debug)
    # #endregion

    print("✅ Memory search successful")
    print(f"Found {len(results.get('results', []))} memories")

    if results.get('results'):
        memory = results['results'][0]
        print(f"Sample memory: {memory.get('memory', 'N/A')}")

except Exception as e:
    # #region agent log
    error_debug = json.dumps({
        "location": "mem0-test-script.py:50",
        "message": "Memory operation failed",
        "data": {
            "error_type": type(e).__name__,
            "error_message": str(e),
            "error_traceback": traceback.format_exc()
        },
        "timestamp": int(time.time() * 1000),
        "sessionId": "debug-mem0-platform",
        "runId": "platform-debug",
        "hypothesisId": "F"
    })
    print("DEBUG_ERROR:", error_debug)
    # #endregion

    import traceback
    print(f"❌ Memory operation failed: {e}")
    traceback.print_exc()
`;

// Write and execute test script
const testFile = '/tmp/mem0-test.py';
fs.writeFileSync(testFile, testScript);

console.log('\n=== TESTING MEMORY OPERATIONS ===');
try {
  execSync(`${venvPython} ${testFile}`, {
    stdio: 'inherit',
    timeout: 30000,
    env: { ...process.env, MEM0_API_KEY: mem0ApiKey }
  });
  console.log('✅ Memory operations test completed');
} catch (error) {
  console.log('❌ Memory operations test failed:', error.message);
}

// #region agent log
const memoryLog = JSON.stringify({
  location: 'scripts/debug-mem0-platform.js:135',
  message: 'Memory operations test completed',
  data: {
    testExecuted: true,
    hasApiKey: !!mem0ApiKey,
    testUserId: testUserId
  },
  timestamp: Date.now(),
  sessionId: 'debug-mem0-platform',
  runId: 'platform-debug',
  hypothesisId: 'D'
}) + '\n';
try {
  fs.appendFileSync('${HOME}/Developer/.cursor/debug.log', memoryLog);
} catch (e) {
  console.error('Failed to write memory debug log:', e.message);
}
// #endregion

// Clean up
try {
  fs.unlinkSync(testFile);
} catch (e) {
  // Ignore cleanup errors
}

console.log('\n=== MEM0 PLATFORM API DEBUG SUMMARY ===');
console.log(`Mem0ai Package: ${mem0aiInstalled ? '✅' : '❌'}`);
console.log(`API Key Configured: ${mem0ApiKey && mem0ApiKey !== 'test-key-for-debug' ? '✅' : '⚠️ (using test key)'}`);
console.log(`User ID Set: ${testUserId ? '✅' : '❌'}`);
console.log('\n📝 For production use:');
console.log('- Set real MEM0_API_KEY from https://app.mem0.ai/settings/api-keys');
console.log('- Use meaningful user IDs for memory isolation');
console.log('- Test memory persistence across sessions');

// #region agent log
const summaryLog = JSON.stringify({
  location: 'scripts/debug-mem0-platform.js:170',
  message: 'Mem0 Platform API debug summary',
  data: {
    mem0aiInstalled: mem0aiInstalled,
    hasRealApiKey: mem0ApiKey && mem0ApiKey !== 'test-key-for-debug',
    hasUserId: !!testUserId,
    ready: mem0aiInstalled && !!mem0ApiKey && !!testUserId
  },
  timestamp: Date.now(),
  sessionId: 'debug-mem0-platform',
  runId: 'platform-debug',
  hypothesisId: 'E'
}) + '\n';
try {
  fs.appendFileSync('${HOME}/Developer/.cursor/debug.log', summaryLog);
} catch (e) {
  console.error('Failed to write summary debug log:', e.message);
}
// #endregion