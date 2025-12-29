#!/bin/bash
# Install remaining development tools not available through conda
# This script complements the Pixi environment with additional tools

set -e

echo "🚀 Installing remaining development tools..."
echo "This script will install tools via various package managers"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install via Homebrew (macOS)
install_via_brew() {
    local tool=$1
    local brew_name=$2

    if command_exists brew; then
        print_status "Installing $tool via Homebrew..."
        if brew install "$brew_name"; then
            print_success "$tool installed successfully"
            return 0
        else
            print_error "Failed to install $tool via Homebrew"
            return 1
        fi
    else
        print_warning "Homebrew not found, skipping $tool"
        return 1
    fi
}

# Install via npm
install_via_npm() {
    local tool=$1
    local npm_name=$2

    if command_exists npm; then
        print_status "Installing $tool via npm..."
        if npm install -g "$npm_name"; then
            print_success "$tool installed successfully"
            return 0
        else
            print_error "Failed to install $tool via npm"
            return 1
        fi
    else
        print_warning "npm not found, skipping $tool"
        return 1
    fi
}

# Install via cargo
install_via_cargo() {
    local tool=$1
    local cargo_name=$2

    if command_exists cargo; then
        print_status "Installing $tool via cargo..."
        if cargo install "$cargo_name"; then
            print_success "$tool installed successfully"
            return 0
        else
            print_error "Failed to install $tool via cargo"
            return 1
        fi
    else
        print_warning "cargo not found, skipping $tool"
        return 1
    fi
}

# Install via pip
install_via_pip() {
    local tool=$1
    local pip_name=$2

    if command_exists pip; then
        print_status "Installing $tool via pip..."
        if pip install "$pip_name"; then
            print_success "$tool installed successfully"
            return 0
        else
            print_error "Failed to install $tool via pip"
            return 1
        fi
    else
        print_warning "pip not found, skipping $tool"
        return 1
    fi
}

# Install via go
install_via_go() {
    local tool=$1
    local go_name=$2

    if command_exists go; then
        print_status "Installing $tool via go..."
        if go install "$go_name"; then
            print_success "$tool installed successfully"
            return 0
        else
            print_error "Failed to install $tool via go"
            return 1
        fi
    else
        print_warning "go not found, skipping $tool"
        return 1
    fi
}

# Main installation logic
echo "🔧 Installing CLI Tools..."

# fd (fast find) - via brew
if ! command_exists fd; then
    install_via_brew "fd" "fd"
fi

# rmlint - via brew
if ! command_exists rmlint; then
    install_via_brew "rmlint" "rmlint"
fi

# tmux - should already be available
if ! command_exists tmux; then
    install_via_brew "tmux" "tmux"
fi

# zoxide - via brew
if ! command_exists zoxide; then
    install_via_brew "zoxide" "zoxide"
fi

# navi - via brew
if ! command_exists navi; then
    install_via_brew "navi" "navi"
fi

# gh (GitHub CLI) - via brew
if ! command_exists gh; then
    install_via_brew "gh" "gh"
fi

# pass - via brew
if ! command_exists pass; then
    install_via_brew "pass" "pass"
fi

# stow - via brew
if ! command_exists stow; then
    install_via_brew "stow" "stow"
fi

# tree - via brew
if ! command_exists tree; then
    install_via_brew "tree" "tree"
fi

# fzf - should be available via pixi
if ! command_exists fzf; then
    install_via_brew "fzf" "fzf"
fi

# kubectl - via brew
if ! command_exists kubectl; then
    install_via_brew "kubectl" "kubectl"
fi

# atuin - via brew
if ! command_exists atuin; then
    install_via_brew "atuin" "atuin"
fi

# neofetch - via brew
if ! command_exists neofetch; then
    install_via_brew "neofetch" "neofetch"
fi

# tldr - via brew
if ! command_exists tldr; then
    install_via_brew "tldr" "tldr"
fi

# mackup - via brew
if ! command_exists mackup; then
    install_via_brew "mackup" "mackup"
fi

# hammerspoon - via brew (macOS only)
if ! command_exists hs; then
    install_via_brew "hammerspoon" "hammerspoon"
fi

# rectangle - via brew (macOS only)
if ! command_exists rectangle; then
    install_via_brew "rectangle" "rectangle"
fi

echo ""
echo "🔧 Installing Development Tools..."

# pyenv - via brew
if ! command_exists pyenv; then
    install_via_brew "pyenv" "pyenv"
fi

# pipenv - via brew
if ! command_exists pipenv; then
    install_via_brew "pipenv" "pipenv"
fi

