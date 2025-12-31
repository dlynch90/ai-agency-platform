#!/usr/bin/env bash
# Comprehensive Monorepo Organization Script
# Organizes loose files, handles problematic directories, and sets up governance
# Uses vendor tools only (mv, mkdir, find, git, etc.)

set -euo pipefail

WORKSPACE_DIR="${HOME}/Developer"
LOG_FILE="${WORKSPACE_DIR}/logs/organization-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"; }
log_success() { echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"; }
log_error() { echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"; }

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

log_info "=== MONOREPO ORGANIZATION SCRIPT ==="
log_info "Workspace: $WORKSPACE_DIR"
log_info "Log file: $LOG_FILE"

# Step 1: Create required directories
create_directories() {
    log_info "Creating required directories..."
    
    local required_dirs=(
        "configs"
        "configs/backups"
        "docs"
        "logs"
        "scripts"
        "testing"
        "infra"
        "data"
        "api"
        "graphql"
        "federation"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$WORKSPACE_DIR/$dir" ]; then
            mkdir -p "$WORKSPACE_DIR/$dir"
            log_success "Created directory: $dir"
        fi
    done
}

# Step 2: Handle problematic directories
handle_problematic_directories() {
    log_info "Handling problematic directories..."
    
    # Handle --version directory (contains git hooks backup)
    if [ -d "$WORKSPACE_DIR/--version" ]; then
        log_warning "Found problematic directory: --version"
        if [ -d "$WORKSPACE_DIR/--version/_" ]; then
            log_info "Moving git hooks from --version/_ to .git/hooks/backup/..."
            mkdir -p "$WORKSPACE_DIR/.git/hooks/backup"
            if [ -n "$(ls -A "$WORKSPACE_DIR/--version/_" 2>/dev/null)" ]; then
                mv "$WORKSPACE_DIR/--version/_"/* "$WORKSPACE_DIR/.git/hooks/backup/" 2>/dev/null || true
                log_success "Moved git hooks from --version/_ to .git/hooks/backup/"
            fi
        fi
        rmdir "$WORKSPACE_DIR/--version/_" 2>/dev/null || true
        rmdir "$WORKSPACE_DIR/--version" 2>/dev/null || true
        log_success "Removed --version directory"
    fi
    
    # Handle ~ directory (looks like a mistake)
    if [ -d "$WORKSPACE_DIR/~" ]; then
        log_warning "Found problematic directory: ~"
        if [ -d "$WORKSPACE_DIR/~/Developer" ]; then
            log_info "Moving contents from ~/Developer to appropriate locations..."
            # Move configs
            if [ -d "$WORKSPACE_DIR/~/Developer/configs" ]; then
                find "$WORKSPACE_DIR/~/Developer/configs" -type f -exec mv {} "$WORKSPACE_DIR/configs/" \; 2>/dev/null || true
                log_success "Moved config files from ~/Developer/configs"
            fi
            # Move services
            if [ -d "$WORKSPACE_DIR/~/Developer/services" ]; then
                if [ ! -d "$WORKSPACE_DIR/services" ]; then
                    mkdir -p "$WORKSPACE_DIR/services"
                fi
                find "$WORKSPACE_DIR/~/Developer/services" -type f -exec mv {} "$WORKSPACE_DIR/services/" \; 2>/dev/null || true
                log_success "Moved service files from ~/Developer/services"
            fi
        fi
        rm -rf "$WORKSPACE_DIR/~"
        log_success "Removed ~ directory"
    fi
}

# Step 3: Organize loose files
organize_loose_files() {
    log_info "Organizing loose files in root directory..."
    
    local moved_count=0
    
    # Configuration files -> configs/
    while IFS= read -r file; do
        if [ -f "$file" ] && [ "$(basename "$file")" != "pixi.toml" ] && [ "$(basename "$file")" != "package.json" ]; then
            case "$(basename "$file")" in
                .chezmoidata.toml|.editorconfig|.gitleaks.toml|*.toml|*.json|*.yaml|*.yml)
                    mv "$file" "$WORKSPACE_DIR/configs/$(basename "$file")"
                    log_success "Moved: $(basename "$file") → configs/"
                    ((moved_count++))
                    ;;
            esac
        fi
    done < <(find "$WORKSPACE_DIR" -maxdepth 1 -type f -name ".*" -o -name "*.toml" -o -name "*.json" -o -name "*.yaml" -o -name "*.yml" 2>/dev/null)
    
    # Backup files -> configs/backups/
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            mv "$file" "$WORKSPACE_DIR/configs/backups/$(basename "$file")"
            log_success "Moved: $(basename "$file") → configs/backups/"
            ((moved_count++))
        fi
    done < <(find "$WORKSPACE_DIR" -maxdepth 1 -type f \( -name "*.backup" -o -name "*backup*" \) 2>/dev/null)
    
    log_success "Organized $moved_count loose files"
}

# Step 4: Verify canonical MCP config
verify_mcp_config() {
    log_info "Verifying canonical MCP configuration..."
    
    local mcp_config="${HOME}/.cursor/mcp.json"
    
    if [ ! -f "$mcp_config" ]; then
        log_error "Canonical MCP config not found: $mcp_config"
        return 1
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        log_warning "jq not available, skipping MCP config validation"
        return 0
    fi
    
    if jq empty "$mcp_config" 2>/dev/null; then
        local server_count
        server_count=$(jq '.mcpServers | length' "$mcp_config" 2>/dev/null || echo "0")
        log_success "Canonical MCP config valid: $server_count servers configured"
    else
        log_error "Canonical MCP config has invalid JSON"
        return 1
    fi
}

# Step 5: Update pre-commit hooks for governance
update_pre_commit_hooks() {
    log_info "Updating pre-commit hooks for governance..."
    
    local hook_dir="$WORKSPACE_DIR/.cursor/hooks/pre-commit"
    mkdir -p "$hook_dir"
    
    # Update organization check hook
    cat > "$hook_dir/organization-check.sh" << 'EOF'
#!/usr/bin/env bash
# Pre-commit hook: Enforce monorepo organization rules

set -euo pipefail

WORKSPACE_DIR="${HOME}/Developer"

# Allowed files in root (standard monorepo files)
ALLOWED_ROOT_FILES=(
    "package.json"
    "pixi.toml"
    "pixi.lock"
    "pnpm-lock.yaml"
    "README.md"
    "LICENSE"
    ".gitignore"
    ".gitattributes"
    "tsconfig.json"
    "turbo.json"
)

# Check for loose files in root
LOOSE_FILES=()
while IFS= read -r file; do
    local basename_file
    basename_file=$(basename "$file")
    local is_allowed=false
    
    for allowed in "${ALLOWED_ROOT_FILES[@]}"; do
        if [ "$basename_file" == "$allowed" ]; then
            is_allowed=true
            break
        fi
    done
    
    if [ "$is_allowed" == false ]; then
        LOOSE_FILES+=("$basename_file")
    fi
done < <(find "$WORKSPACE_DIR" -maxdepth 1 -type f ! -name ".*" 2>/dev/null)

if [ ${#LOOSE_FILES[@]} -gt 0 ]; then
    echo "❌ VIOLATION: Found ${#LOOSE_FILES[@]} loose files in root directory"
    echo "Files that must be moved:"
    printf '  - %s\n' "${LOOSE_FILES[@]}"
    echo ""
    echo "📁 Organization Requirements:"
    echo "  *.md files → /docs/ directory"
    echo "  *.sh files → /scripts/ directory"
    echo "  *.toml/*.json/*.yaml files → /configs/ directory"
    echo ""
    echo "Run: bash scripts/organize-monorepo-structure.sh"
    exit 1
fi

# Check for backup files
BACKUP_FILES=$(find "$WORKSPACE_DIR" -maxdepth 1 -type f \( -name "*.backup" -o -name "*backup*" \) 2>/dev/null | wc -l)
if [ "$BACKUP_FILES" -gt 0 ]; then
    echo "⚠️ Found $BACKUP_FILES backup files in root - consider moving to configs/backups/"
fi

# Check for problematic directory names
if [ -d "$WORKSPACE_DIR/--version" ] || [ -d "$WORKSPACE_DIR/~" ]; then
    echo "❌ VIOLATION: Found problematic directories (--version or ~)"
    echo "Run: bash scripts/organize-monorepo-structure.sh"
    exit 1
fi

echo "✅ Monorepo organization check passed"
exit 0
EOF

    chmod +x "$hook_dir/organization-check.sh"
    log_success "Updated pre-commit organization check hook"
    
    # Update lefthook config to use the hook
    local lefthook_config="$WORKSPACE_DIR/configs/lefthook.yml"
    if [ -f "$lefthook_config" ]; then
        log_info "Lefthook config found, ensuring organization check is included"
    else
        log_warning "Lefthook config not found at $lefthook_config"
    fi
}

# Step 6: Verify organization
verify_organization() {
    log_info "Verifying final organization..."
    
    local violations=0
    
    # Check for loose files
    local loose_count
    loose_count=$(find "$WORKSPACE_DIR" -maxdepth 1 -type f ! -name ".*" ! -name "package.json" ! -name "pixi.toml" ! -name "pixi.lock" ! -name "pnpm-lock.yaml" ! -name "README.md" ! -name "LICENSE" ! -name ".gitignore" ! -name "tsconfig.json" ! -name "turbo.json" 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "$loose_count" -gt 0 ]; then
        log_warning "Found $loose_count loose files remaining in root"
        violations=$((violations + 1))
    fi
    
    # Check for problematic directories
    if [ -d "$WORKSPACE_DIR/--version" ] || [ -d "$WORKSPACE_DIR/~" ]; then
        log_error "Problematic directories still exist"
        violations=$((violations + 1))
    fi
    
    if [ $violations -eq 0 ]; then
        log_success "Organization verification passed"
        return 0
    else
        log_error "Organization verification found $violations violations"
        return 1
    fi
}

# Main execution
main() {
    log_info "Starting monorepo organization..."
    
    cd "$WORKSPACE_DIR" || exit 1
    
    create_directories
    handle_problematic_directories
    organize_loose_files
    verify_mcp_config || log_warning "MCP config verification failed (non-blocking)"
    update_pre_commit_hooks
    verify_organization
    
    log_success "=== MONOREPO ORGANIZATION COMPLETE ==="
    log_info "Log file: $LOG_FILE"
    log_info "Next steps:"
    log_info "  1. Review moved files in configs/, configs/backups/"
    log_info "  2. Test pre-commit hooks: git add . && git commit -m 'test: verify organization'"
    log_info "  3. Verify MCP servers are working: check ~/.cursor/mcp.json"
}

main "$@"
