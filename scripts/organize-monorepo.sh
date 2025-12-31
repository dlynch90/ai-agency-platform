#!/bin/bash

# Monorepo Architecture Organization Script
# Reorganizes loose files and directories according to established governance rules

set -e

echo "🔄 ORGANIZING MONOREPO ARCHITECTURE"
echo "==================================="

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

# Create necessary directories
print_status "Creating standardized directory structure..."

mkdir -p configs/ docs/ scripts/ testing/ data/ infra/ packages/ tools/

# Move loose files in root to appropriate locations
print_status "Moving loose files to proper locations..."

# Move package.json to packages/ (if it's a workspace root package)
if [ -f "package.json" ]; then
    if grep -q '"workspaces"' package.json; then
        print_status "Moving workspace package.json to packages/"
        mv package.json packages/package.json
    else
        print_status "Moving package.json to packages/"
        mv package.json packages/package.json
    fi
fi

# Move configuration files
if [ -f "pixi.lock" ]; then
    print_status "Moving pixi.lock to configs/"
    mv pixi.lock configs/pixi.lock
fi

if [ -f "tsconfig.json" ]; then
    print_status "Moving tsconfig.json to configs/"
    mv tsconfig.json configs/tsconfig.json
fi

if [ -f "turbo.json" ]; then
    print_status "Moving turbo.json to configs/"
    mv turbo.json configs/turbo.json
fi

if [ -f "lefthook.yml" ]; then
    print_status "Moving lefthook.yml to configs/"
    mv lefthook.yml configs/lefthook.yml
fi

# Move data files
if [ -f "mlflow.db" ]; then
    print_status "Moving mlflow.db to data/"
    mv mlflow.db data/mlflow.db
fi

# Reorganize misnamed directories
print_status "Reorganizing misnamed directories..."

# Move ADR reports to docs
if [ -d "adr-reports" ]; then
    print_status "Moving adr-reports to docs/"
    mv adr-reports/* docs/ 2>/dev/null || true
    rmdir adr-reports 2>/dev/null || true
fi

# Move chezmoi configs
if [ -d "chezmoi-configs" ]; then
    print_status "Moving chezmoi-configs to configs/"
    mv chezmoi-configs/* configs/ 2>/dev/null || true
    rmdir chezmoi-configs 2>/dev/null || true
fi

# Move config to configs (merge)
if [ -d "config" ]; then
    print_status "Merging config/ into configs/"
    mv config/* configs/ 2>/dev/null || true
    rmdir config 2>/dev/null || true
fi

# Move hooks to scripts
if [ -d "hooks" ]; then
    print_status "Moving hooks to scripts/"
    mv hooks/* scripts/ 2>/dev/null || true
    rmdir hooks 2>/dev/null || true
fi

# Move logs to data
if [ -d "logs" ]; then
    print_status "Moving logs to data/"
    mv logs/* data/ 2>/dev/null || true
    rmdir logs 2>/dev/null || true
fi

# Move MCP directories
if [ -d "mcp" ]; then
    print_status "Moving mcp to configs/"
    mv mcp/* configs/ 2>/dev/null || true
    rmdir mcp 2>/dev/null || true
fi

if [ -d "mcp-servers" ]; then
    print_status "Moving mcp-servers to tools/"
    mv mcp-servers/* tools/ 2>/dev/null || true
    rmdir mcp-servers 2>/dev/null || true
fi

if [ -d "temp-mcp" ]; then
    print_status "Moving temp-mcp to tools/"
    mv temp-mcp/* tools/ 2>/dev/null || true
    rmdir temp-mcp 2>/dev/null || true
fi

# Move language-specific directories
if [ -d "java" ]; then
    print_status "Moving java to packages/"
    mv java packages/
fi

if [ -d "rust" ]; then
    print_status "Moving rust to packages/"
    mv rust packages/
fi

if [ -d "src" ]; then
    print_status "Moving src to packages/"
    mv src packages/
fi

# Move storage
if [ -d "storage" ]; then
    print_status "Moving storage to data/"
    mv storage/* data/ 2>/dev/null || true
    rmdir storage 2>/dev/null || true
fi

# Move use-case directories to domains
if [ -d "use-case-1-ecommerce-personalization" ]; then
    print_status "Moving use-case-1-ecommerce-personalization to domains/"
    mkdir -p domains/ecommerce
    mv use-case-1-ecommerce-personalization/* domains/ecommerce/ 2>/dev/null || true
    rmdir use-case-1-ecommerce-personalization 2>/dev/null || true
fi

# Clean up empty directories
print_status "Cleaning up empty directories..."

# Remove empty directories
find . -maxdepth 1 -type d -empty -not -path "./.git" -not -path "./.*" | while read dir; do
    if [[ "$dir" != "./node_modules" && "$dir" != "./.pixi" && "$dir" != "./.cursor" ]]; then
        print_warning "Removing empty directory: $dir"
        rmdir "$dir" 2>/dev/null || true
    fi
done

# Remove build artifacts
if [ -d "pkg" ]; then
    print_status "Removing Go build artifacts (pkg/)"
    rm -rf pkg/
fi

if [ -d "target" ]; then
    print_status "Removing Rust build artifacts (target/)"
    rm -rf target/
fi

if [ -d "dist" ]; then
    print_status "Removing build artifacts (dist/)"
    rm -rf dist/
fi

if [ -d "pixi-universe" ]; then
    print_status "Removing temporary pixi-universe/"
    rm -rf pixi-universe/
fi

# Remove problematic directories
if [ -d "--version" ]; then
    print_status "Removing problematic --version/ directory"
    rm -rf --version/
fi

if [ -d "~" ]; then
    print_status "Removing problematic ~/ directory"
    rm -rf ~/
fi

# Update .gitignore to ignore build artifacts
print_status "Updating .gitignore for build artifacts..."

cat >> .gitignore << 'EOF'

# Build artifacts
dist/
build/
target/
pkg/
*.pyc
__pycache__/

# Package managers
node_modules/
.pixi/

# IDE
.vscode/
.idea/
.cursor/

# OS
.DS_Store
Thumbs.db
EOF

print_success "Monorepo organization completed!"
print_status "Summary of changes:"
echo "  ✅ Moved loose files to appropriate directories"
echo "  ✅ Reorganized misnamed directories"
echo "  ✅ Cleaned up empty directories"
echo "  ✅ Removed build artifacts"
echo "  ✅ Updated .gitignore"

echo ""
print_warning "Next steps:"
echo "  1. Review moved files for any broken references"
echo "  2. Update any hardcoded paths in moved files"
echo "  3. Run tests to ensure everything still works"
echo "  4. Commit the reorganization changes"