#!/bin/bash

# Gibson CLI Persistence Hook
# Ensures Gibson CLI remains active and healthy across system events

set -e

# Configuration
GIBSON_PROJECT="${GIBSONAI_PROJECT:-AI Agency Pro}"
GIBSON_CHECK_INTERVAL=300  # 5 minutes
GIBSON_HEALTH_TIMEOUT=30   # 30 seconds

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Gibson Persistence: $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] Gibson Persistence: $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] Gibson Persistence: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] Gibson Persistence: $1${NC}"
}

# Health check function
check_gibson_health() {
    local timeout=$1
    local project=$2

    if timeout "$timeout" bash -c "
        export GIBSONAI_PROJECT='$project'
        cd /Users/daniellynch/Developer
        ./bin/gibson-official --help >/dev/null 2>&1
    " 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Recovery function
recover_gibson() {
    local project=$1

    log "Attempting Gibson CLI recovery..."

    # Kill any existing processes
    pkill -f "gibson-official" 2>/dev/null || true

    # Wait a moment
    sleep 2

    # Try to restart
    if check_gibson_health 10 "$project"; then
        success "Gibson CLI recovered successfully"
        return 0
    else
        error "Gibson CLI recovery failed"
        return 1
    fi
}

# Main persistence loop
main() {
    local project="$1"

    log "Starting Gibson CLI persistence monitoring for project: $project"

    while true; do
        if ! check_gibson_health "$GIBSON_HEALTH_TIMEOUT" "$project"; then
            warning "Gibson CLI health check failed"

            # Publish health failure event to Kafka (if available)
            if command -v kafka-console-producer &>/dev/null; then
                echo "{\"event\":\"gibson-health-failure\",\"project\":\"$project\",\"timestamp\":\"$(date -Iseconds)\"}" | \
                kafka-console-producer --broker-list localhost:9092 --topic gibson-events 2>/dev/null || true
            fi

            # Trigger Temporal recovery workflow (if available)
            if command -v temporal &>/dev/null; then
                temporal workflow start \
                    --task-queue gibson-recovery \
                    --workflow-id "gibson-recovery-$(date +%s)" \
                    --type GibsonRecoveryWorkflow \
                    --input "{\"projectId\":\"$project\",\"failureReason\":\"health-check-failed\"}" \
                    2>/dev/null || true
            fi

            # Attempt local recovery
            if ! recover_gibson "$project"; then
                error "All Gibson CLI recovery attempts failed"
                # Could implement escalation here (email alerts, etc.)
            fi
        else
            # Gibson is healthy, publish status
            if command -v kafka-console-producer &>/dev/null; then
                echo "{\"event\":\"gibson-health-ok\",\"project\":\"$project\",\"timestamp\":\"$(date -Iseconds)\"}" | \
                kafka-console-producer --broker-list localhost:9092 --topic gibson-events 2>/dev/null || true
            fi
        fi

        sleep "$GIBSON_CHECK_INTERVAL"
    done
}

# Parse arguments
PROJECT="${1:-$GIBSON_PROJECT}"

case "${2:-start}" in
    "start")
        main "$PROJECT"
        ;;
    "check")
        if check_gibson_health "$GIBSON_HEALTH_TIMEOUT" "$PROJECT"; then
            success "Gibson CLI is healthy"
            exit 0
        else
            error "Gibson CLI is not healthy"
            exit 1
        fi
        ;;
    "recover")
        if recover_gibson "$PROJECT"; then
            success "Gibson CLI recovery successful"
            exit 0
        else
            error "Gibson CLI recovery failed"
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 [project] {start|check|recover}"
        echo "  project: Gibson project name (default: $GIBSON_PROJECT)"
        echo "  start: Start persistence monitoring"
        echo "  check: Check Gibson CLI health"
        echo "  recover: Attempt Gibson CLI recovery"
        exit 1
        ;;
esac