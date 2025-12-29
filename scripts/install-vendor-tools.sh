#!/bin/bash

# VENDOR TOOL INSTALLATION SCRIPT
# Installs all required tools using vendor solutions only

set -euo pipefail

WORKSPACE="${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}"
LOG_DIR="$WORKSPACE/logs/installation"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$LOG_DIR"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$1] $2" | tee -a "$LOG_DIR/install_$TIMESTAMP.log"
}

# Check if command exists
has_command() {
    command -v "$1" >/dev/null 2>&1
}

# Install with Homebrew
brew_install() {
    local package="$1"
    if ! has_command "$package"; then
        log "INFO" "Installing $package with Homebrew..."
        brew install "$package" || log "ERROR" "Failed to install $package"
    else
        log "INFO" "$package already installed"
    fi
}

# Install with npm
npm_install() {
    local package="$1"
    if ! npm list -g "$package" >/dev/null 2>&1; then
        log "INFO" "Installing $package with npm..."
        npm install -g "$package" || log "ERROR" "Failed to install $package"
    else
        log "INFO" "$package already installed"
    fi
}

# Install with pip
pip_install() {
    local package="$1"
    if ! python3 -c "import $package" >/dev/null 2>&1; then
        log "INFO" "Installing $package with pip..."
        python3 -m pip install "$package" || log "ERROR" "Failed to install $package"
    else
        log "INFO" "$package already installed"
    fi
}

# Install with cargo
cargo_install() {
    local package="$1"
    if ! has_command "$package"; then
        log "INFO" "Installing $package with cargo..."
        cargo install "$package" || log "ERROR" "Failed to install $package"
    else
        log "INFO" "$package already installed"
    fi
}

# Install with go
go_install() {
    local package="$1"
    if ! has_command "$package"; then
        log "INFO" "Installing $package with go..."
        go install "$package" || log "ERROR" "Failed to install $package"
    else
        log "INFO" "$package already installed"
    fi
}

# Main installation function
main() {
    log "INFO" "=== STARTING VENDOR TOOL INSTALLATION ==="

    # AI/ML Tools
    log "INFO" "Installing AI/ML tools..."
    pip_install torch
    pip_install transformers
    pip_install accelerate
    pip_install datasets
    pip_install mlflow
    pip_install optuna
    pip_install deepspeed

    # Hugging Face CLI
    if ! has_command huggingface-cli; then
        pip_install huggingface_hub
        log "INFO" "Hugging Face CLI should be available via huggingface-cli command"
    fi

    # Database Tools
    log "INFO" "Installing database tools..."
    brew_install postgresql
    brew_install neo4j
    brew_install redis
    brew_install qdrant

    # Development Tools
    log "INFO" "Installing development tools..."
    brew_install ollama
    brew_install lefthook
    brew_install trufflehog
    brew_install trivy

    # Node.js Tools
    log "INFO" "Installing Node.js tools..."
    npm_install @modelcontextprotocol/server-ollama
    npm_install @modelcontextprotocol/server-task-master
    npm_install @modelcontextprotocol/server-sqlite
    npm_install @modelcontextprotocol/server-anthropic
    npm_install @modelcontextprotocol/server-postgres
    npm_install @modelcontextprotocol/server-neo4j
    npm_install @modelcontextprotocol/server-github
    npm_install @modelcontextprotocol/server-brave-search
    npm_install @modelcontextprotocol/server-redis
    npm_install @modelcontextprotocol/server-qdrant
    npm_install @modelcontextprotocol/server-sequential-thinking
    npm_install @modelcontextprotocol/server-desktop-commander

    # Authentication & Security
    log "INFO" "Installing authentication tools..."
    brew_install 1password-cli
    npm_install @clerk/clerk-sdk-node

    # Testing Tools
    log "INFO" "Installing testing tools..."
    npm_install vitest
    npm_install playwright
    pip_install pytest

    # API & GraphQL Tools
    log "INFO" "Installing API tools..."
    npm_install graphql
    npm_install apollo-server
    npm_install hono
    npm_install @fastify/postgres
    npm_install prisma

    # Infrastructure Tools
    log "INFO" "Installing infrastructure tools..."
    brew_install docker
    brew_install kubectl
    brew_install helm
    brew_install terraform

    # Monitoring Tools
    log "INFO" "Installing monitoring tools..."
    npm_install prom-client
    npm_install @sentry/node

    # CLI Tools
    log "INFO" "Installing CLI tools..."
    npm_install oclif
    pip_install click
    cargo_install clap

    # Data Processing
    log "INFO" "Installing data processing tools..."
    pip_install pandas
    pip_install numpy
    pip_install scikit-learn
    pip_install networkx

    # Configuration Tools
    log "INFO" "Installing configuration tools..."
    brew_install chezmoi
    npm_install cosmiconfig

    # Start Ollama service
    log "INFO" "Starting Ollama service..."
    brew services start ollama || log "WARN" "Failed to start Ollama service"

    # Start databases
    log "INFO" "Starting database services..."
    brew services start postgresql || log "WARN" "Failed to start PostgreSQL"
    brew services start redis || log "WARN" "Failed to start Redis"

    # Initialize databases
    log "INFO" "Initializing databases..."
    if has_command initdb; then
        mkdir -p "$WORKSPACE/data/postgres"
        initdb -D "$WORKSPACE/data/postgres" || log "WARN" "PostgreSQL init failed"
    fi

    log "INFO" "=== VENDOR TOOL INSTALLATION COMPLETE ==="
    log "INFO" "Installation log: $LOG_DIR/install_$TIMESTAMP.log"

    # Create installation status
    echo "$(date)" > "$WORKSPACE/.installation_complete"
    echo "Vendor tools installation completed" >> "$WORKSPACE/.installation_complete"

    log "INFO" "Run './scripts/start-mcp-ecosystem.sh' to start all services"
}

# Run main installation
main "$@"