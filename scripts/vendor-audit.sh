#!/bin/bash
# Vendor Tool Audit Script
# Checks all vendor CLI tools and their configurations

set -euo pipefail

DEVELOPER_DIR="${DEVELOPER_DIR:-$HOME/Developer}"

echo "=== Vendor Tool Audit ==="
echo ""

check_tool() {
    local name=$1
    local cmd=$2
    local version_flag=${3:---version}
    
    if command -v "$cmd" >/dev/null 2>&1; then
        local version=$($cmd $version_flag 2>&1 | head -1 || echo "unknown")
        echo "[OK] $name: $version"
    else
        echo "[MISSING] $name: not installed"
    fi
}

echo "--- Package Managers ---"
check_tool "mise" "mise" "--version"
check_tool "pixi" "pixi" "--version"
check_tool "uv" "uv" "--version"
check_tool "npm" "npm" "--version"
check_tool "pnpm" "pnpm" "--version"
check_tool "bun" "bun" "--version"
check_tool "cargo" "cargo" "--version"
check_tool "go" "go" "version"
check_tool "pip" "pip" "--version"

echo ""
echo "--- Development Tools ---"
check_tool "gh" "gh" "--version"
check_tool "git" "git" "--version"
check_tool "docker" "docker" "--version"
check_tool "kubectl" "kubectl" "version --client"
check_tool "terraform" "terraform" "--version"

echo ""
echo "--- Code Quality ---"
check_tool "ast-grep" "ast-grep" "--version"
check_tool "ruff" "ruff" "--version"
check_tool "eslint" "eslint" "--version"
check_tool "prettier" "prettier" "--version"

echo ""
echo "--- Environment Status ---"
echo "Broken symlinks: $(find "$DEVELOPER_DIR" -type l ! -exec test -e {} \; -print 2>/dev/null | wc -l | tr -d ' ')"
echo "Total size: $(du -sh "$DEVELOPER_DIR" 2>/dev/null | cut -f1)"
echo "Node modules dirs: $(find "$DEVELOPER_DIR" -maxdepth 3 -type d -name "node_modules" 2>/dev/null | wc -l | tr -d ' ')"
echo "Python venvs: $(find "$DEVELOPER_DIR" -maxdepth 2 -type d -name ".venv" -o -name "venv*" 2>/dev/null | wc -l | tr -d ' ')"

echo ""
echo "--- Mise Tool Status ---"
if command -v mise >/dev/null 2>&1; then
    mise doctor 2>&1 | grep -E "(installed|not installed|problem)" | head -10 || echo "Mise OK"
fi

echo ""
echo "=== Audit Complete ==="
