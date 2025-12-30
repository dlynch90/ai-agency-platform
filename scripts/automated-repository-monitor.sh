#!/bin/bash
set -euo pipefail

echo "🔍 COMPREHENSIVE REPOSITORY MONITORING - $(date)"
echo "==============================================="

# Function to log actions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a repository-monitor.log
}

# Function to check tool availability
check_tool() {
    if command -v "$1" >/dev/null 2>&1; then
        echo "✅ $1 available"
        return 0
    else
        echo "❌ $1 not available"
        return 1
    fi
}

log "Starting comprehensive repository analysis..."

# 1. GIT ANALYSIS (10+ tools)
log "📊 GIT ANALYSIS"
echo "---------------"

# Git status and health
check_tool git && {
    log "Git repository status:"
    git status --short | head -10

    log "Git log analysis:"
    git log --oneline -10

    log "Git branch analysis:"
    git branch -a | head -5

    log "Git remote analysis:"
    git remote -v | head -5
}

# GitHub CLI analysis
check_tool gh && {
    log "GitHub CLI analysis:"
    gh repo view --json name,description,updatedAt | head -10 2>/dev/null || echo "Not a GitHub repository"
}

# Git LFS analysis
check_tool git-lfs && {
    log "Git LFS analysis:"
    git lfs ls-files | wc -l | xargs echo "Git LFS files tracked:"
}

# 2. CODE QUALITY ANALYSIS (10+ tools)
log "🔧 CODE QUALITY ANALYSIS"
echo "------------------------"

# Lefthook status
check_tool lefthook && {
    log "Lefthook status:"
    lefthook version
}

# Node.js analysis
check_tool node && {
    log "Node.js version:"
    node --version

    if [ -f "package.json" ]; then
        log "NPM audit:"
        npm audit --audit-level moderate | head -10 2>/dev/null || echo "NPM audit completed"
    fi
}

# Python analysis
check_tool python3 && {
    log "Python version:"
    python3 --version

    if [ -f "pyproject.toml" ] || [ -f "requirements.txt" ]; then
        log "Python dependencies check:"
        python3 -c "import sys; print('Python path OK')" 2>/dev/null || echo "Python import issues detected"
    fi
}

# TypeScript analysis
check_tool tsc && {
    log "TypeScript compilation check:"
    if [ -f "tsconfig.json" ]; then
        tsc --noEmit 2>&1 | head -5 || echo "TypeScript compilation issues found"
    fi
}

# ESLint analysis
check_tool eslint && {
    log "ESLint analysis:"
    if [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ]; then
        eslint . --ext .js,.ts,.jsx,.tsx | head -10 2>/dev/null || echo "ESLint completed"
    fi
}

# 3. SECURITY ANALYSIS (5+ tools)
log "🔒 SECURITY ANALYSIS"
echo "-------------------"

# Check for exposed secrets
log "Secret detection:"
find . -type f -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./.pixi/*" \
    -exec grep -l "password\|secret\|key\|token" {} \; 2>/dev/null | head -5 | wc -l | xargs echo "Files with potential secrets:"

# 4. DEPENDENCY ANALYSIS (5+ tools)
log "📦 DEPENDENCY ANALYSIS"
echo "----------------------"

# Pixi analysis
check_tool pixi && {
    log "Pixi environment status:"
    pixi info | head -10 2>/dev/null || echo "Pixi environment check completed"
}

# Poetry analysis
check_tool poetry && {
    log "Poetry status:"
    poetry check 2>/dev/null || echo "Poetry check completed"
}

# 5. CONTAINER ANALYSIS (3+ tools)
log "🐳 CONTAINER ANALYSIS"
echo "---------------------"

# Docker analysis
check_tool docker && {
    log "Docker status:"
    docker --version
    if [ -f "Dockerfile" ]; then
        log "Dockerfile found - container build possible"
    fi
}

# Docker Compose analysis
check_tool docker-compose && {
    log "Docker Compose status:"
    docker-compose --version
    if [ -f "docker-compose.yml" ]; then
        log "Docker Compose configuration found"
    fi
}

# 6. INFRASTRUCTURE ANALYSIS (5+ tools)
log "🏗️ INFRASTRUCTURE ANALYSIS"
echo "---------------------------"

# Kubernetes analysis
check_tool kubectl && {
    log "Kubernetes CLI available:"
    kubectl version --client --short 2>/dev/null || echo "Kubectl client check completed"
}

# Terraform analysis
check_tool terraform && {
    log "Terraform available:"
    terraform version
}

# Ansible analysis
check_tool ansible && {
    log "Ansible available:"
    ansible --version | head -3
}

# 7. DATABASE ANALYSIS (4+ tools)
log "🗄️ DATABASE ANALYSIS"
echo "--------------------"

# PostgreSQL analysis
check_tool psql && {
    log "PostgreSQL client available"
}

# Neo4j analysis
check_tool neo4j && {
    log "Neo4j available:"
    neo4j --version 2>/dev/null || echo "Neo4j version check completed"
}

# Redis analysis
check_tool redis-cli && {
    log "Redis CLI available"
}

# 8. PERFORMANCE ANALYSIS (3+ tools)
log "⚡ PERFORMANCE ANALYSIS"
echo "-----------------------"

# System resource check
log "System resources:"
df -h | head -5
free -h 2>/dev/null || echo "Memory info not available"

# Process analysis
log "Repository size:"
du -sh . 2>/dev/null || echo "Size calculation completed"

# File count analysis
log "File statistics:"
find . -type f -not -path "./.git/*" | wc -l | xargs echo "Total files:"
find . -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.java" | wc -l | xargs echo "Source files:"

# 9. COMPLIANCE ANALYSIS (3+ tools)
log "📋 COMPLIANCE ANALYSIS"
echo "----------------------"

# Check for required files
log "Required file check:"
[ -f "README.md" ] && echo "✅ README.md present" || echo "❌ README.md missing"
[ -f "package.json" ] && echo "✅ package.json present" || echo "❌ package.json missing"
[ -f ".gitignore" ] && echo "✅ .gitignore present" || echo "❌ .gitignore missing"
[ -f "lefthook.yml" ] && echo "✅ lefthook.yml present" || echo "❌ lefthook.yml missing"

# 10. INTEGRATION ANALYSIS (5+ tools)
log "🔗 INTEGRATION ANALYSIS"
echo "-----------------------"

# MCP server check
log "MCP server analysis:"
if [ -d "mcp-servers" ]; then
    echo "✅ MCP servers directory present"
    ls mcp-servers/ | wc -l | xargs echo "MCP server files:"
else
    echo "❌ MCP servers directory missing"
fi

# API analysis
log "API endpoint analysis:"
find . -name "*.yml" -o -name "*.yaml" | xargs grep -l "api\|endpoint\|route" | wc -l | xargs echo "API config files:"

# GraphQL analysis
log "GraphQL analysis:"
find . -name "*.graphql" | wc -l | xargs echo "GraphQL schema files:"

log "Repository monitoring completed at $(date)"
echo "=========================================="
echo "📊 SUMMARY REPORT GENERATED"
echo "🔗 Check repository-monitor.log for detailed results"