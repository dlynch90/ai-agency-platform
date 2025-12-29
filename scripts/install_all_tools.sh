#!/bin/bash

# Comprehensive AGI Environment Setup Script
# Installs all tools listed by user for complete development environment

set -e  # Exit on any error

echo "🚀 Starting Comprehensive AGI Environment Setup"
echo "=============================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install with brew if not exists
install_if_missing() {
    local tool=$1
    local brew_name=${2:-$1}

    if ! command_exists "$tool"; then
        echo "📦 Installing $tool..."
        brew install "$brew_name" || echo "⚠️  Failed to install $tool"
    else
        echo "✅ $tool already installed"
    fi
}

# Update Homebrew first
echo "🔄 Updating Homebrew..."
brew update

# File Management & Deduplication Tools
echo "📁 Installing File Management Tools..."
install_if_missing fclones fclones
install_if_missing fd fd
install_if_missing rmlint rmlint

# Terminal & Shell Tools
echo "💻 Installing Terminal & Shell Tools..."
install_if_missing tmux tmux
install_if_missing zoxide zoxide
install_if_missing yg yg
install_if_missing rg ripgrep
install_if_missing grep grep
install_if_missing blob blob
install_if_missing navi navi
install_if_missing htop htop
install_if_missing gh gh
install_if_missing pass pass
install_if_missing jq jq
install_if_missing yq yq
install_if_missing stow stow
install_if_missing tree tree
install_if_missing fzf fzf
install_if_missing atuin atuin
install_if_missing rectangle rectangle
install_if_missing hammerspoon hammerspoon
install_if_missing hazel hazel

# Programming Language Tools
echo "🐍 Installing Programming Language Tools..."
install_if_missing rustup rustup-init
install_if_missing nvm nvm
install_if_missing pnpm pnpm
install_if_missing pyenv pyenv
install_if_missing pipenv pipenv
install_if_missing rbenv rbenv
install_if_missing rvm ruby

# System Information & Monitoring
echo "📊 Installing System Information Tools..."
install_if_missing neofetch neofetch
install_if_missing tldr tldr
install_if_missing mackup mackup
install_if_missing appcleaner appcleaner
install_if_missing powermetrics powermetrics
install_if_missing sysdiagnose
install_if_missing onyx onyx
install_if_missing etrecheck etrecheck
install_if_missing cleanmymac cleanmymac

# Development Tools & Linters
echo "🔧 Installing Development Tools..."
install_if_missing bat bat
install_if_missing eza eza
install_if_missing starship starship
install_if_missing powerlevel10k
install_if_missing zsh-autosuggestions zsh-autosuggestions
install_if_missing zsh-syntax-highlighting zsh-syntax-highlighting
install_if_missing carapace carapace
install_if_missing kubectl kubectl
install_if_missing ansible ansible
install_if_missing mas mas

# Dotfile Management
echo "📄 Installing Dotfile Management..."
install_if_missing chezmoi chezmoi

# Code Analysis & Quality Tools
echo "🔍 Installing Code Analysis Tools..."
install_if_missing ast-grep ast-grep
install_if_missing sd sd
install_if_missing ripgrep-all ripgrep-all
install_if_missing plocate plocate
install_if_missing bfs bfs
install_if_missing dedupes
install_if_missing jdupes jdupes
install_if_missing tombi tombi
install_if_missing taplo taplo

# Performance Profiling Tools
echo "⚡ Installing Performance Profiling Tools..."
install_if_missing py-spy py-spy
install_if_missing hyperfine hyperfine
install_if_missing bench bench

# Container & Orchestration
echo "🐳 Installing Container & Orchestration Tools..."
install_if_missing docker docker
install_if_missing docker-compose docker-compose
install_if_missing k9s k9s
install_if_missing stern stern
install_if_missing telepresence telepresence
install_if_missing skaffold skaffold
install_if_missing tilt tilt
install_if_missing argocd argocd
install_if_missing flux flux
install_if_missing crossplane crossplane

