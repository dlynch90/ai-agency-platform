#!/bin/bash
# CURSOR IDE PRE-COMMIT HOOK - MAXIMUM ENFORCEMENT
# Blocks commits that violate directory structure and vendor compliance

set -e

echo "🔍 CURSOR IDE Structure Enforcement - Pre-Commit Hook"
echo "=================================================="

# Check 1: Directory Structure Validation
echo "📁 Checking directory structure..."
MANDATED_DIRS=("docs" "src" "testing" "infra" "data" "api" "graphql" "federation" "logs")
ACTUAL_DIRS=$(find . -maxdepth 1 -type d | sed 's|^\./||' | grep -v "^\.$" | grep -v "node_modules" | sort)

VIOLATION_COUNT=0

# Check for extra directories
for dir in $ACTUAL_DIRS; do
    if [[ ! " ${MANDATED_DIRS[@]} " =~ " ${dir} " ]]; then
        echo "❌ VIOLATION: Unauthorized directory '$dir' found"
        ((VIOLATION_COUNT++))
    fi
done

# Check for missing mandated directories
for mandated in "${MANDATED_DIRS[@]}"; do
    if [[ ! -d "$mandated" ]]; then
        echo "❌ VIOLATION: Missing mandated directory '$mandated'"
        ((VIOLATION_COUNT++))
    fi
done

# Check 2: Custom Script Detection
echo "🐚 Checking for custom shell scripts..."
SHELL_SCRIPTS=$(find . -name "*.sh" -type f | grep -v node_modules | wc -l)
if [[ $SHELL_SCRIPTS -gt 0 ]]; then
    echo "❌ VIOLATION: $SHELL_SCRIPTS custom shell scripts found (violates NO CUSTOM CODE rule)"
    find . -name "*.sh" -type f | grep -v node_modules | head -5
    ((VIOLATION_COUNT++))
fi

# Check 3: File Location Enforcement
echo "📄 Checking file location compliance..."

# Python files should only be in src/
PYTHON_OUTSIDE_SRC=$(find . -name "*.py" -type f | grep -v "^\./src/" | grep -v node_modules | grep -v __pycache__ | wc -l)
if [[ $PYTHON_OUTSIDE_SRC -gt 0 ]]; then
    echo "❌ VIOLATION: $PYTHON_OUTSIDE_SRC Python files outside /src/ directory"
    ((VIOLATION_COUNT++))
fi

# JS/TS files should only be in src/
JS_OUTSIDE_SRC=$(find . -name "*.js" -o -name "*.ts" | grep -v "^\./src/" | grep -v node_modules | wc -l)
if [[ $JS_OUTSIDE_SRC -gt 0 ]]; then
    echo "❌ VIOLATION: $JS_OUTSIDE_SRC JS/TS files outside /src/ directory"
    ((VIOLATION_COUNT++))
fi

# Markdown files should only be in docs/
MD_OUTSIDE_DOCS=$(find . -name "*.md" -type f | grep -v "^\./docs/" | wc -l)
if [[ $MD_OUTSIDE_DOCS -gt 0 ]]; then
    echo "❌ VIOLATION: $MD_OUTSIDE_DOCS Markdown files outside /docs/ directory"
    ((VIOLATION_COUNT++))
fi

# Check 4: Git Repository Health
echo "🔧 Checking git repository health..."
UNTRACKED_FILES=$(git status --porcelain | wc -l)
if [[ $UNTRACKED_FILES -gt 10 ]]; then
    echo "❌ VIOLATION: $UNTRACKED_FILES untracked files (repository polluted)"
    ((VIOLATION_COUNT++))
fi

# Check 5: Vendor Compliance
echo "🏢 Checking vendor compliance..."
CONSOLE_LOG_USAGE=$(grep -r "console\.log" src/ 2>/dev/null | wc -l || echo 0)
WINSTON_USAGE=$(grep -r "winston\." src/ 2>/dev/null | wc -l || echo 0)

if [[ $CONSOLE_LOG_USAGE -gt 0 ]]; then
    echo "❌ VIOLATION: $CONSOLE_LOG_USAGE console.log statements (use Pino instead)"
    ((VIOLATION_COUNT++))
fi

if [[ $WINSTON_USAGE -gt 0 ]]; then
    echo "❌ VIOLATION: $WINSTON_USAGE winston usage (use Pino instead)"
    ((VIOLATION_COUNT++))
fi

# Final verdict
echo "=================================================="
if [[ $VIOLATION_COUNT -gt 0 ]]; then
    echo "❌ COMMIT BLOCKED: $VIOLATION_COUNT violations found"
    echo ""
    echo "🚨 REMEDIATION REQUIRED:"
    echo "1. Fix directory structure (exactly 8 mandated directories)"
    echo "2. Remove all custom shell scripts (*.sh files)"
    echo "3. Move files to correct directories:"
    echo "   - Python files → /src/"
    echo "   - JS/TS files → /src/"
    echo "   - Markdown files → /docs/"
    echo "   - Test files → /testing/"
    echo "4. Replace console.log/winston with Pino"
    echo "5. Clean git repository (remove untracked files)"
    echo ""
    echo "💡 Use 'make standardize' or 'just standardize' to auto-fix"
    exit 1
else
    echo "✅ ALL CHECKS PASSED - Commit allowed"
    echo "🎉 Repository structure compliant with Cursor IDE rules"
    exit 0
fi