#!/bin/bash
# Path & Symlink Validator
# Validates all critical paths and symlinks in the development environment

set -euo pipefail

DEVELOPER_DIR="${DEVELOPER_DIR:-$HOME/Developer}"
ERRORS=0

validate_path() {
    local path=$1
    local desc=$2
    
    if [ -e "$path" ]; then
        echo "[OK] $desc: $path"
    else
        echo "[MISSING] $desc: $path"
        ((ERRORS++)) || true
    fi
}

validate_symlink() {
    local link=$1
    local desc=$2
    
    if [ -L "$link" ]; then
        if [ -e "$link" ]; then
            echo "[OK] $desc: $link -> $(readlink "$link")"
        else
            echo "[BROKEN] $desc: $link -> $(readlink "$link")"
            ((ERRORS++)) || true
        fi
    else
        echo "[SKIP] $desc: $link (not a symlink)"
    fi
}

echo "=== Path & Symlink Validation ==="
echo ""

echo "--- Core Directories ---"
validate_path "$DEVELOPER_DIR" "Developer directory"
validate_path "$DEVELOPER_DIR/.pixi" "Pixi directory"
validate_path "$DEVELOPER_DIR/scripts" "Scripts directory"
validate_path "$DEVELOPER_DIR/logs" "Logs directory"

echo ""
echo "--- Configuration Files ---"
validate_path "$DEVELOPER_DIR/.mise.toml" "Mise config"
validate_path "$DEVELOPER_DIR/pixi.toml" "Pixi config"
validate_path "$DEVELOPER_DIR/pyproject.toml" "Python project config"
validate_path "$DEVELOPER_DIR/package.json" "Node.js package config"

echo ""
echo "--- Pixi Environments ---"
for env in "$DEVELOPER_DIR/.pixi/envs"/*; do
    if [ -d "$env" ]; then
        validate_path "$env" "Pixi env: $(basename "$env")"
    fi
done

echo ""
echo "--- Broken Symlinks Scan ---"
broken=$(find "$DEVELOPER_DIR" -type l ! -exec test -e {} \; -print 2>/dev/null | head -20)
if [ -n "$broken" ]; then
    echo "Found broken symlinks:"
    echo "$broken" | while read -r link; do
        echo "  [BROKEN] $link -> $(readlink "$link" 2>/dev/null || echo 'unknown')"
        ((ERRORS++)) || true
    done
else
    echo "No broken symlinks found"
fi

echo ""
echo "=== Validation Complete ==="
echo "Total errors: $ERRORS"

exit $ERRORS
