#!/bin/bash
# Environment Validation Script
# Tests unified environment management setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
TOTAL=0

# Function to print test results
print_test() {
    local test_name="$1"
    local result="$2"
    local message="$3"

    ((TOTAL++))
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ $test_name${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ $test_name${NC}"
        if [ -n "$message" ]; then
            echo -e "${RED}   $message${NC}"
        fi
        ((FAILED++))
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check version
check_version() {
    local command="$1"
    local expected="$2"
    local actual

    if ! command_exists "$command"; then
        echo "not installed"
        return 1
    fi

    case "$command" in
        "python")
            actual=$($command --version 2>&1 | cut -d' ' -f2)
            ;;
        "node")
            actual=$($command --version | sed 's/v//')
            ;;
        "java")
            actual=$($command --version 2>&1 | head -1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
            ;;
        "rustc")
            actual=$($command --version | cut -d' ' -f2)
            ;;
        "mise")
            actual=$($command --version)
            ;;
        "pixi")
            actual=$($command --version)
            ;;
        *)
            actual=$($command --version 2>&1 | head -1)
            ;;
    esac

    echo "$actual"
}

echo "🔍 Validating Unified Environment Management"
echo "============================================"

# Test 1: Check mise installation
echo ""
echo "Testing Tool Version Management (mise):"
if command_exists "mise"; then
    print_test "mise installation" "PASS" "mise is available in PATH"
else
    print_test "mise installation" "FAIL" "mise is not installed"
fi

# Test 2: Check mise configuration
if [ -f ".mise.toml" ]; then
    print_test "mise configuration" "PASS" ".mise.toml exists"
else
    print_test "mise configuration" "FAIL" ".mise.toml not found"
fi

# Test 3: Check pixi installation
pixi_version=$(check_version "pixi")
if [ "$pixi_version" = "not installed" ]; then
    print_test "pixi installation" "FAIL" "pixi is not installed"
else
    print_test "pixi installation" "PASS" "Version: $pixi_version"
fi

# Test 4: Check unified pixi environment
if [ -f "pixi-unified.toml" ]; then
    print_test "unified pixi config" "PASS" "pixi-unified.toml exists"
else
    print_test "unified pixi config" "FAIL" "pixi-unified.toml not found"
fi

# Test 5: Check just installation
if command_exists "just"; then
    print_test "just installation" "PASS" "just is available"
else
    print_test "just installation" "WARN" "just not installed (optional)"
fi

# Test 6: Check justfile
if [ -f "justfile" ]; then
    print_test "justfile configuration" "PASS" "justfile exists"
else
    print_test "justfile configuration" "FAIL" "justfile not found"
fi

# Test 7: Check environment selector script
if [ -f "scripts/env-select.sh" ] && [ -x "scripts/env-select.sh" ]; then
    print_test "environment selector" "PASS" "env-select.sh exists and is executable"
else
    print_test "environment selector" "FAIL" "env-select.sh not found or not executable"
fi

# Test 8: Check Java version file
if [ -f ".java-version" ]; then
    print_test "Java version config" "PASS" ".java-version exists"
else
    print_test "Java version config" "FAIL" ".java-version not found"
fi

# Test 9: Check Java environment
java_version=$(check_version "java")
if [ "$java_version" = "not installed" ]; then
    print_test "Java installation" "FAIL" "Java is not installed"
else
    print_test "Java installation" "PASS" "Version: $java_version"
fi

# Test 10: Check Node.js environment
node_version=$(check_version "node")
if [ "$node_version" = "not installed" ]; then
    print_test "Node.js installation" "FAIL" "Node.js is not installed"
else
    print_test "Node.js installation" "PASS" "Version: $node_version"
fi

# Test 11: Check Python environment
python_version=$(check_version "python")
if [ "$python_version" = "not installed" ]; then
    print_test "Python installation" "FAIL" "Python is not installed"
else
    print_test "Python installation" "PASS" "Version: $python_version"
fi

# Test 12: Check Rust environment
rust_version=$(check_version "rustc")
if [ "$rust_version" = "not installed" ]; then
    print_test "Rust installation" "FAIL" "Rust is not installed"
else
    print_test "Rust installation" "PASS" "Version: $rust_version"
fi

# Test 13: Check existing Java project
if [ -f "./mvnw" ]; then
    if [ -x "./mvnw" ]; then
        print_test "Java project setup" "PASS" "Maven wrapper exists and is executable"
    else
        print_test "Java project setup" "WARN" "Maven wrapper exists but is not executable"
    fi
