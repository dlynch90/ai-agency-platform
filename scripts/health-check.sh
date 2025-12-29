#!/bin/bash
# Health check script for Developer environment
# Run: ./scripts/health-check.sh
# Cron: */5 * * * * /Users/daniellynch/Developer/scripts/health-check.sh >> /tmp/health-check.log 2>&1

set -e

MEMORY_THRESHOLD=85
CPU_THRESHOLD=90
PROCESS_PATTERNS=("comprehensive-evaluator" "finite-element" "neo4j-dependency" "ollama-llm-judge")

echo "=== Health Check: $(date) ==="

# Get memory pressure
memory_status=$(memory_pressure 2>/dev/null | grep "System-wide memory free percentage" | awk '{print $NF}' | tr -d '%')
memory_used=$((100 - memory_status))

echo "Memory Used: ${memory_used}%"

if [ "$memory_used" -gt "$MEMORY_THRESHOLD" ]; then
    echo "ALERT: Memory usage critical (${memory_used}% > ${MEMORY_THRESHOLD}%)"
    
    # Kill known resource hogs
    for pattern in "${PROCESS_PATTERNS[@]}"; do
        pids=$(pgrep -f "$pattern" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "Killing processes matching: $pattern"
            pkill -9 -f "$pattern" 2>/dev/null || true
        fi
    done
fi

# Get CPU load average
load_avg=$(sysctl -n vm.loadavg | awk '{print $2}')
echo "Load Average (1min): $load_avg"

# Check for runaway Node.js processes
echo ""
echo "=== Top Node.js Processes ==="
ps aux | grep -E "node|npm" | grep -v grep | sort -k3 -rn | head -5 || echo "No Node.js processes"

# Check for high memory processes
echo ""
echo "=== Top Memory Processes ==="
ps aux -m | head -6

echo ""
echo "=== Health Check Complete ==="
