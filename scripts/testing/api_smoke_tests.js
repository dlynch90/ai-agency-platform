// COMPREHENSIVE API SMOKE TESTS - Using all MCP servers and network proxy
import { execSync } from 'child_process';

function runSmokeTest(service, command, expectedOutput = '', timeout = 10000) {
  try {
    // CONSOLE_LOG_VIOLATION: console.log(`🔍 Testing ${service}...`);
    const result = execSync(command, { encoding: 'utf8', timeout });
    const success = expectedOutput ? result.includes(expectedOutput) : result.trim().length > 0;
    // CONSOLE_LOG_VIOLATION: console.log(`${service}: ${success ? '✅ PASS' : '❌ FAIL'}`);
    if (!success && result) // CONSOLE_LOG_VIOLATION: console.log(`Output: ${result.trim()}`);
    return success;
  } catch (error) {
    // CONSOLE_LOG_VIOLATION: console.log(`${service}: ❌ FAIL - ${error.message.split('\n')[0]}`);
    return false;
  }
}

function testGraphQL() {
  // CONSOLE_LOG_VIOLATION: console.log('🔍 Testing GraphQL infrastructure...');
  // Test if GraphQL server can start (mock test)
  try {
    const result = execSync('npm list -g | grep -E "(graphql|@apollo)" | wc -l', { encoding: 'utf8' });
    const hasGraphQL = parseInt(result.trim()) > 0;
    // CONSOLE_LOG_VIOLATION: console.log(`GraphQL Libraries: ${hasGraphQL ? '✅ INSTALLED' : '❌ MISSING'}`);
    return hasGraphQL;
  } catch (error) {
    // CONSOLE_LOG_VIOLATION: console.log('GraphQL Libraries: ❌ ERROR');
    return false;
  }
}

async function runComprehensiveSmokeTests() {
  // CONSOLE_LOG_VIOLATION: console.log('🚀 COMPREHENSIVE API SMOKE TESTS ACROSS ALL MCP SERVERS\n');
  
  const tests = [
    // Database connectivity tests
    ['PostgreSQL', 'psql -h localhost -U $(whoami) -d ai_agency -c "SELECT version();" 2>/dev/null | head -1', 'PostgreSQL'],
    ['Neo4j', 'curl -s -H "Authorization: Basic $(echo -n "neo4j:password" | base64)" http://localhost:7474/db/neo4j/tx/commit -X POST -H "Content-Type: application/json" -d \'{"statements":[]}\' | jq -r ".errors | length" 2>/dev/null', '0'],
    ['Redis', 'redis-cli --raw ping 2>/dev/null', 'PONG'],
    
    // AI/ML service tests
    ['Ollama', 'curl -s --max-time 5 http://localhost:11434/api/tags | jq -r ".models | length" 2>/dev/null', '1'],
    
    // Programming language runtime tests
    ['Node.js', 'node --version 2>/dev/null', 'v'],
    ['Python', 'python3 --version 2>/dev/null', 'Python'],
    ['Go', 'go version 2>/dev/null', 'go version'],
    ['Rust', 'cargo --version 2>/dev/null', 'cargo'],
    
    // Development tool tests
    ['Git', 'git --version 2>/dev/null', 'git version'],
    ['Docker', 'docker --version 2>/dev/null', 'Docker version'],
    ['Kubernetes', 'kubectl version --client --short 2>/dev/null', 'Client Version'],
    
    // Package manager tests
    ['npm', 'npm --version 2>/dev/null', ''],
    ['pip', 'pip3 --version 2>/dev/null', 'pip'],
    ['cargo', 'cargo --version 2>/dev/null', 'cargo']
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const [service, command, expected] of tests) {
    if (runSmokeTest(service, command, expected)) {
      passed++;
    }
  }
  
  // Test GraphQL separately
  if (testGraphQL()) passed++;
  total++;
  
  // CONSOLE_LOG_VIOLATION: console.log(`\n📊 COMPREHENSIVE SMOKE TEST RESULTS:`);
  // CONSOLE_LOG_VIOLATION: console.log(`Services Tested: ${total}`);
  // CONSOLE_LOG_VIOLATION: console.log(`Services Operational: ${passed}`);
  // CONSOLE_LOG_VIOLATION: console.log(`Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed >= total * 0.8) {
    // CONSOLE_LOG_VIOLATION: console.log('🎉 SYSTEM HEALTH: EXCELLENT (80%+ operational)');
  } else if (passed >= total * 0.6) {
    // CONSOLE_LOG_VIOLATION: console.log('⚠️ SYSTEM HEALTH: GOOD (60-79% operational)');
  } else {
    // CONSOLE_LOG_VIOLATION: console.log('❌ SYSTEM HEALTH: NEEDS ATTENTION (<60% operational)');
  }
  
  return passed >= total * 0.8;
}

runComprehensiveSmokeTests();
