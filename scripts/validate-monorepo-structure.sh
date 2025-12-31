#!/bin/bash

# Monorepo Structure Validation Script
# Ensures compliance with architecture governance rules

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

ERRORS=0

print_status "Validating monorepo structure..."

# Check for loose files in root directory
print_status "Checking for loose files in root directory..."
LOOSE_FILES=$(find . -maxdepth 1 -type f -not -path "./.*" -not -name "pixi.toml" 2>/dev/null | wc -l)
if [ "$LOOSE_FILES" -gt 0 ]; then
    print_error "Found $LOOSE_FILES loose files in root directory:"
    find . -maxdepth 1 -type f -not -path "./.*" -not -name "pixi.toml"
    ((ERRORS++))
else
    print_success "No loose files in root directory"
fi

# Check for unauthorized directories in root (only critical violations)
print_status "Checking for critical structural violations..."
PROBLEMATIC_DIRS=$(find . -maxdepth 1 -type d \( -name "node_modules" -o -name "dist" -o -name "build" -o -name "target" -o -name "pkg" -o -name "__pycache__" \) 2>/dev/null | wc -l)

if [ "$PROBLEMATIC_DIRS" -gt 0 ]; then
    print_warning "Found build artifacts in root (these should be .gitignored):"
    find . -maxdepth 1 -type d \( -name "node_modules" -o -name "dist" -o -name "build" -o -name "target" -o -name "pkg" -o -name "__pycache__" \) 2>/dev/null
else
    print_success "No problematic build artifacts in root"
fi

# Check for files in wrong directories
print_status "Checking for misplaced files..."

# Markdown files should only be in docs/
MD_OUTSIDE_DOCS=$(find . -name "*.md" -not -path "./docs/*" -not -path "./vendor-imports/*" -not -path "./.git/*" 2>/dev/null | wc -l)
if [ "$MD_OUTSIDE_DOCS" -gt 0 ]; then
    print_warning "Found $MD_OUTSIDE_DOCS .md files outside docs/:"
    find . -name "*.md" -not -path "./docs/*" -not -path "./vendor-imports/*" -not -path "./.git/*" | head -5
fi

# Shell scripts should be in scripts/
SH_OUTSIDE_SCRIPTS=$(find . -name "*.sh" -not -path "./scripts/*" -not -path "./vendor-imports/*" -not -path "./.git/*" 2>/dev/null | wc -l)
if [ "$SH_OUTSIDE_SCRIPTS" -gt 0 ]; then
    print_warning "Found $SH_OUTSIDE_SCRIPTS .sh files outside scripts/:"
    find . -name "*.sh" -not -path "./scripts/*" -not -path "./vendor-imports/*" -not -path "./.git/*" | head -5
fi

# JSON/TOML/YAML configs should be in configs/
CONFIG_OUTSIDE_CONFIGS=$(find . -name "*.json" -o -name "*.toml" -o -name "*.yaml" -o -name "*.yml" | grep -v -E "(configs/|vendor-imports/|\.git/)" | wc -l)
if [ "$CONFIG_OUTSIDE_CONFIGS" -gt 0 ]; then
    print_warning "Found config files outside configs/:"
    find . \( -name "*.json" -o -name "*.toml" -o -name "*.yaml" -o -name "*.yml" \) -not -path "./configs/*" -not -path "./vendor-imports/*" -not -path "./.git/*" | head -5
fi

# Check for hardcoded paths (basic check)
print_status "Checking for potential hardcoded paths..."
HARDCODED_PATHS=$(grep -r "\.\./\|\./" --include="*.sh" --include="*.py" --include="*.js" --include="*.ts" scripts/ 2>/dev/null | grep -v "#\|//\|/\*" | wc -l)
if [ "$HARDCODED_PATHS" -gt 50 ]; then  # Allow some relative paths
    print_warning "Found many relative paths that might be hardcoded"
fi

# Check for missing vendor implementations
print_status "Checking for custom code that should use vendors..."

# Look for custom implementations that could use vendors
CUSTOM_HTTP=$(grep -r "http\." --include="*.py" --include="*.js" --include="*.ts" packages/ scripts/ 2>/dev/null | grep -v "import\|from\|#" | wc -l)
if [ "$CUSTOM_HTTP" -gt 10 ]; then
    print_warning "Found custom HTTP implementations - consider using vendor HTTP clients"
fi

# Check for custom file operations
CUSTOM_FILE_OPS=$(grep -r "fs\." --include="*.js" --include="*.ts" packages/ scripts/ 2>/dev/null | grep -v "import\|from\|//" | wc -l)
if [ "$CUSTOM_FILE_OPS" -gt 5 ]; then
    print_warning "Found custom file operations - consider using MCP filesystem server"
fi

# Summary
echo ""
if [ "$ERRORS" -eq 0 ]; then
    print_success "✅ Monorepo structure validation passed!"
    exit 0
else
    print_error "❌ Monorepo structure validation failed with $ERRORS errors"
    echo ""
    print_status "To fix these issues:"
    echo "  1. Move loose files to appropriate directories"
    echo "  2. Remove unauthorized directories"
    echo "  3. Run: ./scripts/organize-monorepo.sh"
    echo "  4. Replace custom code with vendor solutions"
    exit 1
fi