#!/usr/bin/env bash
# Fix Docker Network Connectivity Issues
# Connects containers to correct networks per docker-compose.network.yml specification

set -euo pipefail

LOG_FILE="/Users/daniellynch/Developer/.cursor/debug.log"
SESSION_ID="docker-network-fix-$(date +%s)"
RUN_ID="fix-run-1"

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

echo "=== Docker Network Connectivity Fix ==="
echo "Session ID: $SESSION_ID"
echo ""

# Step 1: Create missing networks
echo "Step 1: Creating missing networks..."
cd /Users/daniellynch/Developer/infrastructure/network-proxy

# Create networks using docker-compose (will create if they don't exist)
if docker-compose -f docker-compose.network.yml config --networks >/dev/null 2>&1; then
    log_event "FIX" "network-creation" "docker-compose networks validated" '{"status":"success"}'
    echo "✓ Networks configuration validated"
else
    log_event "FIX" "network-creation" "docker-compose config failed" '{"status":"failed","error":"config validation failed"}'
    echo "✗ Network configuration validation failed"
    exit 1
fi

# Create networks explicitly
NETWORKS=("network-proxy_database" "network-proxy_cache" "network-proxy_vector" "network-proxy_proxy")

for net_name in "${NETWORKS[@]}"; do
    # Extract base name (remove network-proxy_ prefix)
    base_name="${net_name#network-proxy_}"
    
    if docker network inspect "$net_name" >/dev/null 2>&1; then
        log_event "FIX" "network-exists:$net_name" "Network already exists" '{"network":"'"$net_name"'","status":"exists"}'
        echo "  ✓ Network $net_name already exists"
    else
        # Create network manually if it doesn't exist
        if docker network create "$net_name" >/dev/null 2>&1; then
            log_event "FIX" "network-created:$net_name" "Network created" '{"network":"'"$net_name"'","status":"created"}'
            echo "  ✓ Created network $net_name"
        else
            log_event "FIX" "network-create-failed:$net_name" "Network creation failed" '{"network":"'"$net_name"'","status":"failed"}'
            echo "  ✗ Failed to create network $net_name"
        fi
    fi
done

echo ""

# Step 2: Connect containers to correct networks
echo "Step 2: Connecting containers to networks..."

# Postgres: should be on database and proxy
if docker ps --format '{{.Names}}' | grep -q '^postgres$'; then
    echo "  Processing postgres container..."
    
    # Connect to database network
    if docker network inspect network-proxy_database --format '{{range $k, $v := .Containers}}{{$k}}{{end}}' | grep -q "$(docker inspect postgres --format '{{.Id}}')" 2>/dev/null; then
        log_event "FIX" "network-connect:postgres-database" "Already connected" '{"container":"postgres","network":"database","status":"already_connected"}'
        echo "    ✓ postgres already on database network"
    else
        if docker network connect network-proxy_database postgres 2>/dev/null; then
            log_event "FIX" "network-connect:postgres-database" "Connected successfully" '{"container":"postgres","network":"database","status":"connected"}'
            echo "    ✓ Connected postgres to database network"
        else
            log_event "FIX" "network-connect:postgres-database" "Connection failed" '{"container":"postgres","network":"database","status":"failed","error":"connection failed"}'
            echo "    ✗ Failed to connect postgres to database network"
        fi
    fi
    
    # Connect to proxy network
    if docker network inspect network-proxy_proxy --format '{{range $k, $v := .Containers}}{{$k}}{{end}}' | grep -q "$(docker inspect postgres --format '{{.Id}}')" 2>/dev/null; then
        log_event "FIX" "network-connect:postgres-proxy" "Already connected" '{"container":"postgres","network":"proxy","status":"already_connected"}'
        echo "    ✓ postgres already on proxy network"
    else
        if docker network connect network-proxy_proxy postgres 2>/dev/null; then
            log_event "FIX" "network-connect:postgres-proxy" "Connected successfully" '{"container":"postgres","network":"proxy","status":"connected"}'
            echo "    ✓ Connected postgres to proxy network"
        else
            log_event "FIX" "network-connect:postgres-proxy" "Connection failed" '{"container":"postgres","network":"proxy","status":"failed"}'
            echo "    ✗ Failed to connect postgres to proxy network"
        fi
    fi
else
    log_event "FIX" "container-missing:postgres" "Container not running" '{"container":"postgres","status":"not_running"}'
    echo "  ⚠ postgres container not running, skipping"
fi

# Neo4j: should be on database and proxy
if docker ps --format '{{.Names}}' | grep -q '^neo4j$'; then
    echo "  Processing neo4j container..."
    
    if docker network inspect network-proxy_database --format '{{range $k, $v := .Containers}}{{$k}}{{end}}' | grep -q "$(docker inspect neo4j --format '{{.Id}}')" 2>/dev/null; then
        log_event "FIX" "network-connect:neo4j-database" "Already connected" '{"container":"neo4j","network":"database","status":"already_connected"}'
        echo "    ✓ neo4j already on database network"
    else
        if docker network connect network-proxy_database neo4j 2>/dev/null; then
            log_event "FIX" "network-connect:neo4j-database" "Connected successfully" '{"container":"neo4j","network":"database","status":"connected"}'
            echo "    ✓ Connected neo4j to database network"
        else
            log_event "FIX" "network-connect:neo4j-database" "Connection failed" '{"container":"neo4j","network":"database","status":"failed"}'
            echo "    ✗ Failed to connect neo4j to database network"
        fi
    fi
    
    if docker network inspect network-proxy_proxy --format '{{range $k, $v := .Containers}}{{$k}}{{end}}' | grep -q "$(docker inspect neo4j --format '{{.Id}}')" 2>/dev/null; then
        log_event "FIX" "network-connect:neo4j-proxy" "Already connected" '{"container":"neo4j","network":"proxy","status":"already_connected"}'
        echo "    ✓ neo4j already on proxy network"
    else
        if docker network connect network-proxy_proxy neo4j 2>/dev/null; then
            log_event "FIX" "network-connect:neo4j-proxy" "Connected successfully" '{"container":"neo4j","network":"proxy","status":"connected"}'
            echo "    ✓ Connected neo4j to proxy network"
        else
            log_event "FIX" "network-connect:neo4j-proxy" "Connection failed" '{"container":"neo4j","network":"proxy","status":"failed"}'
            echo "    ✗ Failed to connect neo4j to proxy network"
        fi
    fi
