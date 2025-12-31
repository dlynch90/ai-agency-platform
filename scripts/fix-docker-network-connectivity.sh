#!/usr/bin/env bash
# Fix Docker Network Connectivity Issues
# Addresses: Missing networks, incorrect network assignments, DNS resolution failures

LOG_FILE="/Users/daniellynch/Developer/.cursor/debug.log"
SESSION_ID="network-fix-$(date +%s)"
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

echo "=== Docker Network Connectivity Fix ==="
echo "Session: $SESSION_ID"
echo ""

# Step 1: Create missing networks
echo "Step 1: Creating missing Docker networks..."
log_event "FIX-1" "network-create:start" "Creating missing networks" '{"networks":["network-proxy_database","network-proxy_cache","network-proxy_vector"]}'

for net_name in database cache vector; do
    full_net_name="network-proxy_${net_name}"
    if docker network inspect "$full_net_name" >/dev/null 2>&1; then
        log_event "FIX-1" "network-exists:$full_net_name" "Network already exists" "{\"network\":\"$full_net_name\",\"status\":\"exists\"}"
        echo "  ✓ Network $full_net_name already exists"
    else
        if docker network create "$full_net_name" >/dev/null 2>&1; then
            log_event "FIX-1" "network-create:$full_net_name" "Network created successfully" "{\"network\":\"$full_net_name\",\"status\":\"created\"}"
            echo "  ✓ Created network $full_net_name"
        else
            log_event "FIX-1" "network-create:$full_net_name" "Network creation failed" "{\"network\":\"$full_net_name\",\"status\":\"failed\",\"error\":\"creation_error\"}"
            echo "  ✗ Failed to create network $full_net_name"
        fi
    fi
done

# Step 2: Connect containers to correct networks
echo ""
echo "Step 2: Connecting containers to correct networks..."

# postgres should be on database and proxy networks
if docker ps --format '{{.Names}}' | grep -q '^postgres$'; then
    echo "  Processing postgres container..."
    log_event "FIX-2" "container-connect:postgres" "Connecting postgres to networks" '{"container":"postgres","target_networks":["network-proxy_database","network-proxy_proxy"]}'
    
    for net in network-proxy_database network-proxy_proxy; do
        if docker network inspect "$net" --format '{{range $k, $v := .Containers}}{{$k}} {{end}}' | grep -q postgres; then
            log_event "FIX-2" "network-check:postgres-$net" "Already connected" "{\"container\":\"postgres\",\"network\":\"$net\",\"status\":\"connected\"}"
            echo "    ✓ postgres already on $net"
        else
            if docker network connect "$net" postgres >/dev/null 2>&1; then
                log_event "FIX-2" "network-connect:postgres-$net" "Connection successful" "{\"container\":\"postgres\",\"network\":\"$net\",\"status\":\"connected\"}"
                echo "    ✓ Connected postgres to $net"
            else
                log_event "FIX-2" "network-connect:postgres-$net" "Connection failed" "{\"container\":\"postgres\",\"network\":\"$net\",\"status\":\"failed\"}"
                echo "    ✗ Failed to connect postgres to $net"
            fi
        fi
    done
else
    log_event "FIX-2" "container-missing:postgres" "Container not running" '{"container":"postgres","status":"not_running"}'
    echo "  ⚠ postgres container is not running"
fi

