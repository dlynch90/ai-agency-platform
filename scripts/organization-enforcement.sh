#!/bin/bash

# ORGANIZATION ENFORCEMENT PRE-COMMIT HOOK
# Prevent loose files and enforce vendor solutions

set -e

echo "🔍 Running organization enforcement checks..."

# Check for loose files in root directory
check_loose_files() {
    echo "📁 Checking for loose files in root directory..."

    # Allowed files in root
    ALLOWED_ROOT_FILES=(
        "pixi.toml" "pixi.lock" "package.json" "package-lock.json"
        "yarn.lock" "Makefile" "justfile" "Taskfile.yml" "README.md"
        "LICENSE" ".gitignore" ".cursorignore" ".eslintrc.js" "tsconfig.json"
        "turbo.json" "pyproject.toml" ".prettierrc" ".prettierignore"
    )

    # Find loose files (not starting with dot, not in allowed list)
    LOOSE_FILES=$(find . -maxdepth 1 -type f -not -name '.*' | grep -v -E '\.(toml|json|md|lock)$' || true)

    if [ -n "$LOOSE_FILES" ]; then
        echo "❌ FOUND LOOSE FILES IN ROOT DIRECTORY:"
        echo "$LOOSE_FILES"
        echo ""
        echo "💡 SOLUTION: Move these files to appropriate directories:"
        echo "   - Scripts → scripts/"
        echo "   - Configs → configs/"
        echo "   - Docs → docs/"
        echo "   - Tests → testing/"
        echo "   - Data → data/"
        return 1
    fi

    echo "✅ No loose files found in root directory"
    return 0
}

# Check for hardcoded paths and values
check_hardcoded_values() {
    echo "🔒 Checking for hardcoded paths and values..."

    # Check for hardcoded absolute paths
    HARDCODED_PATHS=$(git diff --cached --name-only | xargs grep -l "/Users/daniellynch/Developer" 2>/dev/null || true)

    if [ -n "$HARDCODED_PATHS" ]; then
        echo "❌ FOUND HARDCODED PATHS:"
        echo "$HARDCODED_PATHS"
        echo ""
        echo "💡 SOLUTION: Use relative paths or environment variables"
        return 1
    fi

    # Check for hardcoded localhost/127.0.0.1 in non-config files
    HARDCODED_CONNECTIONS=$(git diff --cached --name-only | xargs grep -l "localhost\|127\.0\.0\.1" 2>/dev/null | grep -v -E '\.(toml|json|yaml|yml)$' || true)

    if [ -n "$HARDCODED_CONNECTIONS" ]; then
        echo "❌ FOUND HARDCODED CONNECTIONS IN CODE:"
        echo "$HARDCODED_CONNECTIONS"
        echo ""
        echo "💡 SOLUTION: Use environment variables or config files"
        return 1
    fi

    echo "✅ No hardcoded values found"
    return 0
}

# Check for custom implementations that should use vendor solutions
check_vendor_compliance() {
    echo "🏢 Checking vendor compliance..."

    # Check for custom scripts that should use vendor tools
    CUSTOM_SCRIPTS=$(git diff --cached --name-only | grep -E '\.(sh|cjs|js)$' | xargs grep -l "docker run\|kubectl\|npm install\|pip install" 2>/dev/null || true)

    if [ -n "$CUSTOM_SCRIPTS" ]; then
        echo "❌ FOUND CUSTOM INFRASTRUCTURE SCRIPTS:"
        echo "$CUSTOM_SCRIPTS"
        echo ""
        echo "💡 SOLUTION: Replace with vendor tools:"
        echo "   - Docker: Use docker-compose or vendor orchestration"
        echo "   - Kubernetes: Use helm charts or vendor operators"
        echo "   - Package management: Use pixi/dependency management tools"
        return 1
    fi

    echo "✅ Vendor compliance maintained"
    return 0
}

# Run all checks
FAILED_CHECKS=0

if ! check_loose_files; then
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

if ! check_hardcoded_values; then
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

if ! check_vendor_compliance; then
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

if [ $FAILED_CHECKS -gt 0 ]; then
    echo ""
    echo "❌ COMMIT BLOCKED: $FAILED_CHECKS organization violations found"
    echo ""
    echo "🔧 To fix:"
    echo "1. Move loose files to appropriate directories"
    echo "2. Replace hardcoded values with environment variables"
    echo "3. Use vendor solutions instead of custom implementations"
    echo ""
    echo "📚 See docs/organization-standards.md for guidelines"
    exit 1
fi

echo "✅ All organization checks passed!"
exit 0