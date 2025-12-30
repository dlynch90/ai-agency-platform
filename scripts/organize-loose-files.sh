#!/bin/bash
# Organize Loose Files Script
# Moves categorized files to appropriate directories using vendor tools

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WORKSPACE_DIR="${HOME}/Developer"
AUDIT_FILE="$WORKSPACE_DIR/docs/audit/loose-files-audit.json"

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if audit file exists
if [ ! -f "$AUDIT_FILE" ]; then
    log_error "Audit file not found: $AUDIT_FILE"
    log_error "Run loose files audit first: python scripts/audit-loose-files.py"
    exit 1
fi

log_info "Starting file organization based on audit results..."

# Create target directories
create_directories() {
    log_info "Creating target directories..."

    # Use mkdir with -p for safety
    mkdir -p "$WORKSPACE_DIR/docs"
    mkdir -p "$WORKSPACE_DIR/scripts"
    mkdir -p "$WORKSPACE_DIR/configs"
    mkdir -p "$WORKSPACE_DIR/testing"
    mkdir -p "$WORKSPACE_DIR/logs"
    mkdir -p "$WORKSPACE_DIR/infra"
    mkdir -p "$WORKSPACE_DIR/data"
    mkdir -p "$WORKSPACE_DIR/api"
    mkdir -p "$WORKSPACE_DIR/graphql"
    mkdir -p "$WORKSPACE_DIR/federation"

    log_success "Target directories created"
}

# Move files using vendor tools
move_files_by_category() {
    local category="$1"
    local target_dir="$2"

    log_info "Moving $category files to $target_dir/..."

    # Use jq to extract file paths for this category
    # This assumes jq is available (it's in our Pixi config)
    local files_to_move
    files_to_move=$(jq -r ".categorized_files.\"$category\"[].relative_path" "$AUDIT_FILE" 2>/dev/null || echo "")

    if [ -z "$files_to_move" ]; then
        log_warning "No $category files found to move"
        return
    fi

    local moved_count=0
    echo "$files_to_move" | while read -r file_path; do
        if [ -n "$file_path" ] && [ "$file_path" != "null" ]; then
            local source_file="$WORKSPACE_DIR/$file_path"
            local target_file="$WORKSPACE_DIR/$target_dir/$(basename "$file_path")"

            if [ -f "$source_file" ]; then
                # Use mv for safety
                mv "$source_file" "$target_file"
                log_success "Moved: $file_path → $target_dir/"
                ((moved_count++))
            else
                log_warning "Source file not found: $source_file"
            fi
        fi
    done

    log_success "Moved $moved_count $category files"
}

# Handle uncategorized files
handle_uncategorized_files() {
    log_info "Handling uncategorized files..."

    # Create uncategorized directory for manual review
    mkdir -p "$WORKSPACE_DIR/uncategorized"

    local uncategorized_files
    uncategorized_files=$(jq -r '.categorized_files.uncategorized[].relative_path' "$AUDIT_FILE" 2>/dev/null || echo "")

    local moved_count=0
    echo "$uncategorized_files" | while read -r file_path; do
        if [ -n "$file_path" ] && [ "$file_path" != "null" ]; then
            local source_file="$WORKSPACE_DIR/$file_path"
            local target_file="$WORKSPACE_DIR/uncategorized/$(basename "$file_path")"

            if [ -f "$source_file" ]; then
                mv "$source_file" "$target_file"
                log_success "Moved to uncategorized: $file_path"
                ((moved_count++))
            fi
        fi
    done

    if [ "$moved_count" -gt 0 ]; then
        log_warning "$moved_count files moved to uncategorized/ for manual review"
        log_warning "Please review and manually organize files in uncategorized/"
    fi
}