# neo4j should be on database and proxy networks
if docker ps --format '{{.Names}}' | grep -q '^neo4j$'; then
    echo "  Processing neo4j container..."
    log_event "FIX-2" "container-connect:neo4j" "Connecting neo4j to networks" '{"container":"neo4j","target_networks":["network-proxy_database","network-proxy_proxy"]}'
    
    for net in network-proxy_database network-proxy_proxy; do
        current_nets=$(docker inspect neo4j --format '{{range $net, $conf := .NetworkSettings.Networks}}{{$net}} {{end}}')
        if echo "$current_nets" | grep -q "$net"; then
            log_event "FIX-2" "network-check:neo4j-$net" "Already connected" "{\"container\":\"neo4j\",\"network\":\"$net\",\"status\":\"connected\"}"
            echo "    ✓ neo4j already on $net"
        else
            if docker network connect "$net" neo4j >/dev/null 2>&1; then
                log_event "FIX-2" "network-connect:neo4j-$net" "Connection successful" "{\"container\":\"neo4j\",\"network\":\"$net\",\"status\":\"connected\"}"
                echo "    ✓ Connected neo4j to $net"
            else
                err_msg=$(docker network connect "$net" neo4j 2>&1)
                if echo "$err_msg" | grep -q "already exists"; then
                    log_event "FIX-2" "network-check:neo4j-$net" "Already connected" "{\"container\":\"neo4j\",\"network\":\"$net\",\"status\":\"connected\"}"
                    echo "    ✓ neo4j already on $net (detected via error)"
                else
                    log_event "FIX-2" "network-connect:neo4j-$net" "Connection failed" "{\"container\":\"neo4j\",\"network\":\"$net\",\"status\":\"failed\",\"error\":\"$err_msg\"}"
                    echo "    ✗ Failed to connect neo4j to $net: $err_msg"
                fi
            fi
        fi
    done
else
    log_event "FIX-2" "container-missing:neo4j" "Container not running" '{"container":"neo4j","status":"not_running"}'
    echo "  ⚠ neo4j container is not running"
fi

# redis should be on cache and proxy networks
if docker ps --format '{{.Names}}' | grep -q '^redis$'; then
    echo "  Processing redis container..."
    log_event "FIX-2" "container-connect:redis" "Connecting redis to networks" '{"container":"redis","target_networks":["network-proxy_cache","network-proxy_proxy"]}'
    
    for net in network-proxy_cache network-proxy_proxy; do
        current_nets=$(docker inspect redis --format '{{range $net, $conf := .NetworkSettings.Networks}}{{$net}} {{end}}')
        if echo "$current_nets" | grep -q "$net"; then
            log_event "FIX-2" "network-check:redis-$net" "Already connected" "{\"container\":\"redis\",\"network\":\"$net\",\"status\":\"connected\"}"
            echo "    ✓ redis already on $net"
        else
            if docker network connect "$net" redis >/dev/null 2>&1; then
                log_event "FIX-2" "network-connect:redis-$net" "Connection successful" "{\"container\":\"redis\",\"network\":\"$net\",\"status\":\"connected\"}"
                echo "    ✓ Connected redis to $net"
            else
                err_msg=$(docker network connect "$net" redis 2>&1)
                if echo "$err_msg" | grep -q "already exists"; then
                    log_event "FIX-2" "network-check:redis-$net" "Already connected" "{\"container\":\"redis\",\"network\":\"$net\",\"status\":\"connected\"}"
                    echo "    ✓ redis already on $net (detected via error)"
                else
                    log_event "FIX-2" "network-connect:redis-$net" "Connection failed" "{\"container\":\"redis\",\"network\":\"$net\",\"status\":\"failed\",\"error\":\"$err_msg\"}"
                    echo "    ✗ Failed to connect redis to $net: $err_msg"
                fi
            fi
        fi
    done
else
    log_event "FIX-2" "container-missing:redis" "Container not running" '{"container":"redis","status":"not_running"}'
    echo "  ⚠ redis container is not running"
fi

