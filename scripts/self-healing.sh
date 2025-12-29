#!/bin/bash
# Self-Healing Development Environment Script
# Automatically detects and repairs common issues

set -euo pipefail

DEVELOPER_DIR="${DEVELOPER_DIR:-$HOME/Developer}"
LOG_FILE="$DEVELOPER_DIR/logs/self-healing.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

heal_broken_symlinks() {
    log "Checking for broken symlinks..."
    local count=$(find "$DEVELOPER_DIR" -type l ! -exec test -e {} \; -print 2>/dev/null | wc -l | tr -d ' ')
    if [ "$count" -gt 0 ]; then
        log "Found $count broken symlinks, cleaning..."
        find "$DEVELOPER_DIR" -type l ! -exec test -e {} \; -delete 2>/dev/null || true
        log "Cleaned broken symlinks"
    else
        log "No broken symlinks found"
    fi
}

heal_pixi_environments() {
    log "Checking pixi environments..."
    if [ -f "$DEVELOPER_DIR/pixi.toml" ]; then
        cd "$DEVELOPER_DIR"
        if ! pixi info >/dev/null 2>&1; then
            log "Pixi environment needs repair, running install..."
            pixi install 2>/dev/null || log "Pixi install had issues (non-critical)"
        else
            log "Pixi environments OK"
        fi
    fi
}

heal_mise_tools() {
    log "Checking mise tools..."
    if command -v mise >/dev/null 2>&1; then
        cd "$DEVELOPER_DIR"
        mise trust "$DEVELOPER_DIR/.mise.toml" 2>/dev/null || true
        local missing=$(mise doctor 2>&1 | grep -c "not installed" || true)
        if [ "$missing" -gt 0 ]; then
            log "Installing $missing missing mise tools..."
            mise install -y 2>/dev/null || log "Some mise tools had issues"
        else
            log "All mise tools installed"
        fi
    fi
}

clean_stale_caches() {
    log "Cleaning stale caches..."
    
    # Clean Python cache
    find "$DEVELOPER_DIR" -type d -name "__pycache__" -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    
    # Clean npm cache if too large
    if command -v npm >/dev/null 2>&1; then
        npm cache verify 2>/dev/null || true
    fi
    
    # Clean old logs > 50MB
    find "$DEVELOPER_DIR/logs" -type f -size +50M -mtime +7 -delete 2>/dev/null || true
    
    log "Cache cleanup complete"
}

heal_missing_node_modules() {
    log "Checking for projects missing node_modules..."
    for pkg in $(find "$DEVELOPER_DIR" -maxdepth 2 -name "package.json" -exec dirname {} \; 2>/dev/null); do
        if [ ! -d "$pkg/node_modules" ] && [ -f "$pkg/package.json" ]; then
            log "Installing node_modules in $pkg..."
            (cd "$pkg" && npm install --legacy-peer-deps 2>/dev/null) || log "npm install failed for $pkg"
        fi
    done
}

verify_lock_files() {
    log "Verifying lock files freshness..."
    
    # Check if package.json is newer than package-lock.json
    for pkg in $(find "$DEVELOPER_DIR" -maxdepth 2 -name "package.json" -exec dirname {} \; 2>/dev/null); do
        if [ -f "$pkg/package.json" ] && [ -f "$pkg/package-lock.json" ]; then
            if [ "$pkg/package.json" -nt "$pkg/package-lock.json" ]; then
                log "Lock file outdated in $pkg, running npm install..."
                (cd "$pkg" && npm install --legacy-peer-deps 2>/dev/null) || true
            fi
        fi
    done
    
    # Check pixi.toml vs pixi.lock
    if [ -f "$DEVELOPER_DIR/pixi.toml" ] && [ -f "$DEVELOPER_DIR/pixi.lock" ]; then
        if [ "$DEVELOPER_DIR/pixi.toml" -nt "$DEVELOPER_DIR/pixi.lock" ]; then
            log "Pixi lock file outdated, running pixi install..."
            (cd "$DEVELOPER_DIR" && pixi install 2>/dev/null) || true
        fi
    fi
}

generate_health_report() {
    log "Generating health report..."
    
    local broken_symlinks=$(find "$DEVELOPER_DIR" -type l ! -exec test -e {} \; -print 2>/dev/null | wc -l | tr -d ' ')
    local total_size=$(du -sh "$DEVELOPER_DIR" 2>/dev/null | cut -f1)
    local node_modules_count=$(find "$DEVELOPER_DIR" -maxdepth 3 -type d -name "node_modules" 2>/dev/null | wc -l | tr -d ' ')
    
    cat > "$DEVELOPER_DIR/logs/health-report.json" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "broken_symlinks": $broken_symlinks,
    "total_size": "$total_size",
    "node_modules_count": $node_modules_count,
    "status": "$([ "$broken_symlinks" -eq 0 ] && echo "healthy" || echo "needs_attention")"
}
EOF
    
    log "Health report saved to $DEVELOPER_DIR/logs/health-report.json"
}

main() {
    mkdir -p "$DEVELOPER_DIR/logs"
    log "=== Self-Healing Script Started ==="
    
    heal_broken_symlinks
    heal_mise_tools
    heal_pixi_environments
    heal_missing_node_modules
    clean_stale_caches
    verify_lock_files
    generate_health_report
    
    log "=== Self-Healing Script Completed ==="
}

main "$@"
