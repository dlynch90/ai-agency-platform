#!/usr/bin/env bash
# Verify Canonical MCP Configuration - ONE SOURCE OF TRUTH

LOG_FILE="/Users/daniellynch/Developer/.cursor/debug.log"
SESSION_ID="mcp-verify-$(date +%s)"
CANONICAL_MCP="$HOME/.cursor/mcp.json"

log_event() {
    local hypothesis_id="$1"
    local location="$2"
    local message="$3"
    local data="$4"
    
    local log_entry=$(jq -n \
        --arg sessionId "$SESSION_ID" \
        --arg runId "verify-run" \
        --arg hypothesisId "$hypothesis_id" \
        --arg location "$location" \
        --arg message "$message" \
        --argjson data "$data" \
        --argjson timestamp "$(date +%s)000" \
        '{sessionId: $sessionId, runId: $runId, hypothesisId: $hypothesisId, location: $location, message: $message, data: $data, timestamp: $timestamp}')
    
    echo "$log_entry" >> "$LOG_FILE"
}

echo "=== CANONICAL MCP CONFIGURATION VERIFICATION ==="
echo "Session: $SESSION_ID"
echo "Canonical Location: $CANONICAL_MCP"
echo ""

# STEP 1: Verify canonical file exists and is valid
echo "STEP 1: Verifying Canonical MCP Config File..."
if [ ! -f "$CANONICAL_MCP" ]; then
    log_event "CANONICAL-1" "file:missing" "Canonical MCP config missing" '{"path":"'$CANONICAL_MCP'","status":"error"}'
    echo "  ✗ CRITICAL: Canonical MCP config NOT FOUND at $CANONICAL_MCP"
    exit 1
fi

log_event "CANONICAL-1" "file:exists" "Canonical MCP config exists" '{"path":"'$CANONICAL_MCP'","status":"ok"}'
echo "  ✓ Canonical MCP config exists"

# Validate JSON
if ! jq empty "$CANONICAL_MCP" 2>/dev/null; then
    log_event "CANONICAL-1" "file:invalid-json" "Invalid JSON in canonical config" '{"status":"error"}'
    echo "  ✗ CRITICAL: Canonical MCP config is INVALID JSON"
    exit 1
fi

log_event "CANONICAL-1" "file:valid-json" "Valid JSON in canonical config" '{"status":"ok"}'
echo "  ✓ Canonical MCP config is valid JSON"

# STEP 2: Verify canonical metadata
echo ""
echo "STEP 2: Verifying Canonical Metadata..."
canonical_flag=$(jq -r '.metadata.canonical // false' "$CANONICAL_MCP" 2>/dev/null)
if [ "$canonical_flag" != "true" ]; then
    log_event "CANONICAL-2" "metadata:not-canonical" "Metadata does not mark as canonical" '{"status":"error"}'
    echo "  ⚠ WARNING: Metadata does not explicitly mark as canonical"
else
    log_event "CANONICAL-2" "metadata:canonical" "Metadata confirms canonical" '{"status":"ok"}'
    echo "  ✓ Metadata confirms this is canonical"
fi

# STEP 3: Count MCP servers
echo ""
echo "STEP 3: Counting MCP Servers..."
server_count=$(jq '.mcpServers | length' "$CANONICAL_MCP" 2>/dev/null || echo "0")
log_event "CANONICAL-3" "servers:count" "MCP servers count" "{\"count\":$server_count}"
echo "  ✓ MCP Servers configured: $server_count"

# List server names
server_names=$(jq -r '.mcpServers | keys[]' "$CANONICAL_MCP" 2>/dev/null | sort)
echo "  Server list:"
echo "$server_names" | while read -r server; do
    echo "    - $server"
done

# STEP 4: Verify GitHub Sync Configuration
echo ""
echo "STEP 4: Verifying GitHub Sync Configuration..."
github_sync=$(jq -r '.github_sync.enabled // false' "$CANONICAL_MCP" 2>/dev/null)
if [ "$github_sync" = "true" ]; then
    log_event "CANONICAL-4" "github:sync-enabled" "GitHub sync enabled" '{"status":"ok"}'
    echo "  ✓ GitHub sync is ENABLED"
    
    repo=$(jq -r '.github_sync.repository // "none"' "$CANONICAL_MCP" 2>/dev/null)
    log_event "CANONICAL-4" "github:repo" "GitHub repository" "{\"repo\":\"$repo\"}"
    echo "    Repository: $repo"
else
    log_event "CANONICAL-4" "github:sync-disabled" "GitHub sync disabled" '{"status":"warning"}'
    echo "  ⚠ GitHub sync is DISABLED"
fi

