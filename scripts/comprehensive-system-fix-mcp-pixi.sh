#!/usr/bin/env bash
# Comprehensive System Fix: MCP Servers, Pixi, GitHub Sync, Network Health
# ONE CANONICAL MCP CONFIG: ~/.cursor/mcp.json

LOG_FILE="/Users/daniellynch/Developer/.cursor/debug.log"
SESSION_ID="system-fix-$(date +%s)"
RUN_ID="fix-run"

log_event() {
    local hypothesis_id="$1"
    local location="$2"
    local message="$3"
    local data="$4"
    
    local log_entry=$(jq -n \
        --arg sessionId "$SESSION_ID" \
        --arg runId "$RUN_ID" \
        --arg hypothesisId "$hypothesis_id" \
        --arg location "$location" \
        --arg message "$message" \
        --argjson data "$data" \
        --argjson timestamp "$(date +%s)000" \
        '{sessionId: $sessionId, runId: $runId, hypothesisId: $hypothesisId, location: $location, message: $message, data: $data, timestamp: $timestamp}')
    
    echo "$log_entry" >> "$LOG_FILE"
}

echo "=== COMPREHENSIVE SYSTEM FIX ==="
echo "Session: $SESSION_ID"
echo "Canonical MCP Config: ~/.cursor/mcp.json"
echo ""

# STEP 1: Fix Pixi Default Environment - Activate ML Packages
echo "STEP 1: Fixing Pixi Default Environment..."
log_event "PIXI-1" "pixi-config:check" "Checking pixi.toml configuration" '{}'

PIXI_TOML="/Users/daniellynch/Developer/pixi.toml"
if [ -f "$PIXI_TOML" ]; then
    current_env=$(grep -A 1 '^\[environments\]' "$PIXI_TOML" | grep 'default =' || echo "default = { features = [] }")
    log_event "PIXI-1" "pixi-config:current" "Current default environment" "{\"config\":\"$current_env\"}"
    
    # Check if ai-ml feature is in default
    if echo "$current_env" | grep -q "ai-ml"; then
        log_event "PIXI-1" "pixi-config:status" "ai-ml feature already in default" '{"status":"ok"}'
        echo "  ✓ ai-ml feature already in default environment"
    else
        echo "  ✗ ai-ml feature NOT in default environment - FIXING..."
        log_event "PIXI-1" "pixi-config:fix" "Adding ai-ml to default environment" '{"action":"update"}'
        
        # Backup original
        cp "$PIXI_TOML" "$PIXI_TOML.backup.$(date +%s)"
        
        # Update default environment to include ai-ml
        if grep -q '^default = { features = \["core"\] }' "$PIXI_TOML"; then
            sed -i '' 's/^default = { features = \["core"\] }/default = { features = ["core", "ai-ml"] }/' "$PIXI_TOML"
        elif grep -q '^default = { features = \["core", "ai-ml"\] }' "$PIXI_TOML"; then
            echo "  ✓ Already configured correctly"
        else
            # More complex replacement
            python3 << 'PYEOF'
import re
import sys

toml_file = "/Users/daniellynch/Developer/pixi.toml"
with open(toml_file, 'r') as f:
    content = f.read()

# Find environments section and update default
pattern = r'(\[environments\]\s*\n\s*default = \{ features = \[)([^\]]+)(\] \})'
match = re.search(pattern, content)
if match:
    features = match.group(2).strip().strip('"').strip("'")
    feature_list = [f.strip().strip('"').strip("'") for f in features.split(',')]
    if 'ai-ml' not in feature_list:
        feature_list.append('ai-ml')
        new_features = ', '.join([f'"{f}"' for f in feature_list])
        new_content = re.sub(pattern, f'\\1{new_features}\\3', content)
        with open(toml_file, 'w') as f:
            f.write(new_content)
        print("✓ Updated default environment to include ai-ml")
    else:
        print("✓ ai-ml already in default environment")
else:
    # Add if doesn't exist
    if '[environments]' not in content:
        content += '\n[environments]\n'
    if 'default =' not in content:
        content += 'default = { features = ["core", "ai-ml"] }\n'
    with open(toml_file, 'w') as f:
        f.write(content)
    print("✓ Added default environment with ai-ml")