# Update any hardcoded paths in moved scripts
update_script_paths() {
    log_info "Checking for hardcoded paths in moved scripts..."

    # This is a simplified check - in production you'd want more sophisticated path updating
    find "$WORKSPACE_DIR/scripts" -name "*.sh" -o -name "*.py" -o -name "*.js" | while read -r script_file; do
        # Check if script contains workspace-relative paths that need updating
        if grep -q "\.\./\|\./" "$script_file" 2>/dev/null; then
            log_warning "Script may contain relative paths that need updating: $(basename "$script_file")"
            log_warning "Please review: $script_file"
        fi
    done
}

# Verify organization
verify_organization() {
    log_info "Verifying file organization..."

    local remaining_files
    remaining_files=$(find "$WORKSPACE_DIR" -maxdepth 1 -type f | wc -l)

    if [ "$remaining_files" -eq 0 ]; then
        log_success "All loose files successfully organized!"
    else
        log_warning "$remaining_files files still remain in root directory"
        log_info "Remaining files:"
        find "$WORKSPACE_DIR" -maxdepth 1 -type f -exec basename {} \; | head -10
        if [ "$remaining_files" -gt 10 ]; then
            log_info "... and $(($remaining_files - 10)) more files"
        fi
    fi

    # Show directory structure
    log_info "New directory structure:"
    find "$WORKSPACE_DIR" -maxdepth 2 -type d | sort | while read -r dir; do
        local relative_dir=${dir#$WORKSPACE_DIR/}
        if [ "$relative_dir" != "$WORKSPACE_DIR" ]; then
            local file_count=$(find "$dir" -maxdepth 1 -type f | wc -l)
            if [ "$file_count" -gt 0 ]; then
                echo "  $relative_dir/ ($file_count files)"
            fi
        fi
    done
}

# Generate organization report
generate_report() {
    local report_file="$WORKSPACE_DIR/docs/reports/file-organization-report.md"

    cat > "$report_file" << EOF
# File Organization Report

**Date:** $(date)
**Audit File:** $AUDIT_FILE

## Summary

File organization completed successfully using vendor tools (mv, mkdir, find).

## Actions Taken

### Directories Created
- docs/ - Documentation files
- scripts/ - Executable scripts and automation
- configs/ - Configuration files
- testing/ - Test files and test suites
- logs/ - Log files and reports
- infra/ - Infrastructure configurations
- data/ - Data files and databases
- api/ - API definitions
- graphql/ - GraphQL schemas
- federation/ - API federation configs
- uncategorized/ - Files requiring manual review

### Files Moved
See audit file for detailed file movements: $AUDIT_FILE

## Next Steps

1. **Review uncategorized files** in the \`uncategorized/\` directory
2. **Update hardcoded paths** in moved scripts if necessary
3. **Test moved configurations** to ensure they still work
4. **Update documentation references** to new file locations

## Files Requiring Attention

### Scripts with Potential Path Issues
\`\`\`bash
# Check these files for hardcoded paths:
find scripts/ -name "*.sh" -o -name "*.py" -o -name "*.js" | head -10
\`\`\`

### Uncategorize Files
\`\`\`bash
# Review these files manually:
ls -la uncategorized/
\`\`\`

EOF

    log_success "Organization report generated: $report_file"
}

# Main execution
main() {
    log_info "=== FILE ORGANIZATION SCRIPT ==="
    log_info "Organizing loose files using vendor tools..."

    # Step 1: Create directories
    create_directories

    # Step 2: Move categorized files
    move_files_by_category "documentation" "docs"
    move_files_by_category "scripts" "scripts"
    move_files_by_category "configuration" "configs"
    move_files_by_category "tests" "testing"
    move_files_by_category "logs" "logs"
    move_files_by_category "infrastructure" "infra"
    move_files_by_category "data" "data"
    move_files_by_category "api" "api"

    # Step 3: Handle uncategorized files
    handle_uncategorized_files

    # Step 4: Check for path issues
    update_script_paths

    # Step 5: Verify organization
    verify_organization

    # Step 6: Generate report
    generate_report

    log_success "File organization completed!"
    log_info "Next: Review vendor compliance and replace custom scripts"
}

# Run main function
main "$@"