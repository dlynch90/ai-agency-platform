#!/bin/bash
# Polyglot Development Environment Tool Integration
# Comprehensive setup for all vendor tools and utilities

set -e

echo "🚀 Starting Polyglot Tool Integration..."

# =============================================================================
# 1. FILE/DIRECTORY MANAGEMENT TOOLS
# =============================================================================

echo "📁 Configuring File/Directory Management Tools..."

# fclones - Duplicate file finder
if command -v fclones >/dev/null 2>&1; then
    echo "✅ fclones available: $(fclones --version)"
    # Create alias for common duplicate finding
    alias find-dupes='fclones group --threads 8 --no-hidden .'
fi

# fd - Fast find alternative
if command -v fd >/dev/null 2>&1; then
    echo "✅ fd available: $(fd --version | head -1)"
    # Configure fd with sensible defaults
    export FD_OPTIONS="--hidden --follow --exclude .git --exclude node_modules --exclude .pixi"
    alias findf='fd $FD_OPTIONS'
fi

# rmlint - Duplicate file remover
if command -v rmlint >/dev/null 2>&1; then
    echo "✅ rmlint available: $(rmlint --version)"
    alias rm-dupes='rmlint --progress --types="duplicates" .'
fi

# GNU Stow - Symlink farm manager
if command -v stow >/dev/null 2>&1; then
    echo "✅ stow available: $(stow --version)"
    export STOW_DIR="$HOME/.dotfiles"
    alias stow-add='stow --verbose --target=$HOME'
fi

# tree - Directory tree viewer
if command -v tree >/dev/null 2>&1; then
    echo "✅ tree available: $(tree --version | head -1)"
    alias tree1='tree -L 1'
    alias tree2='tree -L 2'
fi

# =============================================================================
# 2. NAVIGATION & TERMINAL TOOLS
# =============================================================================

echo "🧭 Configuring Navigation & Terminal Tools..."

# tmux - Terminal multiplexer
if command -v tmux >/dev/null 2>&1; then
    echo "✅ tmux available: $(tmux -V)"
    # tmux configuration will be handled by chezmoi
fi

# zoxide - Smarter cd command
if command -v zoxide >/dev/null 2>&1; then
    echo "✅ zoxide available: $(zoxide --version)"
    # Initialize zoxide for current shell
    if [[ -n "$ZSH_VERSION" ]]; then
        eval "$(zoxide init zsh)"
    elif [[ -n "$BASH_VERSION" ]]; then
        eval "$(zoxide init bash)"
    else
        eval "$(zoxide init --cmd cd zsh)"  # fallback
    fi
    alias cd='z'
    alias cdi='zi'
fi

# navi - Interactive cheat sheet
if command -v navi >/dev/null 2>&1; then
    echo "✅ navi available: $(navi --version)"
    # Initialize navi for current shell
    if [[ -n "$ZSH_VERSION" ]]; then
        eval "$(navi widget zsh)"
    elif [[ -n "$BASH_VERSION" ]]; then
        eval "$(navi widget bash)"
    fi
fi

