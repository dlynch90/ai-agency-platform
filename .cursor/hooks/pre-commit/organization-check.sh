#!/usr/bin/env bash
# Pre-commit hook: Enforce monorepo organization rules

set -euo pipefail

WORKSPACE_DIR="${HOME}/Developer"

# Allowed files in root (standard monorepo files)
ALLOWED_ROOT_FILES=(
    "package.json"
    "pixi.toml"
    "pixi.lock"
    "pnpm-lock.yaml"
    "README.md"
    "LICENSE"
    ".gitignore"
    ".gitattributes"
    "tsconfig.json"
    "turbo.json"
)

# Check for loose files in root
LOOSE_FILES=()
while IFS= read -r file; do
    local basename_file
    basename_file=$(basename "$file")
    local is_allowed=false
    
    for allowed in "${ALLOWED_ROOT_FILES[@]}"; do
        if [ "$basename_file" == "$allowed" ]; then
            is_allowed=true
            break
        fi
    done
    
    if [ "$is_allowed" == false ]; then
        LOOSE_FILES+=("$basename_file")
    fi
done < <(find "$WORKSPACE_DIR" -maxdepth 1 -type f ! -name ".*" 2>/dev/null)

if [ ${#LOOSE_FILES[@]} -gt 0 ]; then
    echo "❌ VIOLATION: Found ${#LOOSE_FILES[@]} loose files in root directory"
    echo "Files that must be moved:"
    printf '  - %s\n' "${LOOSE_FILES[@]}"
    echo ""
    echo "📁 Organization Requirements:"
    echo "  *.md files → /docs/ directory"
    echo "  *.sh files → /scripts/ directory"
    echo "  *.toml/*.json/*.yaml files → /configs/ directory"
    echo ""
    echo "Run: bash scripts/organize-monorepo-structure.sh"
    exit 1
fi

# Check for backup files
BACKUP_FILES=$(find "$WORKSPACE_DIR" -maxdepth 1 -type f \( -name "*.backup" -o -name "*backup*" \) 2>/dev/null | wc -l)
if [ "$BACKUP_FILES" -gt 0 ]; then
    echo "⚠️ Found $BACKUP_FILES backup files in root - consider moving to configs/backups/"
fi

# Check for problematic directory names
if [ -d "$WORKSPACE_DIR/--version" ] || [ -d "$WORKSPACE_DIR/~" ]; then
    echo "❌ VIOLATION: Found problematic directories (--version or ~)"
    echo "Run: bash scripts/organize-monorepo-structure.sh"
    exit 1
fi

echo "✅ Monorepo organization check passed"
exit 0