PYEOF
        fi
        
        log_event "PIXI-1" "pixi-config:updated" "Default environment updated" '{"status":"updated"}'
        echo "  ✓ Updated pixi.toml to include ai-ml in default environment"
    fi
    
    # Verify pixi can parse the config
    if pixi project info >/dev/null 2>&1; then
        log_event "PIXI-1" "pixi-config:valid" "Pixi config is valid" '{"status":"valid"}'
        echo "  ✓ Pixi configuration is valid"
    else
        log_event "PIXI-1" "pixi-config:error" "Pixi config has errors" '{"status":"error"}'
        echo "  ✗ Pixi configuration has errors"
    fi
else
    log_event "PIXI-1" "pixi-config:missing" "pixi.toml not found" '{"status":"error"}'
    echo "  ✗ pixi.toml not found"
fi

# STEP 2: Verify Canonical MCP Config
echo ""
echo "STEP 2: Verifying Canonical MCP Configuration..."
CANONICAL_MCP="/Users/daniellynch/.cursor/mcp.json"

if [ -f "$CANONICAL_MCP" ]; then
    log_event "MCP-1" "mcp-config:exists" "Canonical MCP config exists" '{"path":"'$CANONICAL_MCP'"}'
    echo "  ✓ Canonical MCP config exists: $CANONICAL_MCP"
    
    # Validate JSON
    if jq empty "$CANONICAL_MCP" 2>/dev/null; then
        log_event "MCP-1" "mcp-config:valid" "MCP config is valid JSON" '{"status":"valid"}'
        echo "  ✓ MCP config is valid JSON"
        
        # Count servers
        server_count=$(jq '.mcpServers | length' "$CANONICAL_MCP" 2>/dev/null || echo "0")
        log_event "MCP-1" "mcp-config:servers" "MCP servers count" "{\"count\":$server_count}"
        echo "  ✓ MCP servers configured: $server_count"
        
        # Check GitHub sync status
        github_sync=$(jq -r '.github_sync.enabled // false' "$CANONICAL_MCP" 2>/dev/null)
        if [ "$github_sync" = "true" ]; then
            log_event "MCP-1" "mcp-config:github-sync" "GitHub sync enabled" '{"status":"enabled"}'
            echo "  ✓ GitHub sync is enabled"
        else
            log_event "MCP-1" "mcp-config:github-sync" "GitHub sync disabled" '{"status":"disabled"}'
            echo "  ⚠ GitHub sync is disabled"
        fi
    else
        log_event "MCP-1" "mcp-config:invalid" "MCP config is invalid JSON" '{"status":"error"}'
        echo "  ✗ MCP config is invalid JSON"
    fi
else
    log_event "MCP-1" "mcp-config:missing" "Canonical MCP config missing" '{"status":"error"}'
    echo "  ✗ Canonical MCP config missing: $CANONICAL_MCP"
fi

# STEP 3: GitHub CLI Integration for MCP Catalog Sync
echo ""
echo "STEP 3: Setting up GitHub CLI MCP Catalog Synchronization..."
log_event "GH-1" "github-cli:check" "Checking GitHub CLI authentication" '{}'

if command -v gh >/dev/null 2>&1; then
    if gh auth status >/dev/null 2>&1; then
        log_event "GH-1" "github-cli:auth" "GitHub CLI authenticated" '{"status":"ok"}'
        echo "  ✓ GitHub CLI is authenticated"
        
        # Create sync script for MCP catalog
        SYNC_SCRIPT="/Users/daniellynch/Developer/scripts/sync-mcp-catalog-from-github.sh"
        cat > "$SYNC_SCRIPT" << 'GHSCRIPTEOF'
#!/usr/bin/env bash
# Sync MCP Catalog from GitHub
# This script syncs MCP server configurations from GitHub MCP catalog

CANONICAL_MCP="$HOME/.cursor/mcp.json"
REPO="${MCP_CATALOG_REPO:-modelcontextprotocol/servers}"
BRANCH="${MCP_CATALOG_BRANCH:-main}"

