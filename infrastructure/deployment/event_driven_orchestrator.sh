#!/bin/bash
# Event-Driven Architecture Orchestrator
# Comprehensive automation for enterprise development workflows

set -e

echo "🎯 EVENT-DRIVEN ARCHITECTURE ORCHESTRATOR"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[EVENT]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
PROJECT_ROOT="${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}"
EVENT_LOG="$PROJECT_ROOT/logs/event_driven.log"
METRICS_DIR="$PROJECT_ROOT/metrics"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Create directories
mkdir -p "$METRICS_DIR" "$BACKUP_DIR" "$(dirname "$EVENT_LOG")"

# Event logging function
log_event() {
    local event_type="$1"
    local event_data="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $event_type: $event_data" >> "$EVENT_LOG"
}

# Function: Code Quality Orchestration
orchestrate_code_quality() {
    log "🔍 Orchestrating code quality checks..."

    local quality_score=0
    local total_checks=0

    # ESLint check
    if [ -f "eslint.config.js" ] || [ -f "eslint.config.mjs" ]; then
        ((total_checks++))
        if npx eslint . --ext .js,.ts,.jsx,.tsx --max-warnings 0 >/dev/null 2>&1; then
            ((quality_score++))
            log_event "QUALITY_CHECK" "ESLint passed"
        else
            warn "ESLint failed"
            log_event "QUALITY_CHECK" "ESLint failed"
        fi
    fi

    # TypeScript check
    if [ -f "tsconfig.json" ]; then
        ((total_checks++))
        if npx tsc --noEmit >/dev/null 2>&1; then
            ((quality_score++))
            log_event "QUALITY_CHECK" "TypeScript passed"
        else
            warn "TypeScript check failed"
            log_event "QUALITY_CHECK" "TypeScript failed"
        fi
    fi

    # Python quality checks
    if command -v ruff >/dev/null 2>&1; then
        ((total_checks++))
        if ruff check . >/dev/null 2>&1; then
            ((quality_score++))
            log_event "QUALITY_CHECK" "Ruff passed"
        else
            warn "Ruff check failed"
            log_event "QUALITY_CHECK" "Ruff failed"
        fi
    fi

    local final_score=$((quality_score * 100 / total_checks))
    info "Code quality score: $final_score% ($quality_score/$total_checks)"

    # Store metrics
    echo "$(date +%s),$final_score,$quality_score,$total_checks" >> "$METRICS_DIR/code_quality.csv"
}

# Function: Security Orchestration
orchestrate_security() {
    log "🔒 Orchestrating security checks..."

    local security_issues=0

    # Secret scanning
    if command -v trufflehog >/dev/null 2>&1; then
        if trufflehog filesystem . --fail >/dev/null 2>&1; then
            log_event "SECURITY_CHECK" "Trufflehog passed"
        else
            ((security_issues++))
            error "Secrets detected by Trufflehog"
            log_event "SECURITY_CHECK" "Trufflehog failed - secrets detected"
        fi
    fi

    # Hardcoded credentials check
    local hardcoded=$(grep -r "password\|secret\|token\|key" . --include="*.js" --include="*.ts" --include="*.py" | grep -v "node_modules\|__pycache__\|.git" | grep -c -E "(password|secret|token|key).*[:=].*['\"][^'\"]*['\"]" || true)

    if [ "$hardcoded" -gt 0 ]; then
        ((security_issues++))
        error "$hardcoded hardcoded credentials detected"
        log_event "SECURITY_CHECK" "Hardcoded credentials found: $hardcoded"
    else
        log_event "SECURITY_CHECK" "No hardcoded credentials detected"
    fi

    if [ "$security_issues" -eq 0 ]; then
        info "✅ All security checks passed"
    else
        error "❌ $security_issues security issues found"
    fi
}

# Function: Performance Orchestration
orchestrate_performance() {
    log "⚡ Orchestrating performance monitoring..."

    # Bundle size analysis
    if [ -f "package.json" ] && [ -d "node_modules" ]; then
        local bundle_size=$(du -sh node_modules 2>/dev/null | cut -f1 || echo "unknown")
        info "Node modules size: $bundle_size"
        log_event "PERFORMANCE" "Bundle size: $bundle_size"
    fi

    # Git repository size
    if [ -d ".git" ]; then
        local repo_size=$(du -sh .git 2>/dev/null | cut -f1 || echo "unknown")
        info "Git repository size: $repo_size"
        log_event "PERFORMANCE" "Repository size: $repo_size"
    fi

    # File count analysis
    local file_count=$(find . -type f | grep -v node_modules | grep -v .git | wc -l)
    local loose_files=$(find . -maxdepth 1 -type f | wc -l)
    info "Total files: $file_count, Loose files: $loose_files"
    log_event "PERFORMANCE" "File count: $file_count, Loose: $loose_files"
}

# Function: Backup Orchestration
orchestrate_backup() {
    log "💾 Orchestrating automated backups..."

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/$timestamp"

    mkdir -p "$backup_path"

    # Backup critical directories
    for dir in docs configs infra scripts; do
        if [ -d "$dir" ]; then
            cp -r "$dir" "$backup_path/" 2>/dev/null || true
        fi
    done

    # Backup configuration files
    find . -maxdepth 1 -name "*.toml" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" | xargs -I {} cp {} "$backup_path/" 2>/dev/null || true

    # Compress backup
    if command -v tar >/dev/null 2>&1; then
        cd "$BACKUP_DIR"
        tar -czf "${timestamp}.tar.gz" "$timestamp" >/dev/null 2>&1
        rm -rf "$timestamp"
        info "Backup compressed: ${timestamp}.tar.gz"
    fi

    log_event "BACKUP" "Created backup: $timestamp"

    # Cleanup old backups (keep last 10)
    ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
}