# Cloud & Infrastructure Tools
echo "☁️  Installing Cloud & Infrastructure Tools..."
install_if_missing terraform terraform
install_if_missing pulumi pulumi
install_if_missing cdk8s cdk8s
install_if_missing kustomize kustomize
install_if_missing helm helm
install_if_missing ansible-core ansible-core

# Version Control & Git Tools
echo "🔀 Installing Version Control Tools..."
install_if_missing git-lfs git-lfs
install_if_missing git-filter-repo git-filter-repo
install_if_missing gh gh
install_if_missing glab glab

# Database Tools
echo "🗄️  Installing Database Tools..."
install_if_missing postgresql postgresql
install_if_missing redis redis
install_if_missing mysql mysql
install_if_missing mongodb-community mongodb-community

# Search & Indexing
echo "🔎 Installing Search & Indexing Tools..."
install_if_missing elasticsearch elasticsearch
install_if_missing opensearch opensearch

# API & Network Tools
echo "🌐 Installing API & Network Tools..."
install_if_missing curl curl
install_if_missing wget wget
install_if_missing httpie httpie
install_if_missing hey hey

# Build Tools & Task Runners
echo "🏗️  Installing Build Tools..."
install_if_missing make make
install_if_missing just just
install_if_missing task task
install_if_missing mage mage

# Documentation Tools
echo "📚 Installing Documentation Tools..."
install_if_missing pandoc pandoc
install_if_missing mermaid-cli mermaid-cli

# Security & Compliance Tools
echo "🔒 Installing Security Tools..."
install_if_missing openssl openssl
install_if_missing gnupg gnupg
install_if_missing keychain keychain
install_if_missing safety safety
install_if_missing bandit bandit
install_if_missing semgrep semgrep

# Testing Frameworks
echo "🧪 Installing Testing Tools..."
install_if_missing k6 k6
install_if_missing artillery artillery
install_if_missing vegeta vegeta

# Monitoring & Observability
echo "📈 Installing Monitoring Tools..."
install_if_missing prometheus prometheus
install_if_missing grafana grafana
install_if_missing jaeger jaeger
install_if_missing zipkin zipkin

# Message Queues & Streaming
echo "📨 Installing Message Queue Tools..."
install_if_missing kafka kafka
install_if_missing rabbitmq rabbitmq

# Additional CLI Tools
echo "🛠️  Installing Additional CLI Tools..."
install_if_missing exa exa
install_if_missing delta git-delta
install_if_missing lazygit lazygit
install_if_missing bottom bottom
install_if_missing dust dust
install_if_missing duf duf
install_if_missing broot broot
install_if_missing zellij zellij
install_if_missing wezterm wezterm
install_if_missing alacritty alacritty

# Language Servers & Development
echo "💡 Installing Language Servers..."
install_if_missing lua-language-server lua-language-server
install_if_missing bash-language-server bash-language-server
install_if_missing dockerfile-language-server dockerfile-language-server
install_if_missing yaml-language-server yaml-language-server
install_if_missing vscode-json-language-server vscode-json-language-server

# Font & Terminal Enhancement
echo "🎨 Installing Terminal Enhancements..."
install_if_missing font-hack-nerd-font font-hack-nerd-font
install_if_missing font-fira-code-nerd-font font-fira-code-nerd-font

echo "🎉 Installation Complete!"
echo "========================="
echo "✅ All tools have been installed or were already present"
echo ""
echo "Next steps:"
echo "1. Configure your shell: Run 'chezmoi init' and 'chezmoi apply'"
echo "2. Set up language versions: Configure pyenv, nvm, rbenv as needed"
echo "3. Configure IDE: Set up Cursor/VS Code with installed language servers"
echo "4. Test environment: Run 'pixi run check' to verify everything works"
echo ""
echo "Environment ready for AGI development! 🚀"