# qdrant should be on vector and proxy networks
if docker ps --format '{{.Names}}' | grep -q '^qdrant$'; then
    echo "  Processing qdrant container..."
    log_event "FIX-2" "container-connect:qdrant" "Connecting qdrant to networks" '{"container":"qdrant","target_networks":["network-proxy_vector","network-proxy_proxy"]}'
    
    for net in network-proxy_vector network-proxy_proxy; do
        current_nets=$(docker inspect qdrant --format '{{range $net, $conf := .NetworkSettings.Networks}}{{$net}} {{end}}')
        if echo "$current_nets" | grep -q "$net"; then
            log_event "FIX-2" "network-check:qdrant-$net" "Already connected" "{\"container\":\"qdrant\",\"network\":\"$net\",\"status\":\"connected\"}"
            echo "    ✓ qdrant already on $net"
        else
            if docker network connect "$net" qdrant >/dev/null 2>&1; then
                log_event "FIX-2" "network-connect:qdrant-$net" "Connection successful" "{\"container\":\"qdrant\",\"network\":\"$net\",\"status\":\"connected\"}"
                echo "    ✓ Connected qdrant to $net"
            else
                err_msg=$(docker network connect "$net" qdrant 2>&1)
                if echo "$err_msg" | grep -q "already exists"; then
                    log_event "FIX-2" "network-check:qdrant-$net" "Already connected" "{\"container\":\"qdrant\",\"network\":\"$net\",\"status\":\"connected\"}"
                    echo "    ✓ qdrant already on $net (detected via error)"
                else
                    log_event "FIX-2" "network-connect:qdrant-$net" "Connection failed" "{\"container\":\"qdrant\",\"network\":\"$net\",\"status\":\"failed\",\"error\":\"$err_msg\"}"
                    echo "    ✗ Failed to connect qdrant to $net: $err_msg"
                fi
            fi
        fi
    done
else
    log_event "FIX-2" "container-missing:qdrant" "Container not running" '{"container":"qdrant","status":"not_running"}'
    echo "  ⚠ qdrant container is not running"
fi

# Step 3: Verify network assignments
echo ""
echo "Step 3: Verifying network assignments..."
log_event "FIX-3" "verification:start" "Verifying network assignments" '{}'

for container in postgres neo4j redis qdrant; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        local nets=$(docker inspect "$container" --format '{{range $net, $conf := .NetworkSettings.Networks}}{{$net}} {{end}}')
        log_event "FIX-3" "verify:$container" "Network assignment verification" "{\"container\":\"$container\",\"networks\":\"$nets\"}"
        echo "  $container networks: $nets"
    fi
done

# Step 4: Test DNS resolution
echo ""
echo "Step 4: Testing DNS resolution..."
log_event "FIX-4" "dns-test:start" "Testing DNS resolution" '{}'

if docker ps --format '{{.Names}}' | grep -q '^postgres$'; then
    # Test DNS resolution using getent
    if docker exec postgres getent hosts neo4j >/dev/null 2>&1; then
        resolved_ip=$(docker exec postgres getent hosts neo4j | awk '{print $1}')
        log_event "FIX-4" "dns-test:postgres-neo4j" "DNS resolution successful" "{\"source\":\"postgres\",\"target\":\"neo4j\",\"resolved_ip\":\"$resolved_ip\",\"status\":\"success\"}"
        echo "  ✓ postgres can resolve neo4j -> $resolved_ip"
    else
        log_event "FIX-4" "dns-test:postgres-neo4j" "DNS resolution failed" '{"source":"postgres","target":"neo4j","status":"failed"}'
        echo "  ✗ postgres cannot resolve neo4j"
    fi
    
    if docker exec postgres getent hosts redis >/dev/null 2>&1; then
        resolved_ip=$(docker exec postgres getent hosts redis | awk '{print $1}')
        log_event "FIX-4" "dns-test:postgres-redis" "DNS resolution successful" "{\"source\":\"postgres\",\"target\":\"redis\",\"resolved_ip\":\"$resolved_ip\",\"status\":\"success\"}"
        echo "  ✓ postgres can resolve redis -> $resolved_ip"
    else
        log_event "FIX-4" "dns-test:postgres-redis" "DNS resolution failed" '{"source":"postgres","target":"redis","status":"failed"}'
        echo "  ✗ postgres cannot resolve redis"
    fi
fi

echo ""
echo "=== Fix Complete ==="
echo "Check $LOG_FILE for detailed logs"
log_event "FIX-COMPLETE" "fix:complete" "Network fix completed" '{"session_id":"'$SESSION_ID'","status":"completed"}'
