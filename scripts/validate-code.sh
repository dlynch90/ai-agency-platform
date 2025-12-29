#!/bin/bash

# Validation Script - Run before commits
# Ensures code quality, tests pass, and no TypeScript errors

set -e

echo "🔍 Running code validation..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0

# 1. Type checking
echo "📝 Running TypeScript type check..."
if npm run type-check 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Type check passed"
else
    echo -e "${RED}✗${NC} Type check failed"
    FAILED=1
fi
echo ""

# 2. Linting
echo "🔧 Running ESLint..."
if npm run lint 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Linting passed"
else
    echo -e "${RED}✗${NC} Linting failed"
    FAILED=1
fi
echo ""

# 3. Run tests
echo "🧪 Running tests..."
if npm test -- --run 2>/dev/null; then
    echo -e "${GREEN}✓${NC} All tests passed"
else
    echo -e "${RED}✗${NC} Tests failed"
    FAILED=1
fi
echo ""

# 4. Check for debugging code
echo "🔎 Checking for debugging code..."
if git diff --cached --name-only | xargs grep -l "console\.log\|debugger" 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC} Found debugging code (console.log or debugger)"
    echo "  Consider removing before committing"
else
    echo -e "${GREEN}✓${NC} No debugging code found"
fi
echo ""

# 5. Check for TODOs
echo "📋 Checking for TODOs..."
TODO_COUNT=$(git diff --cached --name-only | xargs grep -c "TODO\|FIXME" 2>/dev/null || echo "0")
if [ "$TODO_COUNT" -gt "0" ]; then
    echo -e "${YELLOW}⚠${NC} Found $TODO_COUNT TODO/FIXME comments"
    echo "  Make sure they're tracked"
else
    echo -e "${GREEN}✓${NC} No untracked TODOs"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All validation checks passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some validation checks failed${NC}"
    echo "Fix the issues above before committing"
    exit 1
fi
