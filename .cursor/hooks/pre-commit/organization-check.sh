#!/bin/bash
# Pre-commit hook to enforce Cursor IDE organization rules
# Blocks commits that violate workspace organization standards

echo "🔍 Cursor IDE Organization Check"

# Check for loose files in root directory
LOOSE_FILES=$(find . -maxdepth 1 -type f \( -name "*.md" -o -name "*.sh" -o -name "*.toml" -o -name "*.json" -o -name "*.yaml" -o -name "*.yml" \) 2>/dev/null | grep -v -E "(^\./\.|^\./README\.md$|^\./package\.json$|^\./pixi\.toml$)" | wc -l)

if [ "$LOOSE_FILES" -gt 0 ]; then
    echo "❌ VIOLATION: Found $LOOSE_FILES loose files in root directory"
    echo "Files that must be moved:"
    find . -maxdepth 1 -type f \( -name "*.md" -o -name "*.sh" -o -name "*.toml" -o -name "*.json" -o -name "*.yaml" -o -name "*.yml" \) 2>/dev/null | grep -v -E "(^\./\.|^\./README\.md$|^\./package\.json$|^\./pixi\.toml$)"
    echo ""
    echo "📁 Organization Requirements:"
    echo "  *.md files → /docs/ directory"
    echo "  *.sh files → /scripts/ directory"
    echo "  *.toml/*.json/*.yaml files → /configs/ directory"
    echo ""
    exit 1
fi

# Check for MCP server configurations
if [ ! -f ".cursor/mcp/servers.json" ]; then
    echo "❌ VIOLATION: Missing MCP server configuration"
    echo "Required: .cursor/mcp/servers.json"
    exit 1
fi

# Check for proper directory structure
if [ ! -d ".cursor/rules" ]; then
    echo "❌ VIOLATION: Missing Cursor rules directory"
    echo "Required: .cursor/rules/ directory"
    exit 1
fi

echo "✅ All organization rules passed"
exit 0