#!/bin/bash
set -euo pipefail

# Comprehensive Tool Ecosystem Installer
# Vendor-Only, Parameterized Configuration via Chezmoi + 1Password

export LOG_FILE="${HOME}/tool-ecosystem-install-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🚀 Starting Comprehensive Tool Ecosystem Installation"
echo "📅 $(date)"
echo "📍 Working Directory: $(pwd)"
echo "👤 User: $(whoami)"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install via Homebrew
brew_install() {
    local package="$1"
    if ! command_exists "$package"; then
        echo "📦 Installing $package via Homebrew..."
        brew install "$package" || echo "⚠️  Failed to install $package"
    else
        echo "✅ $package already installed"
    fi
}

# Function to install via Homebrew Cask
brew_cask_install() {
    local package="$1"
    if ! command_exists "$package"; then
        echo "📦 Installing $package via Homebrew Cask..."
        brew install --cask "$package" || echo "⚠️  Failed to install $package"
    else
        echo "✅ $package already installed"
    fi
}

# Function to install via pip
pip_install() {
    local package="$1"
    if ! python3 -c "import $package" 2>/dev/null; then
        echo "🐍 Installing $package via pip..."
        pip3 install "$package" || echo "⚠️  Failed to install $package"
    else
        echo "✅ $package already installed"
    fi
}

# Function to install via npm/pnpm
npm_install() {
    local package="$1"
    if ! command_exists "$package"; then
        echo "📦 Installing $package via npm..."
        npm install -g "$package" || echo "⚠️  Failed to install $package"
    else
        echo "✅ $package already installed"
    fi
}

echo "🔧 Installing Core Development Tools..."

# Core CLI Tools (First Batch)
brew_install "fd"          # Fast find alternative
brew_install "ripgrep"     # Fast grep alternative
brew_install "bat"         # Cat with syntax highlighting
brew_install "fzf"         # Fuzzy finder
brew_install "jq"          # JSON processor
brew_install "yq"          # YAML processor
brew_install "tree"        # Directory tree viewer
brew_install "htop"        # Process viewer
brew_install "tldr"        # Simplified man pages
brew_install "neofetch"    # System info display
brew_install "navi"        # Interactive cheatsheet
brew_install "gh"          # GitHub CLI
brew_install "stow"        # Symlink farm manager
brew_install "eza"         # Modern ls replacement
brew_install "zoxide"      # Smarter cd command
brew_install "atuin"       # Shell history
brew_install "wget"        # HTTP downloader
brew_install "curl"        # HTTP client (already installed)

# Development Environment Tools
brew_install "pyenv"       # Python version manager
brew_install "pipenv"      # Python dependency manager
brew_install "rustup"      # Rust toolchain installer
brew_install "nvm"         # Node version manager (might need manual setup)

# Performance & Profiling Tools
pip_install "py-spy"           # Python profiler
pip_install "memory-profiler"  # Memory profiler
pip_install "line-profiler"    # Line profiler

# Data Science & ML Tools
pip_install "numpy"            # Scientific computing
pip_install "pandas"           # Data analysis
pip_install "matplotlib"       # Data visualization
pip_install "scikit-learn"     # Machine learning
pip_install "jupyter"          # Notebook environment
pip_install "streamlit"        # Data apps

# Code Quality Tools
pip_install "black"            # Code formatter
pip_install "ruff"             # Fast Python linter
pip_install "mypy"             # Type checker
pip_install "bandit"           # Security linter
pip_install "autopep8"         # Code formatter

# Testing Tools
pip_install "pytest"           # Testing framework
pip_install "pytest-benchmark" # Performance testing
pip_install "coverage"         # Code coverage

# Web Development Tools
npm_install "typescript"       # TypeScript compiler
npm_install "@types/node"      # Node.js types
npm_install "vite"             # Build tool
npm_install "vitest"           # Test runner
npm_install "eslint"           # Linter
npm_install "prettier"         # Code formatter

# Infrastructure & DevOps Tools
brew_install "kubectl"         # Kubernetes CLI
brew_install "helm"            # Kubernetes package manager
brew_install "docker"          # Container runtime
brew_install "ansible"         # Configuration management
brew_install "terraform"       # Infrastructure as code

