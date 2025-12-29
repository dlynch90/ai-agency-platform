#!/bin/bash
# Comprehensive Development Tool Installation Script
# Installs all 50+ tools from the user's requirements

echo "=== COMPREHENSIVE DEVELOPMENT TOOL INSTALLATION ==="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install via brew if available
install_brew() {
    if brew list "$1" >/dev/null 2>&1; then
        echo "✅ $1 already installed"
    else
        echo "📦 Installing $1..."
        brew install "$1" || echo "❌ Failed to install $1"
    fi
}

# Function to install via npm if available
install_npm_global() {
    if command_exists "$1"; then
        echo "✅ $1 already installed"
    else
        echo "📦 Installing $1 via npm..."
        npm install -g "$1" || echo "❌ Failed to install $1"
    fi
}

echo "Step 1: Installing via Homebrew..."
brew install fd fzf ripgrep bat jq yq htop gh neofetch tldr tree stow zoxide tmux starship pyenv pipx rbenv rustup ast-grep sd bfs

echo "Step 2: Installing additional tools..."

# Install navi (command line cheat sheets)
if ! command_exists navi; then
    echo "📦 Installing navi..."
    curl -sL https://github.com/denisidoro/navi/releases/latest/download/navi-x86_64-apple-darwin.tar.gz | tar xz -C /tmp && sudo mv /tmp/navi /usr/local/bin/
fi

# Install yg (yaml grep)
if ! command_exists yg; then
    echo "📦 Installing yg..."
    curl -sL https://github.com/summitb/ytools/releases/latest/download/yg-x86_64-apple-darwin.tar.gz | tar xz -C /tmp && sudo mv /tmp/yg /usr/local/bin/
fi

# Install fclones (duplicate file finder)
if ! command_exists fclones; then
    echo "📦 Installing fclones..."
    curl -sL https://github.com/pkolaczk/fclones/releases/latest/download/fclones-x86_64-apple-darwin.tar.gz | tar xz -C /tmp && sudo mv /tmp/fclones /usr/local/bin/
fi

# Install rmlint (duplicate file remover)
if ! command_exists rmlint; then
    echo "📦 Installing rmlint..."
    brew install rmlint || echo "❌ rmlint installation failed"
fi

# Install blob (binary grep)
if ! command_exists blob; then
    echo "📦 Installing blob..."
    curl -sL https://github.com/sahib/rmlint/releases/download/v2.10.2/rmlint-2.10.2.tar.gz | tar xz -C /tmp && cd /tmp/rmlint-2.10.2 && ./configure && make && sudo make install
fi

echo "Step 3: Installing performance profiling tools..."

# Performance profiling tools
pipx install py-spy
pipx install pytest-benchmark
pipx install memory-profiler
pipx install line-profiler

echo "Step 4: Installing system monitoring tools..."
# These are usually pre-installed on macOS
echo "✅ top, ps, vm_stat, iostat, netstat - usually pre-installed"

echo "Step 5: Installing dependency management tools..."
pipx install pipdeptree
pipx install pip-tools
pipx install safety

echo "Step 6: Installing additional development tools..."

# Install atuin (shell history)
if ! command_exists atuin; then
    echo "📦 Installing atuin..."
    curl -sL https://github.com/atuinsh/atuin/releases/latest/download/atuin-x86_64-apple-darwin.tar.gz | tar xz -C /tmp && sudo mv /tmp/atuin /usr/local/bin/
fi

# Install delta (diff tool)
if ! command_exists delta; then
    echo "📦 Installing delta..."
    brew install git-delta
fi

# Install tokei (code statistics)
if ! command_exists tokei; then
    echo "📦 Installing tokei..."
    brew install tokei
fi

# Install hyperfine (benchmarking)
if ! command_exists hyperfine; then
    echo "📦 Installing hyperfine..."
    brew install hyperfine
fi

echo "Step 7: Installing shell enhancements..."

# Oh My Zsh (if not already installed)
if [ ! -d "$HOME/.oh-my-zsh" ]; then
    echo "📦 Installing Oh My Zsh..."
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
fi

# Powerlevel10k theme
if [ ! -d "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k" ]; then
    echo "📦 Installing Powerlevel10k..."
    git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
fi

echo "Step 8: Installing language-specific tools..."

# Python tools
pipx install black
pipx install isort
pipx install flake8
pipx install mypy
pipx install ruff

# Node.js tools (global)
npm install -g typescript
npm install -g tsx
npm install -g vitest
npm install -g prettier
npm install -g eslint

echo "Step 9: Installing Rust tools..."
# Rust tools (cargo installs)
cargo install cargo-watch
cargo install cargo-edit
cargo install cargo-outdated
cargo install cargo-audit
cargo install cargo-deny

echo "Step 10: Installing Go tools..."
# Go tools
go install github.com/cosmtrek/air@latest
go install honnef.co/go/tools/cmd/staticcheck@latest

echo "Step 11: Installing Java tools..."
# Java tools (if JDK installed)
if command_exists java; then
    echo "📦 Installing Java development tools..."
    # Maven and Gradle usually installed via brew or manually
fi

echo "Step 12: Installing container tools..."
# Docker is usually installed separately
# Kubernetes tools
if ! command_exists kubectl; then
    echo "📦 Installing kubectl..."
    brew install kubectl
fi

echo "Step 13: Installing cloud tools..."
# AWS CLI
if ! command_exists aws; then
    echo "📦 Installing AWS CLI..."
    brew install awscli
fi

echo "Step 14: Installing database tools..."
# PostgreSQL client
brew install postgresql

echo "Step 15: Installing API/GraphQL tools..."
npm install -g graphql-cli
npm install -g apollo

echo "Step 16: Installing documentation tools..."
npm install -g docsify
npm install -g vuepress

echo "Step 17: Installing security tools..."
brew install trivy
npm install -g auditjs

echo "Step 18: Installing monitoring tools..."
# Prometheus and Grafana usually installed via Docker
echo "✅ Prometheus, Grafana - install via Docker if needed"

echo "Step 19: Installing ML/AI tools..."
pipx install transformers
pipx install torch
pipx install tensorflow

echo "Step 20: Installing MCP-related tools..."
# MCP servers and tools
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-git
npm install -g @modelcontextprotocol/server-sqlite

echo "Step 21: Installing additional productivity tools..."

# Install mackup (backup dotfiles)
pipx install mackup

# Install hammerspoon (automation) - macOS only
if [[ "$OSTYPE" == "darwin"* ]]; then
    brew install hammerspoon
fi

echo "Step 22: Final verification..."
echo "Installed tools count:"
count=0
tools=(
    fd fzf rg bat jq yq htop gh neofetch tldr tree stow zoxide navi ast-grep sd bfs
    py-spy hyperfine tokei delta atuin
    black isort flake8 mypy ruff
    typescript tsx vitest prettier eslint
    cargo-watch staticcheck air
    kubectl aws psql
    graphql-cli apollo
    docsify vuepress
    trivy
)

for tool in "${tools[@]}"; do
    if command_exists "$tool"; then
        ((count++))
    fi
done

echo "✅ $count tools successfully installed"

echo ""
echo "=== INSTALLATION COMPLETE ==="
echo "Run 'source ~/.zshrc' to reload your shell configuration"
echo "Run the comprehensive gap analysis next: bash comprehensive_gap_analysis.sh"