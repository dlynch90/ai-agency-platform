#!/bin/bash

# Main Cursor IDE Fix Script
# Run this to fix all Cursor IDE instrumentation and MCP issues

echo "🚀 Starting Cursor IDE Fix Process..."

# Source environment variables
if [ -f "setup_mcp_env.sh" ]; then
    source setup_mcp_env.sh
    echo "✅ Environment variables loaded"
else
    echo "⚠️  setup_mcp_env.sh not found"
fi

# Check MCP server health
if [ -f "check_mcp_health.sh" ]; then
    ./check_mcp_health.sh
fi

# Enforce Cursor rules
if [ -f "enforce_cursor_rules.sh" ]; then
    ./enforce_cursor_rules.sh
fi

# Restart Cursor IDE (if running)
if pgrep -f "Cursor" > /dev/null; then
    echo "🔄 Restarting Cursor IDE..."
    pkill -f "Cursor"
    sleep 2
    open -a "Cursor"
    echo "✅ Cursor IDE restarted"
fi

echo "🎉 Cursor IDE fix completed!"
echo ""
echo "Next steps:"
echo "1. Open Cursor IDE"
echo "2. Check that MCP servers are connected (should see them in status bar)"
echo "3. Test AI features to ensure they're working"
echo "4. If issues persist, check Cursor logs at ~/Library/Logs/Cursor/"