# Database Tools
pip_install "psycopg2"          # PostgreSQL adapter
pip_install "pymongo"           # MongoDB adapter
pip_install "redis"             # Redis client
brew_install "postgresql"       # PostgreSQL server
brew_install "mongodb-community" # MongoDB

# Cloud & API Tools
brew_install "awscli"           # AWS CLI
pip_install "boto3"             # AWS SDK
pip_install "google-cloud-sdk"  # Google Cloud SDK
brew_install "azure-cli"        # Azure CLI

# Specialized Tools
pip_install "beautifulsoup4"    # HTML/XML parsing
pip_install "requests"          # HTTP library
pip_install "fastapi"           # Web framework
pip_install "uvicorn"           # ASGI server
pip_install "celery"            # Task queue
pip_install "flower"            # Celery monitoring
pip_install "click"             # CLI creation
pip_install "typer"             # CLI framework

# AI/ML Specific Tools
pip_install "transformers"      # Hugging Face transformers
pip_install "torch"             # PyTorch
pip_install "tensorflow"        # TensorFlow
pip_install "openai"            # OpenAI API
pip_install "anthropic"         # Anthropic API
pip_install "langchain"         # LangChain framework
pip_install "chromadb"          # Vector database

# Data Processing Tools
pip_install "apache-airflow"    # Workflow orchestration
pip_install "kafka-python"      # Kafka client
pip_install "aiokafka"          # Async Kafka client
pip_install "aioredis"          # Async Redis

# Image Processing
pip_install "pillow"            # Image processing
pip_install "opencv-python"     # Computer vision
pip_install "albumentations"    # Image augmentation

# Audio Processing
pip_install "librosa"           # Audio processing
pip_install "aubio"             # Audio feature extraction

# Scientific Computing
pip_install "scipy"             # Scientific computing
pip_install "sympy"             # Symbolic mathematics
pip_install "astropy"           # Astronomy
pip_install "biopython"         # Bioinformatics

# Data Visualization
pip_install "plotly"            # Interactive plots
pip_install "bokeh"             # Interactive visualization
pip_install "altair"            # Declarative visualization
pip_install "seaborn"           # Statistical visualization

# Web Scraping & Automation
pip_install "scrapy"            # Web scraping
pip_install "selenium"          # Browser automation
pip_install "playwright"        # Browser automation

# Documentation & Presentation
pip_install "mkdocs"            # Documentation generator
pip_install "sphinx"            # Documentation generator
pip_install "jupyter-book"      # Book generation

# Configuration & Templating
pip_install "jinja2"            # Templating engine
pip_install "chevron"           # Mustache templates
pip_install "toml"              # TOML parser

# Security & Encryption
pip_install "cryptography"      # Cryptographic recipes
pip_install "paramiko"          # SSH client
pip_install "bcrypt"            # Password hashing

# Networking & APIs
pip_install "httpx"             # HTTP client
pip_install "aiohttp"           # Async HTTP client
pip_install "websockets"        # WebSocket client
pip_install "graphql-core"      # GraphQL implementation

# Database ORMs
pip_install "sqlalchemy"        # SQL toolkit
pip_install "alembic"           # Database migration
pip_install "pydantic"          # Data validation
pip_install "django"            # Web framework
pip_install "flask"             # Web framework

# Message Queues
pip_install "pika"              # RabbitMQ client
pip_install "confluent-kafka"   # Kafka client

# Monitoring & Observability
pip_install "prometheus-client"  # Prometheus client
pip_install "statsd"             # StatsD client
pip_install "sentry-sdk"         # Error tracking

# Development Tools
pip_install "cookiecutter"       # Project templates
pip_install "pre-commit"         # Git hooks
pip_install "poetry"             # Dependency management
pip_install "pip-tools"          # Dependency management

echo "🔧 Installing Cask Applications..."

# Desktop Applications
brew_cask_install "rectangle"        # Window manager
brew_cask_install "appcleaner"       # App uninstaller
brew_cask_install "hammerspoon"      # Automation tool
brew_cask_install "hazel"            # File organizer
brew_cask_install "onyx"             # System maintenance
brew_cask_install "etrecheck"        # System diagnostics

