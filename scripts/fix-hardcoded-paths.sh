#!/bin/bash
# FIX HARDCODED PATHS - Cursor IDE Rule Enforcement
# Replace all hardcoded /Users/daniellynch paths with parameterized variables

echo "🔧 FIXING HARDCODED PATHS VIOLATIONS"
echo "===================================="

# Set parameterized variables
DEVELOPER_DIR="${DEVELOPER_DIR:-$HOME/Developer}"
USER_HOME="${USER_HOME:-$HOME}"
CONFIG_DIR="${CONFIG_DIR:-$HOME/.config}"

echo "Using parameterized paths:"
echo "  DEVELOPER_DIR: $DEVELOPER_DIR"
echo "  USER_HOME: $USER_HOME"
echo "  CONFIG_DIR: $CONFIG_DIR"
echo ""

# Find all files with hardcoded paths
echo "Finding files with hardcoded paths..."
HARDCODED_FILES=$(grep -r -l "/Users/daniellynch" "$DEVELOPER_DIR" 2>/dev/null | head -50)

echo "Found $(echo "$HARDCODED_FILES" | wc -l) files with hardcoded paths"
echo ""

# Process each file
for file in $HARDCODED_FILES; do
    if [[ -f "$file" && "$file" != *".git"* && "$file" != *"node_modules"* ]]; then
        echo "Fixing: $file"

        # Create backup
        cp "$file" "${file}.backup"

        # Replace hardcoded paths with variables
        sed -i '' "s|/Users/daniellynch/Developer|\${DEVELOPER_DIR:-$HOME/Developer}|g" "$file"
        sed -i '' "s|/Users/daniellynch|\${USER_HOME:-$HOME}|g" "$file"
        sed -i '' "s|\$HOME/Developer|\${DEVELOPER_DIR:-$HOME/Developer}|g" "$file"
        sed -i '' "s|\$HOME/.config|\${CONFIG_DIR:-$HOME/.config}|g" "$file"

        echo "  ✅ Fixed hardcoded paths in $file"
    fi
done

echo ""
echo "🎯 HARDCODED PATHS FIXED"
echo "========================="
echo "✅ Replaced all /Users/daniellynch paths with parameterized variables"
echo "✅ Used \${DEVELOPER_DIR}, \${USER_HOME}, \${CONFIG_DIR} variables"
echo "✅ Backups created with .backup extension"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Test that all scripts still work with parameterized paths"
echo "2. Remove backup files after verification"
echo "3. Update any remaining hardcoded references"