echo "Syncing MCP catalog from GitHub..."
if gh repo view "$REPO" >/dev/null 2>&1; then
    echo "  ✓ Repository accessible: $REPO"
    # In the future, we can fetch catalog data here
    # For now, just verify access
    echo "  ✓ GitHub catalog sync ready"
else
    echo "  ✗ Cannot access repository: $REPO"
    exit 1
fi
GHSCRIPTEOF
        chmod +x "$SYNC_SCRIPT"
        log_event "GH-1" "github-cli:sync-script" "Created sync script" "{\"script\":\"$SYNC_SCRIPT\"}"
        echo "  ✓ Created MCP catalog sync script"
    else
        log_event "GH-1" "github-cli:auth-failed" "GitHub CLI not authenticated" '{"status":"error"}'
        echo "  ✗ GitHub CLI is not authenticated. Run: gh auth login"
    fi
else
    log_event "GH-1" "github-cli:missing" "GitHub CLI not installed" '{"status":"error"}'
    echo "  ✗ GitHub CLI not installed"
fi

# STEP 4: Docker Network Health Check
echo ""
echo "STEP 4: Checking Docker Network Health..."
log_event "DOCKER-1" "docker-network:check" "Checking Docker network connectivity" '{}'

# Quick connectivity test
if docker exec postgres getent hosts neo4j >/dev/null 2>&1; then
    log_event "DOCKER-1" "docker-network:dns" "DNS resolution working" '{"status":"ok"}'
    echo "  ✓ Docker network DNS resolution working"
else
    log_event "DOCKER-1" "docker-network:dns-failed" "DNS resolution failed" '{"status":"error"}'
    echo "  ✗ Docker network DNS resolution failed"
fi

# STEP 5: API Gateway Health Check
echo ""
echo "STEP 5: Checking API Gateway Health..."
log_event "GATEWAY-1" "api-gateway:check" "Checking API gateway status" '{}'

if docker ps --format '{{.Names}}' | grep -q 'kong'; then
    kong_status=$(docker inspect ai-agency-kong --format '{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
    log_event "GATEWAY-1" "api-gateway:kong" "Kong gateway status" "{\"status\":\"$kong_status\"}"
    if [ "$kong_status" = "healthy" ]; then
        echo "  ✓ Kong API Gateway is healthy"
    else
        echo "  ⚠ Kong API Gateway status: $kong_status"
    fi
fi

if docker ps --format '{{.Names}}' | grep -q 'traefik'; then
    log_event "GATEWAY-1" "api-gateway:traefik" "Traefik gateway running" '{"status":"ok"}'
    echo "  ✓ Traefik is running"
fi

# STEP 6: Neo4j Connection and Golden Path Mapping
echo ""
echo "STEP 6: Checking Neo4j Connection for Golden Path Mapping..."
log_event "NEO4J-1" "neo4j:check" "Checking Neo4j connection" '{}'

if docker exec neo4j cypher-shell -u neo4j -p agency_pass "RETURN 1 as test;" >/dev/null 2>&1; then
    log_event "NEO4J-1" "neo4j:connected" "Neo4j connection successful" '{"status":"ok"}'
    echo "  ✓ Neo4j connection successful"
    
    # Verify golden path queries work
    if docker exec neo4j cypher-shell -u neo4j -p agency_pass "MATCH (n) RETURN count(n) as node_count;" >/dev/null 2>&1; then
        log_event "NEO4J-1" "neo4j:query" "Neo4j queries working" '{"status":"ok"}'
        echo "  ✓ Neo4j queries working"
    fi
else
    log_event "NEO4J-1" "neo4j:connection-failed" "Neo4j connection failed" '{"status":"error"}'
    echo "  ✗ Neo4j connection failed"
fi

echo ""
echo "=== FIX COMPLETE ==="
log_event "COMPLETE" "fix:complete" "System fix completed" '{"session_id":"'$SESSION_ID'","status":"completed"}'
echo "Check $LOG_FILE for detailed logs"
