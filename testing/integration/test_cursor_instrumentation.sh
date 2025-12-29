#!/bin/bash
# Test Cursor IDE Instrumentation
# Validates that all fixes are working

echo "=== TESTING CURSOR IDE INSTRUMENTATION ==="

# Test 1: Check if instrumentation script exists and is executable
echo "Test 1: Instrumentation script status"
if [ -f "${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/cursor_debug_instrumentation.js" ]; then
    echo "✅ Instrumentation script exists"
    node "${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/cursor_debug_instrumentation.js" --version 2>/dev/null && echo "✅ Instrumentation script runs" || echo "❌ Instrumentation script failed"
else
    echo "❌ Instrumentation script missing"
fi

# Test 2: Check Cursor settings
echo ""
echo "Test 2: Cursor settings validation"
if grep -q "cursor.debug.enabled.*true" ~/.cursor/settings.json 2>/dev/null; then
    echo "✅ User Cursor settings configured"
else
    echo "❌ User Cursor settings not configured"
fi

if grep -q "cursor.debug.enabled.*true" .cursor/settings.json 2>/dev/null; then
    echo "✅ Workspace Cursor settings configured"
else
    echo "❌ Workspace Cursor settings not configured"
fi

# Test 3: Check log files
echo ""
echo "Test 3: Log file creation"
if [ -f "${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/cursor_debug.log" ]; then
    echo "✅ Debug log exists"
    echo "Log size: $(stat -f %z "${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/cursor_debug.log") bytes"
else
    echo "❌ Debug log missing"
fi

# Test 4: Check MCP servers
echo ""
echo "Test 4: MCP server configuration"
if [ -f "mcp-config.toml" ]; then
    echo "✅ MCP config exists"
    mcp_count=$(grep -c "\[servers\." mcp-config.toml 2>/dev/null)
    echo "Configured MCP servers: $mcp_count"
else
    echo "❌ MCP config missing"
fi

# Test 5: Check technology stack
echo ""
echo "Test 5: Technology stack validation"
tools=("node" "npm" "python3" "go" "rustc" "java" "docker")
for tool in "${tools[@]}"; do
    if command -v "$tool" >/dev/null 2>&1; then
        echo "✅ $tool: installed"
    else
        echo "❌ $tool: missing"
    fi
done

# Test 6: Check database connectivity
echo ""
echo "Test 6: Database connectivity"
if pg_isready -h localhost >/dev/null 2>&1; then
    echo "✅ PostgreSQL: connected"
else
    echo "❌ PostgreSQL: not connected"
fi

if curl -s http://localhost:7474 >/dev/null 2>&1; then
    echo "✅ Neo4j: connected"
else
    echo "❌ Neo4j: not connected"
fi

# Test 7: Check loose files cleanup
echo ""
echo "Test 7: Loose files cleanup verification"
user_root_loose_files=$(find ${USER_HOME:-$HOME} -maxdepth 1 -type f | grep -v "${USER_HOME:-$HOME}/\." | wc -l)
if [ "$user_root_loose_files" -lt 5 ]; then
    echo "✅ Loose files cleaned up (found $user_root_loose_files remaining)"
else
    echo "❌ Too many loose files remain ($user_root_loose_files)"
fi

echo ""
echo "=== INSTRUMENTATION TEST COMPLETE ==="
echo "Check the results above. If all tests pass, instrumentation is working correctly."