else
    log_event "FIX" "container-missing:neo4j" "Container not running" '{"container":"neo4j","status":"not_running"}'
    echo "  ⚠ neo4j container not running, skipping"
fi

# Redis: should be on cache and proxy
if docker ps --format '{{.Names}}' | grep -q '^redis$'; then
    echo "  Processing redis container..."
    
    if docker network inspect network-proxy_cache --format '{{range $k, $v := .Containers}}{{$k}}{{end}}' | grep -q "$(docker inspect redis --format '{{.Id}}')" 2>/dev/null; then
        log_event "FIX" "network-connect:redis-cache" "Already connected" '{"container":"redis","network":"cache","status":"already_connected"}'
        echo "    ✓ redis already on cache network"
    else
        if docker network connect network-proxy_cache redis 2>/dev/null; then
            log_event "FIX" "network-connect:redis-cache" "Connected successfully" '{"container":"redis","network":"cache","status":"connected"}'
            echo "    ✓ Connected redis to cache network"
        else
            log_event "FIX" "network-connect:redis-cache" "Connection failed" '{"container":"redis","network":"cache","status":"failed"}'
            echo "    ✗ Failed to connect redis to cache network"
        fi
    fi
    
    if docker network inspect network-proxy_proxy --format '{{range $k, $v := .Containers}}{{$k}}{{end}}' | grep -q "$(docker inspect redis --format '{{.Id}}')" 2>/dev/null; then
        log_event "FIX" "network-connect:redis-proxy" "Already connected" '{"container":"redis","network":"proxy","status":"already_connected"}'
        echo "    ✓ redis already on proxy network"
    else
        if docker network connect network-proxy_proxy redis 2>/dev/null; then
            log_event "FIX" "network-connect:redis-proxy" "Connected successfully" '{"container":"redis","network":"proxy","status":"connected"}'
            echo "    ✓ Connected redis to proxy network"
        else
            log_event "FIX" "network-connect:redis-proxy" "Connection failed" '{"container":"redis","network":"proxy","status":"failed"}'
            echo "    ✗ Failed to connect redis to proxy network"
        fi
    fi
else
    log_event "FIX" "container-missing:redis" "Container not running" '{"container":"redis","status":"not_running"}'
    echo "  ⚠ redis container not running, skipping"
fi

# Qdrant: should be on vector and proxy
if docker ps --format '{{.Names}}' | grep -q '^qdrant$'; then
    echo "  Processing qdrant container..."
    
    if docker network inspect network-proxy_vector --format '{{range $k, $v := .Containers}}{{$k}}{{end}}' | grep -q "$(docker inspect qdrant --format '{{.Id}}')" 2>/dev/null; then
        log_event "FIX" "network-connect:qdrant-vector" "Already connected" '{"container":"qdrant","network":"vector","status":"already_connected"}'
        echo "    ✓ qdrant already on vector network"
    else
        if docker network connect network-proxy_vector qdrant 2>/dev/null; then
            log_event "FIX" "network-connect:qdrant-vector" "Connected successfully" '{"container":"qdrant","network":"vector","status":"connected"}'
            echo "    ✓ Connected qdrant to vector network"
        else
            log_event "FIX" "network-connect:qdrant-vector" "Connection failed" '{"container":"qdrant","network":"vector","status":"failed"}'
            echo "    ✗ Failed to connect qdrant to vector network"
        fi
    fi
    
    if docker network inspect network-proxy_proxy --format '{{range $k, $v := .Containers}}{{$k}}{{end}}' | grep -q "$(docker inspect qdrant --format '{{.Id}}')" 2>/dev/null; then
        log_event "FIX" "network-connect:qdrant-proxy" "Already connected" '{"container":"qdrant","network":"proxy","status":"already_connected"}'
        echo "    ✓ qdrant already on proxy network"
    else
        if docker network connect network-proxy_proxy qdrant 2>/dev/null; then
            log_event "FIX" "network-connect:qdrant-proxy" "Connected successfully" '{"container":"qdrant","network":"proxy","status":"connected"}'
            echo "    ✓ Connected qdrant to proxy network"
        else
            log_event "FIX" "network-connect:qdrant-proxy" "Connection failed" '{"container":"qdrant","network":"proxy","status":"failed"}'
            echo "    ✗ Failed to connect qdrant to proxy network"
        fi
    fi
else
    log_event "FIX" "container-missing:qdrant" "Container not running" '{"container":"qdrant","status":"not_running"}'
    echo "  ⚠ qdrant container not running, skipping"
fi

echo ""
echo "=== Network Fix Complete ==="
log_event "FIX" "fix-complete" "Network connectivity fix completed" '{"status":"complete","timestamp":"'"$(date -Iseconds)"'"}'
echo "Run the audit script to verify connectivity:"
echo "  /Users/daniellynch/Developer/scripts/docker-network-audit.sh"
