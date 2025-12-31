#!/usr/bin/env bash
# Verify Docker Network Connectivity - Final State Check

LOG_FILE="/Users/daniellynch/Developer/.cursor/debug.log"
SESSION_ID="network-verify-$(date +%s)"
RUN_ID="verify-run"

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

echo "=== Docker Network Connectivity Verification ==="
echo "Session: $SESSION_ID"
echo ""

# Check network assignments
echo "Network Assignments:"
for container in postgres neo4j redis qdrant; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        nets=$(docker inspect "$container" --format '{{range $net, $conf := .NetworkSettings.Networks}}{{$net}} {{end}}')
        log_event "VERIFY" "network-assignment:$container" "Container network assignment" "{\"container\":\"$container\",\"networks\":\"$nets\"}"
        echo "  $container: $nets"
    fi
done

echo ""
echo "DNS Resolution Tests:"
if docker ps --format '{{.Names}}' | grep -q '^postgres$'; then
    # Test DNS resolution
    for target in neo4j redis qdrant; do
        if docker exec postgres getent hosts "$target" >/dev/null 2>&1; then
            resolved_ip=$(docker exec postgres getent hosts "$target" | awk '{print $1}')
            log_event "VERIFY" "dns:$target" "DNS resolution successful" "{\"source\":\"postgres\",\"target\":\"$target\",\"resolved_ip\":\"$resolved_ip\",\"status\":\"success\"}"
            echo "  ✓ postgres -> $target: $resolved_ip"
        else
            log_event "VERIFY" "dns:$target" "DNS resolution failed" "{\"source\":\"postgres\",\"target\":\"$target\",\"status\":\"failed\"}"
            echo "  ✗ postgres -> $target: FAILED"
        fi
    done
fi

echo ""
echo "Port Connectivity Tests:"
if docker ps --format '{{.Names}}' | grep -q '^postgres$'; then
    # Test port connectivity
    if docker exec postgres sh -c "timeout 2 bash -c '</dev/tcp/neo4j/7687' 2>&1" >/dev/null 2>&1; then
        log_event "VERIFY" "port:neo4j-7687" "Port accessible" '{"source":"postgres","target":"neo4j","port":7687,"status":"open"}'
        echo "  ✓ postgres -> neo4j:7687: OPEN"
    else
        log_event "VERIFY" "port:neo4j-7687" "Port unreachable" '{"source":"postgres","target":"neo4j","port":7687,"status":"closed"}'
        echo "  ✗ postgres -> neo4j:7687: CLOSED"
    fi
    
    if docker exec postgres sh -c "timeout 2 bash -c '</dev/tcp/redis/6379' 2>&1" >/dev/null 2>&1; then
        log_event "VERIFY" "port:redis-6379" "Port accessible" '{"source":"postgres","target":"redis","port":6379,"status":"open"}'
        echo "  ✓ postgres -> redis:6379: OPEN"
    else
        log_event "VERIFY" "port:redis-6379" "Port unreachable" '{"source":"postgres","target":"redis","port":6379,"status":"closed"}'
        echo "  ✗ postgres -> redis:6379: CLOSED"
    fi
fi

echo ""
echo "=== Verification Complete ==="
log_event "VERIFY-COMPLETE" "verification:complete" "Network verification completed" '{"session_id":"'$SESSION_ID'","status":"completed"}'
