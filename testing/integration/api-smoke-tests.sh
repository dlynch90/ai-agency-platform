#!/bin/bash

# API Smoke Tests for AI Agency Platform
# This script performs comprehensive API testing through proxy

set -e

echo "🚀 Running API smoke tests through proxy..."

# Source proxy environment
if [ -f "./proxy-env.sh" ]; then
    source ./proxy-env.sh
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test result counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to log test results
log_test() {
    local name=$1
    local status=$2
    local message=$3

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC} $name: $message"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}✗ FAIL${NC} $name: $message"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        echo -e "${YELLOW}⚠ SKIP${NC} $name: $message"
    fi
}

# Function to test HTTP endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local expected_status=${4:-200}
    local timeout=${5:-10}

    echo "Testing $name..."

    if command -v curl >/dev/null 2>&1; then
        local response=$(curl -s -w "HTTPSTATUS:%{http_code};TOTAL_TIME:%{time_total}" \
            --max-time $timeout \
            -X $method \
            "$url" 2>/dev/null)

        local status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        local time=$(echo "$response" | grep -o "TOTAL_TIME:[0-9.]*" | cut -d: -f2)

        if [ "$status" = "$expected_status" ]; then
            log_test "$name" "PASS" "Status $status, Response time: ${time}s"
        else
            log_test "$name" "FAIL" "Expected status $expected_status, got $status"
        fi
    else
        log_test "$name" "SKIP" "curl not available"
    fi
}

# Test basic connectivity
echo "Testing basic connectivity..."
test_endpoint "Google DNS" "https://8.8.8.8" "GET" "000" 5
test_endpoint "HTTPBin" "https://httpbin.org/get" "GET" "200" 10

# Test AI service APIs (mock endpoints for now)
echo "Testing AI service APIs..."
test_endpoint "GitHub API (mock)" "https://api.github.com/zen" "GET" "200" 15
test_endpoint "Anthropic API (mock)" "https://api.anthropic.com/v1/messages" "POST" "400" 15  # Expect auth error
test_endpoint "OpenAI API (mock)" "https://api.openai.com/v1/models" "GET" "401" 15  # Expect auth error

# Test local services
echo "Testing local services..."
test_endpoint "Local GraphQL" "http://localhost:4000/graphql" "POST" "200" 5
test_endpoint "Local API" "http://localhost:3000/api/health" "GET" "200" 5

# Test database connectivity (if available)
echo "Testing database connectivity..."
if command -v psql >/dev/null 2>&1; then
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        log_test "PostgreSQL" "PASS" "Database is ready"
    else
        log_test "PostgreSQL" "FAIL" "Database not accessible"
    fi
else
    log_test "PostgreSQL" "SKIP" "psql not available"
fi

# Test Neo4j connectivity (if available)
if command -v cypher-shell >/dev/null 2>&1; then
    # This would need proper authentication
    log_test "Neo4j" "SKIP" "cypher-shell available but auth required"
else
    log_test "Neo4j" "SKIP" "cypher-shell not available"
fi

# Print summary
echo ""
echo "📊 API Smoke Test Results:"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo "Success Rate: $((PASSED_TESTS * 100 / TOTAL_TESTS))%"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All smoke tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some smoke tests failed${NC}"
    exit 1
fi
