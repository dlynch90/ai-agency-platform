#!/bin/bash

# Kafka Gibson CLI Event Producer
# Publishes Gibson CLI events to Kafka for event-driven processing

set -e

# Configuration
KAFKA_BROKERS="${KAFKA_BROKERS:-localhost:9092}"
GIBSON_PROJECT="${GIBSONAI_PROJECT:-AI Agency Pro}"

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Kafka Producer: $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] Kafka Producer: $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] Kafka Producer: $1${NC}"
}

# Check if Kafka is available
check_kafka() {
    if ! timeout 5 bash -c "</dev/tcp/localhost/9092" 2>/dev/null; then
        error "Kafka broker not available at ${KAFKA_BROKERS}"
        return 1
    fi
    return 0
}

# Publish event to Kafka
publish_event() {
    local topic="$1"
    local event_data="$2"

    if ! check_kafka; then
        warning "Skipping event publish - Kafka unavailable"
        return 1
    fi

    # Create the full event payload
    local event_payload=$(cat <<EOF
{
  "eventId": "$(uuidgen 2>/dev/null || echo "$(date +%s)-$RANDOM")",
  "timestamp": "$(date -Iseconds)",
  "projectId": "${GIBSON_PROJECT}",
  "source": "gibson-cli-producer",
  ${event_data}
}
EOF
)

    # Publish to Kafka (using console producer)
    echo "$event_payload" | kafka-console-producer \
        --broker-list "${KAFKA_BROKERS}" \
        --topic "$topic" \
        --property "parse.key=true" \
        --property "key.separator=|" \
        2>/dev/null

    if [[ $? -eq 0 ]]; then
        log "Published event to topic '$topic'"
        return 0
    else
        error "Failed to publish event to topic '$topic'"
        return 1
    fi
}

# Gibson CLI health event
publish_health_event() {
    local status="$1"
    local details="$2"

    publish_event "gibson-events" "
  \"eventType\": \"health-status\",
  \"status\": \"$status\",
  \"details\": $details"
}

# Gibson CLI activation event
publish_activation_event() {
    local success="$1"
    local endpoint="$2"

    publish_event "gibson-events" "
  \"eventType\": \"activation\",
  \"success\": $success,
  \"mcpEndpoint\": \"$endpoint\""
}

# Gibson CLI schema generation event
publish_schema_event() {
    local entity_name="$1"
    local entity_type="$2"
    local success="$3"

    publish_event "project-events" "
  \"eventType\": \"schema-generated\",
  \"entityName\": \"$entity_name\",
  \"entityType\": \"$entity_type\",
  \"success\": $success"
}

# Gibson CLI deployment event
publish_deployment_event() {
    local success="$1"
    local changes="$2"

    publish_event "project-events" "
  \"eventType\": \"deployment\",
  \"success\": $success,
  \"changes\": $changes"
}

# Gibson CLI error event
publish_error_event() {
    local error_type="$1"
    local message="$2"
    local stack_trace="$3"

    publish_event "gibson-events" "
  \"eventType\": \"error\",
  \"errorType\": \"$error_type\",
  \"message\": \"$message\",
  \"stackTrace\": \"$stack_trace\""
}

# Command line interface
case "${1:-help}" in
    "health")
        # Publish health status
        status="${2:-unknown}"
        details="${3:-{}}"
        publish_health_event "$status" "$details"
        ;;
    "activation")
        # Publish activation event
        success="${2:-true}"
        endpoint="${3:-http://localhost:8000}"
        publish_activation_event "$success" "$endpoint"
        ;;
    "schema")
        # Publish schema generation event
        entity_name="$2"
        entity_type="$3"
        success="${4:-true}"
        if [[ -z "$entity_name" || -z "$entity_type" ]]; then
            error "Usage: $0 schema <entity_name> <entity_type> [success]"
            exit 1
        fi
        publish_schema_event "$entity_name" "$entity_type" "$success"
        ;;
    "deployment")
        # Publish deployment event
        success="${2:-true}"
        changes="${3:-[]}"
        publish_deployment_event "$success" "$changes"
        ;;
    "error")
        # Publish error event
        error_type="$2"
        message="$3"
        stack_trace="${4:-null}"
        publish_error_event "$error_type" "$message" "$stack_trace"
        ;;
    "check")
        # Check Kafka connectivity
        if check_kafka; then
            success "Kafka is available at ${KAFKA_BROKERS}"
            exit 0
        else
            error "Kafka is not available at ${KAFKA_BROKERS}"
            exit 1
        fi
        ;;
    "help"|*)
        echo "Kafka Gibson CLI Event Producer"
        echo ""
        echo "Usage: $0 <command> [args...]"
        echo ""
        echo "Commands:"
        echo "  health <status> [details]          - Publish health status event"
        echo "  activation <success> [endpoint]     - Publish activation event"
        echo "  schema <name> <type> [success]      - Publish schema generation event"
        echo "  deployment <success> [changes]      - Publish deployment event"
        echo "  error <type> <message> [trace]      - Publish error event"
        echo "  check                               - Check Kafka connectivity"
        echo "  help                                - Show this help"
        echo ""
        echo "Environment variables:"
        echo "  KAFKA_BROKERS    - Kafka broker addresses (default: localhost:9092)"
        echo "  GIBSONAI_PROJECT - Gibson project name (default: AI Agency Pro)"
        exit 0
        ;;
esac