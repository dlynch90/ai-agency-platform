#!/bin/bash
# Safe runner for resource-intensive scripts
# Usage: ./scripts/safe-run.sh <script.js> [args...]
#
# Features:
# - Memory limit enforcement
# - Timeout protection
# - Automatic cleanup on exit
# - Resource monitoring

set -e

SCRIPT="$1"
shift

if [ -z "$SCRIPT" ]; then
    echo "Usage: $0 <script.js> [args...]"
    exit 1
fi

# Configuration
MAX_MEMORY_MB="${MAX_MEMORY_MB:-4096}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-300}"  # 5 minutes default
NODE_OPTIONS_EXTRA="--max-old-space-size=${MAX_MEMORY_MB}"

echo "=== Safe Runner Configuration ==="
echo "Script: $SCRIPT"
echo "Max Memory: ${MAX_MEMORY_MB}MB"
echo "Timeout: ${TIMEOUT_SECONDS}s"
echo "================================="
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "=== Cleanup triggered ==="
    # Kill any child processes
    pkill -P $$ 2>/dev/null || true
    echo "Cleanup complete"
}

trap cleanup EXIT INT TERM

# Run with timeout and memory limits
export NODE_OPTIONS="${NODE_OPTIONS_EXTRA} ${NODE_OPTIONS:-}"

if command -v gtimeout &> /dev/null; then
    # GNU timeout (from coreutils)
    gtimeout --signal=TERM --kill-after=10 "${TIMEOUT_SECONDS}s" node "$SCRIPT" "$@"
elif command -v timeout &> /dev/null; then
    # Linux timeout
    timeout --signal=TERM --kill-after=10 "${TIMEOUT_SECONDS}s" node "$SCRIPT" "$@"
else
    # Fallback: use background process with timeout
    node "$SCRIPT" "$@" &
    PID=$!
    
    # Wait with timeout
    COUNTER=0
    while kill -0 $PID 2>/dev/null; do
        if [ $COUNTER -ge $TIMEOUT_SECONDS ]; then
            echo "TIMEOUT: Killing process after ${TIMEOUT_SECONDS}s"
            kill -TERM $PID 2>/dev/null || true
            sleep 2
            kill -9 $PID 2>/dev/null || true
            exit 124
        fi
        sleep 1
        COUNTER=$((COUNTER + 1))
    done
    
    wait $PID
fi

echo ""
echo "=== Script completed successfully ==="
