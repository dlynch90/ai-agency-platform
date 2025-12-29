#!/bin/bash
# Comprehensive AI Agency Development Environment Setup
# Installs all tools, databases, and integrations for real-world AI agency app development

set -e

echo "=== COMPREHENSIVE AI AGENCY DEVELOPMENT ENVIRONMENT SETUP ==="
echo "This script installs and configures everything needed for AI agency app development"
echo

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install via Homebrew
brew_install() {
    local package=$1
    if ! brew list "$package" >/dev/null 2>&1; then
        log "Installing $package via Homebrew..."
        brew install "$package"
    else
        info "$package already installed"
    fi
}

# Function to install via npm
npm_install_global() {
    local package=$1
    if ! npm list -g "$package" >/dev/null 2>&1; then
        log "Installing $package globally via npm..."
        npm install -g "$package"
    else
        info "$package already installed globally"
    fi
}

# Function to install via pipx
pipx_install() {
    local package=$1
    if ! pipx list | grep -q "$package"; then
        log "Installing $package via pipx..."
        pipx install "$package"
    else
        info "$package already installed via pipx"
    fi
}

# 1. DATABASE SETUP
setup_databases() {
    log "Setting up databases..."

    # PostgreSQL
    brew_install postgresql
    brew services start postgresql || warn "PostgreSQL service start failed"
    createdb ai_agency_db 2>/dev/null || info "Database ai_agency_db already exists"

    # Neo4j
    brew_install neo4j
    brew services start neo4j || warn "Neo4j service start failed"

    # Redis (for caching and sessions)
    brew_install redis
    brew services start redis || warn "Redis service start failed"

    log "Database setup completed"
}

# 2. DEVELOPMENT TOOLCHAINS
setup_dev_toolchains() {
    log "Setting up development toolchains..."

    # Node.js ecosystem
    npm_install_global yarn
    npm_install_global pnpm
    npm_install_global nx
    npm_install_global turbo

    # Python ecosystem
    pipx_install poetry
    pipx_install pipenv
    pipx_install cookiecutter

    # Go ecosystem
    brew_install go
    go install github.com/cosmtrek/air@latest 2>/dev/null || info "Air already installed"

    # Rust ecosystem
    brew_install rustup
    rustup update 2>/dev/null || info "Rust already up to date"

    # Java ecosystem
    brew_install maven
    brew_install gradle

    log "Development toolchains setup completed"
}

# 3. AI/ML AND DATA SCIENCE TOOLS
setup_ai_ml_tools() {
    log "Setting up AI/ML and data science tools..."

    # Python AI/ML libraries (via pipx)
    pipx_install jupyterlab
    pipx_install pandas
    pipx_install scikit-learn
    pipx_install tensorflow
    pipx_install pytorch
    pipx_install transformers
    pipx_install langchain
    pipx_install openai
    pipx_install anthropic

    # Data processing tools
    pipx_install dask
    pipx_install polars
    pipx_install duckdb

    log "AI/ML tools setup completed"
}

# 4. CLOUD AND INFRASTRUCTURE TOOLS
setup_cloud_infra() {
    log "Setting up cloud and infrastructure tools..."

    # AWS
    brew_install awscli
    brew_install aws-sam-cli

    # Google Cloud
    brew_install google-cloud-sdk

    # Azure
    brew_install azure-cli

    # Docker and container tools
    brew_install docker
    brew_install docker-compose
    brew_install kubectl
    brew_install k9s
    brew_install helm
    brew_install terraform
    brew_install terragrunt

    # Infrastructure as Code
    brew_install ansible
    brew_install packer

    log "Cloud infrastructure tools setup completed"
}

# 5. DEVELOPMENT AND PRODUCTIVITY TOOLS
setup_dev_productivity() {
    log "Setting up development and productivity tools..."

    # Version control and Git tools
    brew_install gh
    brew_install git-lfs
    brew_install git-flow
    npm_install_global commitizen
    npm_install_global conventional-changelog-cli

    # Code quality and testing
    npm_install_global eslint
    npm_install_global prettier
    npm_install_global typescript
    pipx_install black
    pipx_install isort
    pipx_install flake8
    pipx_install mypy
    pipx_install pytest
    pipx_install pytest-cov
    pipx_install playwright

    # API development
    npm_install_global apollo-cli
    brew_install grpcurl

    # Database tools
    brew_install pgcli
    brew_install mycli
    npm_install_global prisma
    npm_install_global @prisma/client

    log "Development productivity tools setup completed"
}

# 6. MONITORING AND OBSERVABILITY
setup_monitoring() {
    log "Setting up monitoring and observability tools..."

    # Application monitoring
    npm_install_global sentry-cli
    npm_install_global @sentry/cli

    # Performance monitoring
    pipx_install py-spy
    pipx_install memory-profiler

    # System monitoring
    brew_install htop
    brew_install glances
    brew_install prometheus
    brew_install grafana

    log "Monitoring tools setup completed"
}

# 7. SECURITY AND COMPLIANCE
setup_security() {
    log "Setting up security and compliance tools..."

    # Secret management
    brew_install 1password-cli
    brew_install pass
    brew_install age

    # Security scanning
    brew_install trivy
    brew_install grype
    npm_install_global audit-ci
    pipx_install safety
    pipx_install bandit

    # Encryption and certificates
    brew_install mkcert
    brew_install step

    log "Security tools setup completed"
}

