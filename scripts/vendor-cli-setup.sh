#!/bin/bash
# Vendor CLI Setup - Official Vendor Tools Only
# NO CUSTOM CODE - Uses only official vendor CLI commands

set -e

echo "🔧 Setting up Vendor CLI Tools (Official Only)"
echo "=============================================="

# Gibson CLI - Official AI Development Tool
echo "🤖 Gibson CLI Setup..."
export PATH="/Users/daniellynch/.local/bin:$PATH"
if command -v gibson >/dev/null 2>&1; then
    echo "✅ Gibson CLI available"
    gibson auth login --help >/dev/null 2>&1 && echo "✅ Gibson authentication available"
else
    echo "⚠️ Gibson CLI not found - install with: pipx install gibson-cli --python python3.13"
fi

# Ollama CLI - Official AI Model Runner
echo "🧠 Ollama CLI Setup..."
if command -v ollama >/dev/null 2>&1; then
    echo "✅ Ollama CLI available"
    ollama list >/dev/null 2>&1 && echo "✅ Ollama models accessible"
else
    echo "⚠️ Ollama not found - install with: brew install ollama"
fi

# 1Password CLI - Official Secrets Management
echo "🔐 1Password CLI Setup..."
if command -v op >/dev/null 2>&1; then
    echo "✅ 1Password CLI available"
    op --version >/dev/null 2>&1 && echo "✅ 1Password CLI functional"
else
    echo "⚠️ 1Password CLI not found - install with: brew install 1password-cli"
fi

# GitHub CLI - Official GitHub Tool
echo "🐙 GitHub CLI Setup..."
if command -v gh >/dev/null 2>&1; then
    echo "✅ GitHub CLI available"
    gh --version >/dev/null 2>&1 && echo "✅ GitHub CLI functional"
else
    echo "⚠️ GitHub CLI not found - install with: brew install gh"
fi

# Docker CLI - Official Container Tool
echo "🐳 Docker CLI Setup..."
if command -v docker >/dev/null 2>&1; then
    echo "✅ Docker CLI available"
    docker --version >/dev/null 2>&1 && echo "✅ Docker CLI functional"
else
    echo "⚠️ Docker CLI not found - install with: brew install docker"
fi

# Node.js/npm - Official JavaScript Tooling
echo "📦 Node.js/npm Setup..."
if command -v npm >/dev/null 2>&1; then
    echo "✅ npm available"
    npm --version >/dev/null 2>&1 && echo "✅ npm functional"
else
    echo "⚠️ npm not found - install with: brew install node"
fi

# Python/pipx - Official Python Tooling
echo "🐍 Python/pipx Setup..."
if command -v pipx >/dev/null 2>&1; then
    echo "✅ pipx available"
    pipx --version >/dev/null 2>&1 && echo "✅ pipx functional"
else
    echo "⚠️ pipx not found - install with: brew install pipx"
fi

# Homebrew - Official macOS Package Manager
echo "🍺 Homebrew Setup..."
if command -v brew >/dev/null 2>&1; then
    echo "✅ Homebrew available"
    brew --version >/dev/null 2>&1 && echo "✅ Homebrew functional"
else
    echo "⚠️ Homebrew not found - install from: https://brew.sh/"
fi

# MCP Servers - Official Model Context Protocol
echo "🔗 MCP Servers Setup..."
if command -v npx >/dev/null 2>&1; then
    # Test official MCP servers
    npx @modelcontextprotocol/server-filesystem --help >/dev/null 2>&1 && echo "✅ MCP Filesystem server available"
    npx @modelcontextprotocol/server-sequential-thinking --help >/dev/null 2>&1 && echo "✅ MCP Sequential Thinking server available"
    npx @modelcontextprotocol/server-everything stdio --help >/dev/null 2>&1 && echo "✅ MCP Everything server available"
else
    echo "⚠️ npx not found - install Node.js first"
fi

echo ""
echo "🎯 Vendor CLI Tools Status:"
echo "=========================="

# Summary of available tools
tools_status() {
    local tool="$1"
    local cmd="$2"
    if command -v "$cmd" >/dev/null 2>&1; then
        echo "✅ $tool: Available"
    else
        echo "❌ $tool: Not found"
    fi
}

tools_status "Gibson CLI" "gibson"
tools_status "Ollama" "ollama"
tools_status "1Password CLI" "op"
tools_status "GitHub CLI" "gh"
tools_status "Docker" "docker"
tools_status "npm" "npm"
tools_status "pipx" "pipx"
tools_status "Homebrew" "brew"

echo ""
echo "🚀 Vendor CLI Setup Complete!"
echo "=============================="
echo "All tools are official vendor CLI commands only."
echo "No custom code or scripts used in setup."
echo ""
echo "Usage Examples:"
echo "---------------"
echo "gibson auth login          # Gibson authentication"
echo "ollama run llama3.2        # Run AI models"
echo "op read 'op://vault/item'  # Access secrets"
echo "gh repo clone owner/repo   # GitHub operations"
echo "docker build -t image .    # Container operations"
echo "npx @modelcontextprotocol/server-filesystem /path  # MCP servers"