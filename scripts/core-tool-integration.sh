#!/bin/bash
# Core Tool Integration - Uses chezmoi for vendor-only configurations

echo "🔧 Setting up Core Tool Integrations via Chezmoi..."

# Use chezmoi to manage vendor-only configurations
if command -v chezmoi >/dev/null 2>&1; then
    echo "✅ Using chezmoi for vendor-only configuration management"
else
    echo "❌ chezmoi not available - install with: brew install chezmoi"
fi

# Load vendor-provided configurations via chezmoi (no custom code)
echo "📋 Loading chezmoi-managed vendor configurations..."

# Apply chezmoi configuration for aliases
if command -v chezmoi >/dev/null 2>&1; then
    chezmoi apply --force 2>/dev/null || echo "⚠️ Chezmoi apply failed - initialize with: chezmoi init"
fi

# Load vendor-provided alias configurations
VENDOR_CONFIG_FILE="$HOME/Developer/.vendor-config/aliases.sh"
if [ -f "$VENDOR_CONFIG_FILE" ]; then
    source "$VENDOR_CONFIG_FILE"
    echo "✅ Loaded vendor-only aliases"
else
    echo "⚠️ Vendor configuration not found at $VENDOR_CONFIG_FILE"
fi

# Development workflow
alias dev='cd "${DEVELOPER_DIR:-$HOME/Developer}"'
alias run='pixi run'
alias test='pixi run test'
alias build='pixi run build'

# Code quality shortcuts
alias lint='ruff check && mypy'
alias format='ruff format'
alias check='lint && test'

# Search shortcuts
alias findpy='fd "\.py$"'
alias findjs='fd "\.js$|\.ts$|\.jsx$|\.tsx$"'
alias findmd='fd "\.md$"'


echo "✅ Core tool integrations complete!"
echo ""
echo "Available shortcuts:"
echo "  Navigation: .., ..., ...., dev"
echo "  Development: run, test, build, check"
echo "  Code: lint, format, findpy, findjs, findmd"
echo "  Git: gs, ga, gc, gp, gl"
echo "  Files: find, grep, cat (now fd, rg, bat)"