# 8. DOCUMENTATION AND COLLABORATION
setup_documentation() {
    log "Setting up documentation and collaboration tools..."

    # Documentation generators
    npm_install_global docsify-cli
    npm_install_global vuepress
    pipx_install sphinx
    pipx_install mkdocs

    # API documentation
    npm_install_global redoc-cli
    npm_install_global swagger-cli

    # Collaboration
    brew_install slack-cli
    npm_install_global netlify-cli

    log "Documentation tools setup completed"
}

# 9. TESTING AND QUALITY ASSURANCE
setup_testing() {
    log "Setting up testing and quality assurance tools..."

    # Load testing
    brew_install hey
    brew_install bombardier
    npm_install_global artillery

    # E2E testing
    npm_install_global cypress
    npm_install_global testcafe

    # Performance testing
    brew_install apachebench
    pipx_install locust

    # Code coverage
    npm_install_global nyc
    pipx_install coverage

    log "Testing tools setup completed"
}

# 10. DEPLOYMENT AND CI/CD
setup_deployment() {
    log "Setting up deployment and CI/CD tools..."

    # CI/CD platforms
    brew_install circleci
    npm_install_global vercel
    npm_install_global netlify-cli

    # Container registries
    brew_install docker-credential-helper

    # Deployment automation
    pipx_install ansible-runner
    brew_install capistrano

    log "Deployment tools setup completed"
}

# 11. DATA AND ANALYTICS
setup_data_analytics() {
    log "Setting up data and analytics tools..."

    # Data processing
    pipx_install apache-airflow
    brew_install apache-spark

    # ETL tools
    pipx_install prefect
    pipx_install dagster

    # Analytics
    brew_install metabase
    pipx_install streamlit

    log "Data analytics tools setup completed"
}

# 12. API DEVELOPMENT AND INTEGRATION
setup_api_integration() {
    log "Setting up API development and integration tools..."

    # API clients
    brew_install httpie
    brew_install curlie
    npm_install_global axios

    # GraphQL
    npm_install_global graphql-cli
    npm_install_global apollo

    # REST API tools
    npm_install_global insomnia
    brew_install postman

    # Webhook testing
    npm_install_global ngrok
    npm_install_global localtunnel

    log "API integration tools setup completed"
}

# 13. MOBILE DEVELOPMENT
setup_mobile_dev() {
    log "Setting up mobile development tools..."

    # React Native
    npm_install_global react-native-cli
    npm_install_global expo-cli

    # Flutter (if needed)
    brew_install flutter

    # Mobile testing
    npm_install_global detox

    log "Mobile development tools setup completed"
}

# 14. DESIGN AND CREATIVE TOOLS
setup_design_creative() {
    log "Setting up design and creative tools..."

    # Design handoff
    npm_install_global figma-cli
    npm_install_global zeplin-cli

    # Image optimization
    npm_install_global imagemin-cli
    brew_install imagemagick

    log "Design tools setup completed"
}

# 15. FINAL CONFIGURATION AND VERIFICATION
final_setup() {
    log "Performing final configuration and verification..."

    # Create project structure
    mkdir -p ~/Developer/projects/{active,archived,templates}
    mkdir -p ~/Developer/tools/{scripts,configs,backups}

    # Set up global git configuration
    git config --global init.defaultBranch main
    git config --global pull.rebase true
    git config --global core.editor "code --wait"

    # Verify installations
    log "Verifying key installations..."
    command_exists node && info "✓ Node.js installed" || error "✗ Node.js missing"
    command_exists python3 && info "✓ Python installed" || error "✗ Python missing"
    command_exists go && info "✓ Go installed" || error "✗ Go missing"
    command_exists rustc && info "✓ Rust installed" || error "✗ Rust missing"
    command_exists docker && info "✓ Docker installed" || error "✗ Docker missing"
    command_exists kubectl && info "✓ Kubernetes CLI installed" || error "✗ Kubernetes CLI missing"

    # Display next steps
    cat << 'EOF'

🎉 AI AGENCY DEVELOPMENT ENVIRONMENT SETUP COMPLETED!

Next Steps:
1. Configure your cloud accounts (AWS, GCP, Azure)
2. Set up API keys for AI services (OpenAI, Anthropic, etc.)
3. Initialize your first AI agency project
4. Review the 20 use cases in ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/20-ai-agency-use-cases.md

Useful Commands:
- Create new project: npx create-next-app@latest my-ai-app
- Start database: brew services start postgresql
- Run AI models: pipx run openai
- Deploy to Vercel: npx vercel

Happy coding! 🚀

EOF

    log "Setup completed successfully!"
}

# MAIN EXECUTION
main() {
    # Pre-flight checks
    if ! command_exists brew; then
        error "Homebrew is required. Please install Homebrew first."
        exit 1
    fi

    if ! command_exists node; then
        warn "Node.js not found. Installing via mise..."
        mise use node@lts
    fi

    if ! command_exists python3; then
        warn "Python not found. Installing via mise..."
        mise use python@latest
    fi

    # Run all setup functions
    setup_databases
    setup_dev_toolchains
    setup_ai_ml_tools
    setup_cloud_infra
    setup_dev_productivity
    setup_monitoring
    setup_security
    setup_documentation
    setup_testing
    setup_deployment
    setup_data_analytics
    setup_api_integration
    setup_mobile_dev
    setup_design_creative
    final_setup
}

# Run main function
main "$@"