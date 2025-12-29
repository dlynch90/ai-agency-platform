#!/bin/bash

# Enforce Cursor IDE rules and coding standards

echo "🔍 Enforcing Cursor IDE Rules..."

# Check for custom code violations
CUSTOM_FILES=$(find . -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.sh" | xargs grep -l "custom\|Custom" 2>/dev/null | wc -l)

if [ "$CUSTOM_FILES" -gt 0 ]; then
    echo "⚠️  WARNING: Found $CUSTOM_FILES files with potential custom code violations"
    echo "Files with 'custom' references:"
    find . -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.sh" | xargs grep -l "custom\|Custom" 2>/dev/null
else
    echo "✅ No custom code violations found"
fi

# Check for hardcoded paths
HARDCODED_PATHS=$(grep -r "/Users/\|/home/\|/opt/" --include="*.js" --include="*.ts" --include="*.py" . 2>/dev/null | wc -l)

if [ "$HARDCODED_PATHS" -gt 0 ]; then
    echo "⚠️  WARNING: Found $HARDCODED_PATHS potential hardcoded path violations"
else
    echo "✅ No hardcoded path violations found"
fi

# Check for // CONSOLE_LOG_VIOLATION: console.log statements
CONSOLE_LOGS=$(grep -r "console\.log" --include="*.js" --include="*.ts" . 2>/dev/null | wc -l)

if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo "⚠️  WARNING: Found $CONSOLE_LOGS // CONSOLE_LOG_VIOLATION: console.log statements (should use vendor logging)"
else
    echo "✅ No // CONSOLE_LOG_VIOLATION: console.log violations found"
fi

echo "🎯 Cursor rules enforcement completed"