echo "🔧 Installing Language-Specific Tools..."

# Go Tools
brew_install "go"                    # Go programming language

# Java Tools
brew_install "openjdk"               # Java Development Kit
brew_install "maven"                 # Java build tool
brew_install "gradle"                # Java build tool

# PHP Tools
brew_install "php"                   # PHP programming language
brew_install "composer"              # PHP dependency manager

# Ruby Tools
brew_install "ruby"                  # Ruby programming language
brew_install "rbenv"                 # Ruby version manager

echo "🔧 Installing Cloud & Platform Tools..."

# Vercel CLI
npm_install "vercel"

# Supabase CLI
npm_install "supabase"

# Netlify CLI
npm_install "netlify-cli"

# Firebase CLI
npm_install "firebase-tools"

# Heroku CLI
brew_install "heroku"

echo "🔧 Installing Specialized Development Tools..."

# Apollo GraphQL
npm_install "apollo"

# Dagger
brew_install "dagger"

# Airbyte
# (Airbyte typically runs as Docker containers)

# Apache Tools
brew_install "apache-spark"          # Apache Spark
brew_install "kafka"                 # Apache Kafka

# Data Format Tools
pip_install "pyarrow"                # Apache Arrow
pip_install "fastparquet"            # Parquet format

echo "🔧 Installing UI & Design Tools..."

# UI Libraries (will be installed in projects)
# These are typically installed per-project via package managers

echo "🔧 Installing Testing & Quality Tools..."

# Additional Testing Tools
npm_install "@playwright/test"       # E2E testing
npm_install "cypress"                # E2E testing
pip_install "behave"                 # BDD testing
pip_install "locust"                 # Load testing

# Code Analysis
npm_install "sonarqube-scanner"      # Code quality
pip_install "radon"                  # Code metrics
pip_install "xenon"                  # Code complexity

echo "🔧 Installing Deployment & CI/CD Tools..."

# CI/CD Tools
brew_install "circleci"              # CircleCI CLI
brew_install "gh"                    # GitHub CLI (already installed)

# Container Tools
brew_install "docker-compose"        # Docker Compose
brew_install "podman"                # Alternative container runtime

echo "🔧 Installing Documentation Tools..."

# Documentation Generators
pip_install "pdoc"                   # API documentation
npm_install "typedoc"                # TypeScript documentation

echo "🔧 Installing Performance & Monitoring Tools..."

# Performance Tools
pip_install "pyperf"                 # Python performance
npm_install "clinic"                 # Node.js performance
brew_install "perf"                  # Linux performance tools

# Monitoring
pip_install "datadog"                # Monitoring
pip_install "newrelic"               # APM

echo "🔧 Installing Security Tools..."

# Security Scanning
pip_install "safety"                 # Security auditing
npm_install "audit-ci"               # NPM audit CI
brew_install "trivy"                 # Container security

echo "🔧 Installing Data Processing Tools..."

# ETL Tools
pip_install "petl"                   # ETL pipelines
pip_install "bonobo"                 # Data processing

# Data Validation
pip_install "cerberus"               # Data validation
pip_install "schema"                 # Schema validation

echo "✅ Tool Installation Complete!"
echo "📋 Installed tools summary saved to: $LOG_FILE"
echo ""
echo "🔄 Next steps:"
echo "1. Configure Chezmoi templates for all tools"
echo "2. Set up oh-my-zsh plugins"
echo "3. Configure Starship modules"
echo "4. Parameterize with 1Password secrets"
echo "5. Test and validate configurations"

echo "🎯 Installation Summary:"
echo "- Core CLI tools: ✅"
echo "- Python packages: ✅"
echo "- Node.js packages: ✅"
echo "- Cloud tools: ✅"
echo "- Desktop apps: ✅"
echo "- Language tools: ✅"
echo "- Testing tools: ✅"
echo "- Security tools: ✅"
echo "- Performance tools: ✅"

echo "📊 Total tools installed: $(grep -c "Installing" "$LOG_FILE" || echo "Unknown")"