else
    print_test "Java project setup" "FAIL" "Maven wrapper not found"
fi

# Test 14: Check existing Node.js project
if [ -f "package.json" ]; then
    print_test "Node.js project setup" "PASS" "package.json exists"
else
    print_test "Node.js project setup" "FAIL" "package.json not found"
fi

# Test 15: Check existing Rust project
if [ -f "Cargo.toml" ]; then
    print_test "Rust project setup" "PASS" "Cargo.toml exists"
else
    print_test "Rust project setup" "FAIL" "Cargo.toml not found"
fi

# Test environment selector functionality
echo ""
echo "Testing Environment Selector:"
if [ -x "scripts/env-select.sh" ]; then
    # #region agent log - Hypothesis F: Environment selector functionality
    echo '{"id":"log_$(date +%s)_env_select","timestamp":'$(date +%s)'000,"location":"scripts/validate-environments.sh:196","message":"Testing environment selector","data":{"command":"scripts/env-select.sh status"},"sessionId":"debug-session","runId":"run1","hypothesisId":"F"}' >> ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug.log
    # #endregion
    # Test status command
    if scripts/env-select.sh status >/dev/null 2>&1; then
        print_test "env-select status" "PASS" "Status command works"
    else
        print_test "env-select status" "FAIL" "Status command failed"
    fi
else
    print_test "env-select executable" "FAIL" "Script is not executable"
fi

# Test MCP server connectivity
echo ""
echo "Testing MCP Server Connectivity:"
# #region agent log - Hypothesis G: MCP server availability and Hypothesis E: MCP server functionality
echo '{"id":"log_$(date +%s)_mcp_test","timestamp":'$(date +%s)'000,"location":"scripts/validate-environments.sh:210","message":"Testing MCP server connectivity","data":{"servers_to_test":["sequential-thinking","filesystem","git","github","anthropic","ollama"],"mcp_config_exists":"'$(test -f mcp-config.toml && echo true || echo false)'"},"sessionId":"debug-session","runId":"run1","hypothesisId":"G"}' >> ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug.log
# #endregion

# Test if MCP config file exists
if [ -f "mcp-config.toml" ]; then
    print_test "MCP config file" "PASS" "mcp-config.toml exists"

    # Test MCP server count
    mcp_server_count=$(grep -c "^\[servers\." mcp-config.toml 2>/dev/null || echo "0")
    if [ "$mcp_server_count" -ge 10 ]; then
        print_test "MCP server count" "PASS" "$mcp_server_count servers configured"
    else
        print_test "MCP server count" "WARN" "Only $mcp_server_count servers configured"
    fi
else
    print_test "MCP config file" "FAIL" "mcp-config.toml not found"
fi

# Test Node.js MCP server installation
if command_exists "npx"; then
    if npx --version >/dev/null 2>&1; then
        print_test "npx availability" "PASS" "npx is functional"

        # Test if MCP packages can be resolved
        if npx @modelcontextprotocol/server-sequential-thinking --help >/dev/null 2>&1; then
            print_test "MCP package resolution" "PASS" "MCP packages resolvable"
        else
            print_test "MCP package resolution" "WARN" "MCP packages may not be available"
        fi
    else
        print_test "npx availability" "FAIL" "npx not working"
    fi
else
    print_test "npx availability" "FAIL" "npx not installed"
fi

# Test environment variables for MCP servers
env_var_count=$(grep -c "^[A-Z_]*_API_KEY\|^[A-Z_]*_TOKEN\|^[A-Z_]*_URL" .env 2>/dev/null || echo "0")
if [ "$env_var_count" -gt 0 ]; then
    print_test "MCP environment vars" "PASS" "$env_var_count environment variables configured"
else
    print_test "MCP environment vars" "FAIL" "No environment variables configured for MCP"
fi

# Summary
echo ""
echo "📊 Validation Summary"
echo "===================="
echo "Total tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All validation tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run 'just setup-dev' to initialize all environments"
    echo "2. Use 'scripts/env-select.sh <environment>' to switch contexts"
    echo "3. Use 'just dev-<type>' commands for development workflows"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some validation tests failed.${NC}"
    echo ""
    echo "Common fixes:"
    echo "- Install missing tools: brew install mise pixi just"
    echo "- Run mise install to setup tool versions"
    echo "- Run pixi install to setup Python environments"
    exit 1
fi