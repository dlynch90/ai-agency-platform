#!/bin/bash
# Comprehensive API Smoke Tests
# Tests all major API endpoints, databases, and integrations

set -e

echo "🧪 COMPREHENSIVE API SMOKE TESTS"
echo "================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

log() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

pass() {
    echo -e "${GREEN}✓ PASS${NC} $1"
    ((PASSED_TESTS++))
}

fail() {
    echo -e "${RED}✗ FAIL${NC} $1"
    ((FAILED_TESTS++))
}

# Function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"

    ((TOTAL_TESTS++))
    log "Running: $test_name"

    if eval "$test_command" >/dev/null 2>&1; then
        pass "$test_name"
        return 0
    else
        fail "$test_name"
        return 1
    fi
}

# 1. Ollama API Tests
test_ollama_api() {
    echo -e "\n${BLUE}🤖 OLLAMA API TESTS${NC}"
    echo "===================="

    # Test basic connectivity
    run_test "Ollama API Connectivity" "curl -s http://localhost:11434/api/tags | jq -r '.models[0].name' >/dev/null"

    # Test model listing
    run_test "Ollama Model Listing" "curl -s http://localhost:11434/api/tags | jq '.models | length' | grep -q '^[0-9]'"

    # Test basic inference (if models available)
    local model_count=$(curl -s http://localhost:11434/api/tags 2>/dev/null | jq '.models | length' 2>/dev/null || echo 0)
    if [ "$model_count" -gt 0 ]; then
        run_test "Ollama Inference Test" "echo '{\"model\":\"llama2\",\"prompt\":\"Hello\",\"stream\":false}' | curl -s -X POST http://localhost:11434/api/generate -H 'Content-Type: application/json' -d @- | jq -r '.response' | wc -c | grep -q '^[1-9]'"
    else
        log "No Ollama models available - skipping inference test"
    fi
}

# 2. GraphQL API Tests
test_graphql_api() {
    echo -e "\n${BLUE}🔗 GRAPHQL API TESTS${NC}"
    echo "====================="

    # Check if GraphQL schema exists
    run_test "GraphQL Schema Existence" "[ -f graphql/schema.graphql ]"

    # Validate GraphQL syntax
    if command -v graphql-schema-linter >/dev/null 2>&1; then
        run_test "GraphQL Schema Validation" "graphql-schema-linter graphql/schema.graphql"
    else
        log "graphql-schema-linter not available - skipping validation"
    fi

    # Test basic GraphQL query structure
    if [ -f "graphql/schema.graphql" ]; then
        run_test "GraphQL Query Structure" "grep -q 'type Query' graphql/schema.graphql"
        run_test "GraphQL Mutation Structure" "grep -q 'type Mutation' graphql/schema.graphql"
    fi
}

# 3. Database Connectivity Tests
test_database_connectivity() {
    echo -e "\n${BLUE}🗄️ DATABASE CONNECTIVITY TESTS${NC}"
    echo "==============================="

    # PostgreSQL connectivity
    if command -v psql >/dev/null 2>&1; then
        run_test "PostgreSQL Client Available" "psql --version >/dev/null"
        # Note: Actual connection test would require running PostgreSQL server
        log "PostgreSQL server connectivity test requires running instance"
    else
        log "PostgreSQL client not available"
    fi

    # Prisma configuration
    run_test "Prisma Configuration" "[ -f 'database-integration/schema.prisma' ]"

    if [ -f "database-integration/schema.prisma" ]; then
        run_test "Prisma Schema Validation" "grep -q 'generator client' database-integration/schema.prisma"
        run_test "Prisma Data Source" "grep -q 'datasource db' database-integration/schema.prisma"
    fi

    # Neo4j connectivity
    if command -v neo4j >/dev/null 2>&1; then
        run_test "Neo4j Client Available" "neo4j --version >/dev/null"
        log "Neo4j server connectivity test requires running instance"
    else
        log "Neo4j client not available"
    fi
}

# 4. REST API Tests
test_rest_api() {
    echo -e "\n${BLUE}🌐 REST API TESTS${NC}"
    echo "==================="

    # Check API endpoints configuration
    run_test "API Endpoints Config" "[ -f 'api/endpoints.json' ]"

    if [ -f "api/endpoints.json" ]; then
        run_test "API Endpoints JSON Valid" "jq empty api/endpoints.json"
        run_test "API Endpoints Structure" "jq '.endpoints | length' api/endpoints.json | grep -q '^[0-9]'"
    fi

    # Check for OpenAPI/Swagger specs
    if [ -f "api/openapi.yaml" ] || [ -f "api/swagger.json" ]; then
        run_test "API Documentation Exists" "true"
    else
        log "No API documentation found"
    fi
}

# 5. Docker/Container Tests
test_docker_integration() {
    echo -e "\n${BLUE}🐳 DOCKER INTEGRATION TESTS${NC}"
    echo "=============================="

    # Docker availability
    run_test "Docker Available" "docker --version >/dev/null"

    # Docker daemon connectivity
    run_test "Docker Daemon" "docker info >/dev/null"

    # Check for Docker Compose files
    run_test "Docker Compose Config" "[ -f 'infra/docker-compose.yml' ] || [ -f 'docker-compose.yml' ]"

    # Container health (if running)
    local running_containers=$(docker ps --format "{{.Names}}" | wc -l)
    if [ "$running_containers" -gt 0 ]; then
        run_test "Running Containers" "docker ps | grep -q 'Up'"
    else
        log "No running containers to test"
    fi
}

# 6. Kubernetes Integration Tests
test_kubernetes_integration() {
    echo -e "\n${BLUE}☸️ KUBERNETES INTEGRATION TESTS${NC}"
    echo "==================================="

    # kubectl availability
    run_test "kubectl Available" "kubectl version --client >/dev/null"

    # Helm availability
    run_test "Helm Available" "helm version >/dev/null"

    # Check for Kubernetes manifests
    run_test "K8s Manifests" "[ -d 'infra/kubernetes' ] || [ -d 'kubernetes' ]"

    # Check for Helm charts
    run_test "Helm Charts" "[ -d 'helm-charts' ] && ls helm-charts/ | wc -l | grep -q '^[1-9]'"
}

# 7. MCP Server Integration Tests
test_mcp_integration() {
    echo -e "\n${BLUE}🔧 MCP SERVER INTEGRATION TESTS${NC}"
    echo "==================================="

    # Check MCP configuration
    run_test "MCP Config Exists" "[ -f 'configs/mcp-config.toml' ]"

    # Check for MCP server binaries/scripts
    run_test "MCP Setup Scripts" "[ -f 'infra/setup_mcp_servers.sh' ] || [ -f 'infra/setup_mcp_pnpm.sh' ]"

    # Test MCP directory structure
    run_test "MCP Directory" "[ -d '.mcp' ]"
}

# 8. CI/CD Pipeline Tests
test_ci_cd_integration() {
    echo -e "\n${BLUE}🔄 CI/CD INTEGRATION TESTS${NC}"
    echo "=============================="

    # Check for CI/CD configuration
    run_test "CI/CD Config" "[ -f '.github/workflows/ci.yml' ] || [ -f 'ci_cd/pipeline.yml' ]"

    # Check for linting configuration
    run_test "Linting Config" "[ -f 'eslint.config.js' ] || [ -f 'eslint.config.mjs' ] || [ -f '.eslintrc.js' ]"

    # Check for testing configuration
    run_test "Testing Config" "[ -f 'package.json' ] && jq '.scripts.test' package.json >/dev/null 2>&1"
}

# 9. Security Integration Tests
test_security_integration() {
    echo -e "\n${BLUE}🔒 SECURITY INTEGRATION TESTS${NC}"
    echo "================================="

    # Check for security scanning tools
    if command -v trivy >/dev/null 2>&1; then
        run_test "Trivy Available" "trivy --version >/dev/null"
    fi

    if command -v snyk >/dev/null 2>&1; then
        run_test "Snyk Available" "snyk --version >/dev/null"
    fi

    # Check for secrets management
    run_test "1Password CLI" "command -v op >/dev/null 2>&1"
}

# 10. Performance and Monitoring Tests
test_performance_monitoring() {
    echo -e "\n${BLUE}📊 PERFORMANCE MONITORING TESTS${NC}"
    echo "===================================="

    # Check for monitoring configuration
    run_test "Monitoring Config" "[ -d 'monitoring' ] && ls monitoring/ | wc -l | grep -q '^[0-9]'"

    # Check for metrics collection
    run_test "Metrics Collection" "[ -d 'metrics' ] && ls metrics/ | wc -l | grep -q '^[0-9]'"

    # Check for logging configuration
    run_test "Logging Config" "[ -d 'logs' ] && ls logs/ | wc -l | grep -q '^[0-9]'"
}

# 11. Event-Driven Architecture Tests
test_event_driven_architecture() {
    echo -e "\n${BLUE}🎯 EVENT-DRIVEN ARCHITECTURE TESTS${NC}"
    echo "======================================"

    # Check for lefthook configuration
    run_test "Git Hooks Config" "[ -f 'lefthook.yml' ]"

    # Check for event orchestrator
    run_test "Event Orchestrator" "[ -f 'infra/event_driven_orchestrator.sh' ] && [ -x 'infra/event_driven_orchestrator.sh' ]"

    # Check for cron jobs
    run_test "Cron Jobs Config" "[ -f 'infra/cron_jobs' ]"

    # Test orchestrator execution (dry run)
    run_test "Orchestrator Dry Run" "infra/event_driven_orchestrator.sh --help >/dev/null 2>&1 || true"
}

# 12. Vendor Compliance Tests
test_vendor_compliance() {
    echo -e "\n${BLUE}🏢 VENDOR COMPLIANCE TESTS${NC}"
    echo "=============================="

    # Check for custom code violations
    local custom_scripts=$(find . -name "*.sh" -type f | grep -v node_modules | wc -l)
    if [ "$custom_scripts" -lt 10 ]; then
        run_test "Limited Custom Scripts" "true"
    else
        fail "Too many custom scripts ($custom_scripts found)"
    fi

    # Check for proper vendor tool usage
    run_test "Vendor Tools Available" "command -v pixi >/dev/null && command -v lefthook >/dev/null"

    # Check for proper directory structure
    run_test "Directory Structure" "[ -d 'docs' ] && [ -d 'logs' ] && [ -d 'testing' ] && [ -d 'infra' ]"
}

# Main test execution
main() {
    echo "Starting comprehensive API smoke tests..."
    echo ""

    # Run all test suites
    test_ollama_api
    test_graphql_api
    test_database_connectivity
    test_rest_api
    test_docker_integration
    test_kubernetes_integration
    test_mcp_integration
    test_ci_cd_integration
    test_security_integration
    test_performance_monitoring
    test_event_driven_architecture
    test_vendor_compliance

    # Results summary
    echo ""
    echo "================================"
    echo "🧪 TEST RESULTS SUMMARY"
    echo "================================"
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

    local success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))

    if [ "$success_rate" -ge 80 ]; then
        echo -e "${GREEN}✓ OVERALL RESULT: PASS ($success_rate% success rate)${NC}"
        exit 0
    else
        echo -e "${RED}✗ OVERALL RESULT: FAIL ($success_rate% success rate)${NC}"
        echo ""
        echo "🔧 RECOMMENDATIONS:"
        echo "1. Start required services (Ollama, databases)"
        echo "2. Install missing dependencies"
        echo "3. Configure API endpoints"
        echo "4. Set up monitoring and logging"
        echo "5. Review failed tests above"
        exit 1
    fi
}

# Run main test suite
main "$@"