# Function: Metrics Collection
collect_metrics() {
    log "📊 Collecting comprehensive metrics..."

    local timestamp=$(date +%s)
    local commit_hash=$(git rev-parse HEAD 2>/dev/null || echo "no-git")
    local lines_changed=$(git diff --stat 2>/dev/null | tail -1 | awk '{print $4+$6}' 2>/dev/null || echo "0")

    # System metrics
    local cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | cut -d% -f1 2>/dev/null || echo "unknown")
    local memory_usage=$(top -l 1 | grep "PhysMem" | awk '{print $2}' | cut -dM -f1 2>/dev/null || echo "unknown")

    # File system metrics
    local total_files=$(find . -type f | grep -v node_modules | grep -v .git | wc -l)
    local total_dirs=$(find . -type d | grep -v node_modules | grep -v .git | wc -l)

    # Store metrics
    echo "$timestamp,$commit_hash,$lines_changed,$cpu_usage,$memory_usage,$total_files,$total_dirs" >> "$METRICS_DIR/system_metrics.csv"

    log_event "METRICS" "Collected system metrics: CPU=$cpu_usage%, MEM=${memory_usage}MB, Files=$total_files"
}

# Function: Integration Testing
run_integration_tests() {
    log "🧪 Running integration tests..."

    local test_results=0

    # API connectivity tests
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        info "✓ Ollama API reachable"
        log_event "INTEGRATION" "Ollama API: CONNECTED"
    else
        warn "✗ Ollama API unreachable"
        log_event "INTEGRATION" "Ollama API: DISCONNECTED"
        ((test_results++))
    fi

    # Docker connectivity
    if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
        info "✓ Docker daemon accessible"
        log_event "INTEGRATION" "Docker: CONNECTED"
    else
        warn "✗ Docker daemon inaccessible"
        log_event "INTEGRATION" "Docker: DISCONNECTED"
    fi

    # Database connectivity (placeholder)
    # Add actual database connectivity tests here

    if [ "$test_results" -eq 0 ]; then
        info "✅ All integration tests passed"
    else
        warn "⚠️  $test_results integration tests failed"
    fi
}

# Function: Compliance Orchestration
orchestrate_compliance() {
    log "📋 Orchestrating compliance checks..."

    local compliance_issues=0

    # Check for required directories
    for dir in docs logs testing infra data api graphql federation; do
        if [ ! -d "$dir" ]; then
            warn "Missing required directory: $dir"
            ((compliance_issues++))
        fi
    done

    # Check for loose files in root
    local loose_files=$(find . -maxdepth 1 -type f | grep -v -E '\.(gitkeep|gitignore)$' | wc -l)
    if [ "$loose_files" -gt 10 ]; then
        warn "$loose_files loose files in root directory (should be < 10)"
        ((compliance_issues++))
    fi

    # Check for hardcoded values
    local hardcoded=$(grep -r "http://localhost:\|127.0.0.1\|hardcoded\|TODO\|FIXME" . --include="*.js" --include="*.ts" --include="*.py" | grep -v node_modules | wc -l)
    if [ "$hardcoded" -gt 0 ]; then
        warn "$hardcoded potential hardcoded values detected"
        ((compliance_issues++))
    fi

    if [ "$compliance_issues" -eq 0 ]; then
        info "✅ All compliance checks passed"
        log_event "COMPLIANCE" "All checks passed"
    else
        error "❌ $compliance_issues compliance issues found"
        log_event "COMPLIANCE" "$compliance_issues issues found"
    fi
}

# Main orchestration function
main() {
    log "Starting comprehensive event-driven orchestration..."

    # Run all orchestration modules
    orchestrate_code_quality
    orchestrate_security
    orchestrate_performance
    orchestrate_backup
    collect_metrics
    run_integration_tests
    orchestrate_compliance

    log "Event-driven orchestration completed"

    # Generate summary report
    local total_events=$(wc -l < "$EVENT_LOG")
    local today_events=$(grep "$(date +%Y-%m-%d)" "$EVENT_LOG" | wc -l)

    info "Today's summary:"
    info "  Total events logged: $total_events"
    info "  Today's events: $today_events"
    info "  Backups created: $(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)"
    info "  Metrics collected: $(ls -1 "$METRICS_DIR"/*.csv 2>/dev/null | wc -l)"

    log_event "ORCHESTRATION" "Completed full orchestration cycle"
}

# Run main orchestration
case "${1:-all}" in
    "quality")
        orchestrate_code_quality
        ;;
    "security")
        orchestrate_security
        ;;
    "performance")
        orchestrate_performance
        ;;
    "backup")
        orchestrate_backup
        ;;
    "metrics")
        collect_metrics
        ;;
    "integration")
        run_integration_tests
        ;;
    "compliance")
        orchestrate_compliance
        ;;
    "all"|*)
        main
        ;;
esac