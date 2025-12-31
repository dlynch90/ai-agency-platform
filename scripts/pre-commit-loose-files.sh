#!/bin/bash
# Pre-commit hook to prevent loose files in root directory

ROOT_DIR="/Users/daniellynch/Developer"
ALLOWED_ROOT_FILES="pixi.toml package.json package-lock.json yarn.lock pnpm-lock.yaml Cargo.toml go.mod go.sum requirements.txt Pipfile Pipfile.lock poetry.lock Makefile justfile Taskfile.yml Taskfile.yaml README.md LICENSE .gitignore .gitattributes docker-compose.yml docker-compose.yaml"

ALLOWED_ROOT_DIRS="docs scripts configs testing infra data api graphql federation logs tools node_modules .pixi .venv __pycache__ packages apps services libs mcp"

# Check for loose files
LOOSE_FILES=""
for file in "$ROOT_DIR"/*; do
    if [ -f "$file" ]; then
        basename=$(basename "$file")
        if ! echo "$ALLOWED_ROOT_FILES" | grep -q "$basename"; then
            LOOSE_FILES="$LOOSE_FILES $file"
        fi
    fi
done

# Check for loose directories
LOOSE_DIRS=""
for dir in "$ROOT_DIR"/*; do
    if [ -d "$dir" ] && [ "$(basename "$dir")" != ".git" ] && [ "$(basename "$dir")" != ".cursor" ]; then
        basename=$(basename "$dir")
        if ! echo "$ALLOWED_ROOT_DIRS" | grep -q "$basename"; then
            LOOSE_DIRS="$LOOSE_DIRS $dir"
        fi
    fi
done

if [ -n "$LOOSE_FILES" ] || [ -n "$LOOSE_DIRS" ]; then
    echo "❌ LOOSE FILES/DIRECTORIES DETECTED IN ROOT:"
    [ -n "$LOOSE_FILES" ] && echo "Files:$LOOSE_FILES"
    [ -n "$LOOSE_DIRS" ] && echo "Directories:$LOOSE_DIRS"
    echo "Please organize files according to monorepo architecture"
    exit 1
fi

exit 0