# STEP 5: Verify Neo4j Golden Path Configuration
echo ""
echo "STEP 5: Verifying Neo4j Golden Path Configuration..."
neo4j_enabled=$(jq -r '.neo4j_mappings.enabled // false' "$CANONICAL_MCP" 2>/dev/null)
if [ "$neo4j_enabled" = "true" ]; then
    log_event "CANONICAL-5" "neo4j:enabled" "Neo4j mappings enabled" '{"status":"ok"}'
    echo "  ✓ Neo4j mappings are ENABLED"
    
    critical_paths=$(jq -r '.neo4j_mappings.critical_paths[] // empty' "$CANONICAL_MCP" 2>/dev/null | head -5)
    if [ -n "$critical_paths" ]; then
        echo "    Critical paths configured:"
        echo "$critical_paths" | while read -r path; do
            echo "      - $path"
        done
    fi
else
    log_event "CANONICAL-5" "neo4j:disabled" "Neo4j mappings disabled" '{"status":"warning"}'
    echo "  ⚠ Neo4j mappings are DISABLED"
fi

# STEP 6: Check for duplicate/conflicting configs
echo ""
echo "STEP 6: Checking for Conflicting MCP Configurations..."
conflict_files=$(find /Users/daniellynch/Developer -name "mcp*.json" -type f 2>/dev/null | grep -v node_modules | grep -v "$CANONICAL_MCP")
conflict_count=$(echo "$conflict_files" | grep -c . || echo "0")

if [ "$conflict_count" -gt 0 ]; then
    log_event "CANONICAL-6" "conflicts:found" "Conflicting MCP configs found" "{\"count\":$conflict_count,\"status\":\"warning\"}"
    echo "  ⚠ WARNING: Found $conflict_count potential conflicting MCP config files:"
    echo "$conflict_files" | while read -r file; do
        echo "    - $file (NOT CANONICAL - use $CANONICAL_MCP instead)"
    done
else
    log_event "CANONICAL-6" "conflicts:none" "No conflicting configs" '{"status":"ok"}'
    echo "  ✓ No conflicting MCP configuration files found"
fi

# STEP 7: Verify Cursor IDE can read the config
echo ""
echo "STEP 7: Verifying Cursor IDE Accessibility..."
if [ -r "$CANONICAL_MCP" ]; then
    log_event "CANONICAL-7" "cursor:readable" "Config is readable by Cursor" '{"status":"ok"}'
    echo "  ✓ Canonical config is readable by Cursor IDE"
else
    log_event "CANONICAL-7" "cursor:not-readable" "Config not readable" '{"status":"error"}'
    echo "  ✗ CRITICAL: Canonical config is NOT readable by Cursor IDE"
fi

# Check file permissions
perms=$(ls -l "$CANONICAL_MCP" | awk '{print $1}')
log_event "CANONICAL-7" "cursor:permissions" "File permissions" "{\"perms\":\"$perms\"}"
echo "    Permissions: $perms"

# STEP 8: Test GitHub CLI access
echo ""
echo "STEP 8: Testing GitHub CLI Access..."
if command -v gh >/dev/null 2>&1; then
    if gh auth status >/dev/null 2>&1; then
        log_event "CANONICAL-8" "github-cli:authenticated" "GitHub CLI authenticated" '{"status":"ok"}'
        echo "  ✓ GitHub CLI is authenticated"
        
        # Test access to MCP catalog repo
        catalog_repo="${MCP_CATALOG_REPO:-modelcontextprotocol/servers}"
        if gh repo view "$catalog_repo" >/dev/null 2>&1; then
            log_event "CANONICAL-8" "github-cli:catalog-accessible" "MCP catalog accessible" "{\"repo\":\"$catalog_repo\",\"status\":\"ok\"}"
            echo "  ✓ MCP catalog repository accessible: $catalog_repo"
        else
            log_event "CANONICAL-8" "github-cli:catalog-inaccessible" "MCP catalog not accessible" "{\"repo\":\"$catalog_repo\",\"status\":\"warning\"}"
            echo "  ⚠ MCP catalog repository not accessible: $catalog_repo"
        fi
    else
        log_event "CANONICAL-8" "github-cli:not-authenticated" "GitHub CLI not authenticated" '{"status":"error"}'
        echo "  ✗ GitHub CLI is NOT authenticated. Run: gh auth login"
    fi
else
    log_event "CANONICAL-8" "github-cli:missing" "GitHub CLI not installed" '{"status":"error"}'
    echo "  ✗ GitHub CLI not installed"
fi

echo ""
echo "=== VERIFICATION COMPLETE ==="
log_event "COMPLETE" "verification:complete" "Canonical MCP verification completed" '{"session_id":"'$SESSION_ID'","canonical_path":"'$CANONICAL_MCP'","server_count":'$server_count',"status":"completed"}'
echo "Summary:"
echo "  - Canonical Config: $CANONICAL_MCP"
echo "  - MCP Servers: $server_count"
echo "  - GitHub Sync: $github_sync"
echo "  - Neo4j Mappings: $neo4j_enabled"
echo "  - Conflicting Files: $conflict_count"
echo ""
echo "Check $LOG_FILE for detailed logs"
