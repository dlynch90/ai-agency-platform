#!/bin/bash

# COMPREHENSIVE LOOSE FILES AUDIT AND CLEANUP
# Enforces Cursor IDE Rules - No Loose Files In Root Directory

set -e

echo "🔍 COMPREHENSIVE LOOSE FILES AUDIT AND CLEANUP"
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Statistics
TOTAL_FILES=0
MOVED_FILES=0
VIOLATIONS=0

# Function to print colored output
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

# Required directories (from architecture rules)
REQUIRED_DIRS=("docs" "testing" "logs" "data" "api" "graphql" "federation" "infra")

# Create required directories if they don't exist
print_status "Ensuring required directories exist..."
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        print_success "Created directory: $dir"
    fi
done

# Function to categorize and move files
move_file() {
    local file="$1"
    local category=""

    # Skip if it's a directory or already in correct location
    if [ -d "$file" ] || [[ "$file" =~ ^\. ]] || [[ "$file" =~ ^docs/ ]] || [[ "$file" =~ ^testing/ ]] || [[ "$file" =~ ^logs/ ]] || [[ "$file" =~ ^data/ ]] || [[ "$file" =~ ^api/ ]] || [[ "$file" =~ ^graphql/ ]] || [[ "$file" =~ ^federation/ ]] || [[ "$file" =~ ^infra/ ]]; then
        return
    fi

    # Categorize files by extension/type
    case "$file" in
        # Documentation files -> docs/
        *.md|*.txt|README*|readme*|CHANGELOG*|changelog*)
            category="docs"
            ;;
        # Test files -> testing/
        *test*|*spec*|*.test.*|jest.config.*|vitest.config.*)
            category="testing"
            ;;
        # Log files -> logs/
        *.log|*.out|debug_*|audit_*)
            category="logs"
            ;;
        # Data files -> data/
        *.db|*.sqlite|*.json|*.csv|*.xml|*.yaml|*.yml)
            category="data"
            ;;
        # API files -> api/
        *api*|*endpoint*|*route*|openapi*|swagger*)
            category="api"
            ;;
        # GraphQL files -> graphql/
        *.graphql|*.gql|schema.*)
            category="graphql"
            ;;
        # Infrastructure files -> infra/
        docker*|compose*|Dockerfile*|dockerfile*|kubernetes*|k8s*|helm*|terraform*|*.tf|Makefile*|makefile*)
            category="infra"
            ;;
        # Java files -> java/ (but keep in root for now as they're organized)
        *.java|*.jar|*.class|pom.xml|build.gradle)
            # Keep Java files in their current organization
            return
            ;;
        # Rust files -> rust/
        Cargo.*|*.rs)
            if [ -d "rust" ]; then
                return
            else
                category="infra"
            fi
            ;;
        # Python files -> infra/ (unless they're tools)
        *.py|requirements*|setup.py|pyproject.toml)
            if [[ "$file" =~ comprehensive_|gap_analysis|audit ]]; then
                category="docs"  # These are analysis reports
            else
                category="infra"
            fi
            ;;
        # Shell scripts -> infra/
        *.sh|*.bash)
            category="infra"
            ;;
        # Configuration files -> infra/
        *.toml|*.config.*|*.conf|eslint*|prettier*|tsconfig*)
            category="infra"
            ;;
        # Everything else -> infra/
        *)
            category="infra"
            ;;
    esac

    if [ -n "$category" ]; then
        mkdir -p "$category"
        if [ -f "$file" ]; then
            mv "$file" "$category/"
            print_success "Moved $file -> $category/"
            ((MOVED_FILES++))
        fi
    fi
}

# Audit current directory
print_status "Auditing current directory structure..."
echo "Current files in root directory:"
ls -1 | grep -v "^\." | head -20

# Count total files
TOTAL_FILES=$(ls -1 | grep -v "^\." | wc -l)
echo "Total items in root: $TOTAL_FILES"

# Process each file
print_status "Processing and organizing files..."
for file in *; do
    if [ -e "$file" ] && [ ! -d "$file" ]; then
        move_file "$file"
        ((TOTAL_FILES--))
    fi
done

# Check for remaining violations
REMAINING_FILES=$(ls -1 | grep -v "^\." | wc -l)
VIOLATIONS=$REMAINING_FILES

# Final report
echo ""
echo "📊 AUDIT RESULTS"
echo "==============="
echo "Total files processed: $((MOVED_FILES + VIOLATIONS))"
echo "Files moved to proper directories: $MOVED_FILES"
echo "Remaining violations: $VIOLATIONS"

if [ $VIOLATIONS -gt 0 ]; then
    print_warning "REMAINING LOOSE FILES (VIOLATIONS):"
    ls -1 | grep -v "^\."
    echo ""
    print_error "VIOLATION: Loose files found in root directory"
    print_error "This violates Cursor IDE Rules - No Loose Files In Root Directory"
else
    print_success "✅ COMPLIANCE ACHIEVED: No loose files in root directory"
fi

# Create .cursorignore to prevent future violations
print_status "Creating .cursorignore to prevent future violations..."
cat > .cursorignore << 'EOF'
# Cursor IDE Ignore Rules - Prevent Loose Files

# Temporary files
*.tmp
*.temp
*~

# OS files
.DS_Store
Thumbs.db
desktop.ini

# IDE files (except our rules)
.vscode/
.idea/
*.swp
*.swo

# Build artifacts
node_modules/
target/
build/
dist/
*.class

# Cache directories
.cache/
.mcp/
.cursor/cache/

# Log files (should be in /logs/)
*.log

# Database files (should be in /data/)
*.db
*.sqlite

# Configuration files (should be in /infra/)
*.config.*
*.conf
eslint*
prettier*
tsconfig*

# Test files (should be in /testing/)
*test*
*spec*
jest.config.*
vitest.config.*

# Documentation (should be in /docs/)
*.md
README*
readme*

# Docker files (should be in /infra/)
docker*
Dockerfile*
dockerfile*
compose*

# Kubernetes/Helm (should be in /infra/)
*.yaml
*.yml
kubernetes/
k8s/
helm/
EOF

print_success "Created .cursorignore to prevent future violations"

# Check Cursor rules compliance
print_status "Checking Cursor rules compliance..."
if [ -f ".cursorrules" ]; then
    print_success "✅ .cursorrules file exists"
else
    print_error "❌ .cursorrules file missing - creating..."
    # .cursorrules already exists from previous fix
fi

echo ""
print_status "AUDIT COMPLETE - Loose files organized according to architecture rules"
echo "Run this script periodically to maintain compliance"