# rbenv - via brew
if ! command_exists rbenv; then
    install_via_brew "rbenv" "rbenv"
fi

# rvm - requires special installation
if ! command_exists rvm; then
    print_status "Installing RVM (Ruby Version Manager)..."
    curl -sSL https://get.rvm.io | bash -s stable
    if command_exists rvm; then
        print_success "RVM installed successfully"
    else
        print_error "Failed to install RVM"
    fi
fi

# nvm - via brew
if ! command_exists nvm; then
    install_via_brew "nvm" "nvm"
fi

# pnpm - via npm
if ! command_exists pnpm; then
    install_via_npm "pnpm" "pnpm"
fi

echo ""
echo "🔧 Installing Code Analysis Tools..."

# ast-grep - via cargo
if ! command_exists ast-grep; then
    install_via_cargo "ast-grep" "ast-grep"
fi

# semgrep - via pip
if ! command_exists semgrep; then
    install_via_pip "semgrep" "semgrep"
fi

# oxlint - via cargo
if ! command_exists oxlint; then
    install_via_cargo "oxlint" "oxlint"
fi

# knip - via npm
if ! command_exists knip; then
    install_via_npm "knip" "knip"
fi

echo ""
echo "🔧 Installing Performance Tools..."

# py-spy - should be available via pixi
if ! command_exists py-spy; then
    install_via_cargo "py-spy" "py-spy"
fi

# pytest-benchmark - via pip
install_via_pip "pytest-benchmark" "pytest-benchmark"

# memory-profiler - via pip
install_via_pip "memory-profiler" "memory-profiler"

echo ""
echo "🔧 Installing MCP and AI Tools..."

# Install Ollama if not available
if ! command_exists ollama; then
    print_status "Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
    if command_exists ollama; then
        print_success "Ollama installed successfully"
    else
        print_error "Failed to install Ollama"
    fi
fi

echo ""
echo "🔧 Installing Shell and Plugin Tools..."

# Oh My Zsh - requires interactive installation
if [ ! -d "$HOME/.oh-my-zsh" ]; then
    print_status "Installing Oh My Zsh..."
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
    if [ -d "$HOME/.oh-my-zsh" ]; then
        print_success "Oh My Zsh installed successfully"
    else
        print_error "Failed to install Oh My Zsh"
    fi
fi

# Powerlevel10k theme
if [ ! -d "$HOME/.oh-my-zsh/custom/themes/powerlevel10k" ]; then
    print_status "Installing Powerlevel10k theme..."
    git clone --depth=1 https://github.com/romkatv/powerlevel10k.git "$HOME/.oh-my-zsh/custom/themes/powerlevel10k"
    if [ -d "$HOME/.oh-my-zsh/custom/themes/powerlevel10k" ]; then
        print_success "Powerlevel10k installed successfully"
    else
        print_error "Failed to install Powerlevel10k"
    fi
fi

# Zsh plugins
ZSH_PLUGINS_DIR="$HOME/.oh-my-zsh/custom/plugins"

# zsh-autosuggestions
if [ ! -d "$ZSH_PLUGINS_DIR/zsh-autosuggestions" ]; then
    print_status "Installing zsh-autosuggestions..."
    git clone https://github.com/zsh-users/zsh-autosuggestions "$ZSH_PLUGINS_DIR/zsh-autosuggestions"
    print_success "zsh-autosuggestions installed"
fi

# zsh-syntax-highlighting
if [ ! -d "$ZSH_PLUGINS_DIR/zsh-syntax-highlighting" ]; then
    print_status "Installing zsh-syntax-highlighting..."
    git clone https://github.com/zsh-users/zsh-syntax-highlighting "$ZSH_PLUGINS_DIR/zsh-syntax-highlighting"
    print_success "zsh-syntax-highlighting installed"
fi

echo ""
print_success "🎉 Tool installation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Restart your terminal or source your shell configuration"
echo "2. Run 'pixi run doctor' to verify the integrated environment"
echo "3. Configure your shell tools (see setup_shell_tools.sh)"
echo ""
echo "🔧 Installed tools summary:"
echo "   CLI Tools: fd, rmlint, tmux, zoxide, navi, gh, pass, stow, tree, fzf, kubectl, atuin, neofetch, tldr, mackup"
echo "   Development: pyenv, pipenv, rbenv, rvm, nvm, pnpm"
echo "   Code Analysis: ast-grep, semgrep, oxlint, knip"
echo "   Performance: py-spy, pytest-benchmark, memory-profiler"
echo "   AI/ML: ollama"
echo "   Shell: oh-my-zsh, powerlevel10k, zsh plugins"