# fzf - Fuzzy finder
if command -v fzf >/dev/null 2>&1; then
    echo "✅ fzf available: $(fzf --version)"
    # fzf configuration
    export FZF_DEFAULT_OPTS="--height 40% --layout=reverse --border"
    export FZF_DEFAULT_COMMAND="fd --type f --hidden --follow --exclude .git"
    export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
    export FZF_ALT_C_COMMAND="fd --type d --hidden --follow --exclude .git"

    # Source fzf key bindings and completion
    [ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
fi

# =============================================================================
# 3. SEARCH & ANALYSIS TOOLS
# =============================================================================

echo "🔍 Configuring Search & Analysis Tools..."

# ripgrep (rg) - Fast recursive search
if command -v rg >/dev/null 2>&1; then
    echo "✅ ripgrep available: $(rg --version | head -1)"
    alias grep='rg'  # Use ripgrep as default grep
    alias rgf='rg --files | rg'  # Search in filenames
fi

# grep - Traditional grep (fallback)
if command -v grep >/dev/null 2>&1; then
    echo "✅ grep available"
    alias grepv='grep -v'  # Invert match
    alias grepn='grep -n'  # Show line numbers
fi

# bat - Cat with syntax highlighting
if command -v bat >/dev/null 2>&1; then
    echo "✅ bat available: $(bat --version)"
    alias cat='bat --paging=never'  # Use bat as default cat
    alias catn='bat --plain'  # Plain text mode
fi

# sd - User-friendly search/replace
if command -v sd >/dev/null 2>&1; then
    echo "✅ sd available: $(sd --version)"
    alias replace='sd'
fi

# bfs - Breadth-first find
if command -v bfs >/dev/null 2>&1; then
    echo "✅ bfs available"
    alias findb='bfs'
fi

# fdupes/jdupes - Duplicate file finders
if command -v fdupes >/dev/null 2>&1; then
    echo "✅ fdupes available"
    alias dupes='fdupes -r .'
fi

if command -v jdupes >/dev/null 2>&1; then
    echo "✅ jdupes available"
    alias dupesj='jdupes -r .'
fi

# =============================================================================
# 4. DEVELOPMENT TOOLS
# =============================================================================

echo "💻 Configuring Development Tools..."

# GitHub CLI
if command -v gh >/dev/null 2>&1; then
    echo "✅ GitHub CLI available: $(gh --version | head -1)"
    eval "$(gh completion -s zsh)"
fi

# jq - JSON processor
if command -v jq >/dev/null 2>&1; then
    echo "✅ jq available: $(jq --version)"
    alias jqkeys='jq keys'
    alias jqvals='jq values'
fi

# yq - YAML processor
if command -v yq >/dev/null 2>&1; then
    echo "✅ yq available: $(yq --version | head -1)"
    alias yqkeys='yq eval "keys" -'
    alias yqvals='yq eval "values" -'
fi

# pass - Password manager
if command -v pass >/dev/null 2>&1; then
    echo "✅ pass available: $(pass version)"
fi

# =============================================================================
# 5. CODE QUALITY & ANALYSIS TOOLS
# =============================================================================

echo "🔧 Configuring Code Quality & Analysis Tools..."

# ast-grep - AST-aware grep
if command -v ast-grep >/dev/null 2>&1; then
    echo "✅ ast-grep available: $(ast-grep --version)"
    alias sg='ast-grep'
fi

# semgrep - Semantic grep
if command -v semgrep >/dev/null 2>&1; then
    echo "✅ semgrep available: $(semgrep --version | head -1)"
    alias sgrep='semgrep'
fi

# ruff - Fast Python linter/formatter
if command -v ruff >/dev/null 2>&1; then
    echo "✅ ruff available: $(ruff --version)"
    alias ruffc='ruff check'
    alias rufff='ruff format'
fi

# mypy - Python type checker
if command -v mypy >/dev/null 2>&1; then
    echo "✅ mypy available: $(mypy --version)"
fi

# taplo - TOML toolkit
if command -v taplo >/dev/null 2>&1; then
    echo "✅ taplo available: $(taplo --version)"
fi

# =============================================================================
# 6. MONITORING & SYSTEM TOOLS
# =============================================================================

echo "📊 Configuring Monitoring & System Tools..."

# htop - Interactive process viewer
if command -v htop >/dev/null 2>&1; then
    echo "✅ htop available"
    alias top='htop'
fi

# =============================================================================
# 7. PACKAGE MANAGER INTEGRATIONS
# =============================================================================

echo "📦 Configuring Package Manager Integrations..."

# pnpm - Fast npm alternative
if command -v pnpm >/dev/null 2>&1; then
    echo "✅ pnpm available: $(pnpm --version)"
    # pnpm configuration
    export PNPM_HOME="$HOME/.local/share/pnpm"
    export PATH="$PNPM_HOME:$PATH"
fi

# pipx - Install Python applications
if command -v pipx >/dev/null 2>&1; then
    echo "✅ pipx available: $(pipx --version)"
    export PIPX_HOME="$HOME/.local/pipx"
    export PIPX_BIN_DIR="$PIPX_HOME/bin"
fi

# =============================================================================
# 8. CONFIGURATION FILES & INTEGRATIONS
# =============================================================================

echo "⚙️ Configuring Tool Integrations..."

# Create tool configuration directory
TOOL_CONFIG_DIR="${CONFIG_DIR:-$HOME/.config}/polyglot-tools"
mkdir -p "$TOOL_CONFIG_DIR"

# fd configuration
cat > "$TOOL_CONFIG_DIR/fdignore" << 'EOF'
.git/
__pycache__/
node_modules/
.pixi/
.env
*.pyc
.DS_Store
EOF

# ripgrep configuration
cat > "$TOOL_CONFIG_DIR/ripgreprc" << 'EOF'
--hidden
--follow
--glob=!.git/
--glob=!__pycache__/
--glob=!node_modules/
--glob=!.pixi/
--glob=!*.pyc
EOF

export RIPGREP_CONFIG_PATH="$TOOL_CONFIG_DIR/ripgreprc"

# ast-grep configuration for common patterns
cat > "$TOOL_CONFIG_DIR/ast-grep-rules.toml" << 'EOF'
[[rules]]
id = "console-log"
message = "Avoid // CONSOLE_LOG_VIOLATION: console.log in production code"
language = "javascript"
rule = {
    pattern = "// CONSOLE_LOG_VIOLATION: console.log($$$)"
}

[[rules]]
id = "todo-fixme"
message = "TODO/FIXME comments should be addressed"
language = "javascript"
rule = {
    pattern = "(?i)(TODO|FIXME|XXX|HACK)"
}
EOF

# =============================================================================
# 9. ALIASES & SHORTCUTS
# =============================================================================

echo "🔗 Creating Aliases & Shortcuts..."

# File operations
alias l='ls -la'
alias ll='ls -alF'
alias la='ls -A'
alias lsd='ls -d */'

# Search operations
alias findpy='fd "\.py$"'
alias findjs='fd "\.js$|\.ts$|\.jsx$|\.tsx$"'
alias findmd='fd "\.md$"'

# Code analysis
alias lintpy='ruff check && mypy'
alias lintjs='semgrep --config auto'
alias astpy='ast-grep --lang python'
alias astjs='ast-grep --lang javascript'

# Development workflow
alias devup='cd ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}} && pixi install'
alias devrun='cd ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}} && pixi run'
alias devtest='cd ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}} && pixi run test'

# Performance monitoring
alias psmem='ps aux --sort=-%mem | head -10'
alias pscpu='ps aux --sort=-%cpu | head -10'

# =============================================================================
# 10. ENVIRONMENT VALIDATION
# =============================================================================

echo "✅ Validating Tool Integration..."

# Check critical tools
critical_tools=("fd" "rg" "jq" "yq" "ast-grep" "bat" "fzf" "zoxide")
missing_tools=()

for tool in "${critical_tools[@]}"; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        missing_tools+=("$tool")
    fi
done

if [ ${#missing_tools[@]} -eq 0 ]; then
    echo "✅ All critical tools are available!"
else
    echo "⚠️ Missing critical tools: ${missing_tools[*]}"
fi

echo "🚀 Polyglot Tool Integration Complete!"
echo ""
echo "Available tool categories:"
echo "  📁 File Management: fclones, fd, rmlint, stow, tree"
echo "  🧭 Navigation: tmux, zoxide, navi, fzf"
echo "  🔍 Search: rg, grep, bat, sd, bfs, fdupes, jdupes"
echo "  💻 Development: gh, jq, yq, pass, taplo"
echo "  🔧 Code Quality: ast-grep, semgrep, ruff, mypy"
echo "  📊 Monitoring: htop"
echo "  📦 Package Mgmt: pnpm, pipx"
echo ""
echo "Use 'devrun' commands for development workflow"
echo "Use 'lint*' commands for code quality checks"
echo "Use 'find*' commands for file discovery"