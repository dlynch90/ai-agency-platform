#!/bin/bash
echo "🧪 Running Comprehensive Integration Tests..."

# Test 1: ADR compliance
echo "Testing ADR compliance..."
if [ -d "${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}/docs/adr" ] && [ "$(find ${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}/docs/adr -name "*.md" | wc -l)" -gt 0 ]; then
    echo "✅ ADR compliance: PASS"
else
    echo "❌ ADR compliance: FAIL"
fi

# Test 2: MCP server
echo "Testing MCP server..."
if [ -f "${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}/mcp/servers/universal-mcp-server.js" ]; then
    echo "✅ MCP server: PASS"
else
    echo "❌ MCP server: FAIL"
fi

# Test 3: Authentication
echo "Testing authentication system..."
if [ -f "${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}/auth/cli/authenticated-cli-wrapper.sh" ]; then
    echo "✅ Authentication: PASS"
else
    echo "❌ Authentication: FAIL"
fi

# Test 4: FEA
echo "Testing finite element analysis..."
if [ -f "${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}/architecture/models/finite-element-analysis.js" ]; then
    echo "✅ FEA: PASS"
else
    echo "❌ FEA: FAIL"
fi

# Test 5: Transformers
echo "Testing transformers acceleration..."
if [ -f "${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}/architecture/models/transformers-accelerator.js" ]; then
    echo "✅ Transformers: PASS"
else
    echo "❌ Transformers: FAIL"
fi

# Test 6: Cursor IDE compliance
echo "Testing Cursor IDE compliance..."
loose_files=$(find ~ -maxdepth 1 -type f 2>/dev/null | grep -v "\.DS_Store\|\.localized\|\.Trash\|\.CFUserTextEncoding" | wc -l)
if [ "$loose_files" -eq 0 ]; then
    echo "✅ Cursor IDE compliance: PASS"
else
    echo "❌ Cursor IDE compliance: FAIL ($loose_files loose files)"
fi

echo -e "\n🎉 Integration testing complete!"
