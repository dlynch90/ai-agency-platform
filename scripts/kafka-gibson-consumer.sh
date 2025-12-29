#!/bin/bash

# Kafka Gibson CLI Event Consumer
# Processes Gibson CLI events and triggers appropriate actions

set -e

# Configuration
KAFKA_BROKERS="${KAFKA_BROKERS:-localhost:9092}"
GIBSON_PROJECT="${GIBSONAI_PROJECT:-AI Agency Pro}"
CONSUMER_GROUP="gibson-event-processor"

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Kafka Consumer: $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] Kafka Consumer: $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] Kafka Consumer: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] Kafka Consumer: $1${NC}"
}

# Check if Kafka is available
check_kafka() {
    if ! timeout 5 bash -c "</dev/tcp/localhost/9092" 2>/dev/null; then
        error "Kafka broker not available at ${KAFKA_BROKERS}"
        return 1
    fi
    return 0
}

# Process health status event
process_health_event() {
    local event_data="$1"

    local status=$(echo "$event_data" | jq -r '.status')
    local project=$(echo "$event_data" | jq -r '.projectId')

    log "Processing health event: status=$status, project=$project"

    case "$status" in
        "healthy")
            success "Gibson CLI is healthy for project $project"
            ;;
        "unhealthy"|"failed")
            warning "Gibson CLI health check failed for project $project"

            # Trigger recovery workflow
            if command -v temporal &>/dev/null; then
                log "Triggering Gibson recovery workflow"
                temporal workflow start \
                    --task-queue gibson-recovery \
                    --workflow-id "gibson-recovery-$(date +%s)" \
                    --type GibsonRecoveryWorkflow \
                    --input "{\"projectId\":\"$project\",\"failureReason\":\"kafka-health-event\"}" \
                    2>/dev/null || error "Failed to trigger recovery workflow"
            else
                error "Temporal CLI not available for recovery workflow"
            fi
            ;;
        *)
            warning "Unknown health status: $status"
            ;;
    esac
}

# Process activation event
process_activation_event() {
    local event_data="$1"

    local success=$(echo "$event_data" | jq -r '.success')
    local project=$(echo "$event_data" | jq -r '.projectId')
    local endpoint=$(echo "$event_data" | jq -r '.mcpEndpoint // empty')

    log "Processing activation event: success=$success, project=$project"

    if [[ "$success" == "true" ]]; then
        success "Gibson CLI activated for project $project"
        if [[ -n "$endpoint" ]]; then
            log "MCP endpoint available at: $endpoint"
        fi

        # Update monitoring dashboards or send notifications
        # This could integrate with monitoring systems
    else
        error "Gibson CLI activation failed for project $project"
    fi
}

# Process schema generation event
process_schema_event() {
    local event_data="$1"

    local entity_name=$(echo "$event_data" | jq -r '.entityName')
    local entity_type=$(echo "$event_data" | jq -r '.entityType')
    local success=$(echo "$event_data" | jq -r '.success')
    local project=$(echo "$event_data" | jq -r '.projectId')

    log "Processing schema event: $entity_name ($entity_type), success=$success"

    if [[ "$success" == "true" ]]; then
        success "Schema generated: $entity_name ($entity_type) for project $project"

        # Could trigger additional processing like:
        # - Code quality checks
        # - Documentation generation
        # - Test generation
    else
        warning "Schema generation failed: $entity_name ($entity_type)"
    fi
}

# Process deployment event
process_deployment_event() {
    local event_data="$1"

    local success=$(echo "$event_data" | jq -r '.success')
    local project=$(echo "$event_data" | jq -r '.projectId')

    log "Processing deployment event: success=$success, project=$project"

    if [[ "$success" == "true" ]]; then
        success "Deployment completed for project $project"

        # Could trigger:
        # - Health checks
        # - Performance monitoring
        # - Notification to stakeholders
    else
        error "Deployment failed for project $project"

        # Could trigger:
        # - Rollback procedures
        # - Alert notifications
        # - Incident response
    fi
}

# Process error event
process_error_event() {
    local event_data="$1"

    local error_type=$(echo "$event_data" | jq -r '.errorType')
    local message=$(echo "$event_data" | jq -r '.message')
    local project=$(echo "$event_data" | jq -r '.projectId')

    error "Processing error event: $error_type - $message (project: $project)"

    # Trigger error handling workflows
    case "$error_type" in
        "configuration-error")
            log "Configuration error detected - may need config file repair"
            ;;
        "authentication-error")
            log "Authentication error detected - may need re-authentication"
            ;;
        "network-error")
            log "Network error detected - checking connectivity"
            ;;
        "resource-exhaustion")
            log "Resource exhaustion detected - may need scaling"
            ;;
        *)
            log "Unknown error type: $error_type"
            ;;
    esac
}

# Main event processing loop
process_events() {
    local topics="$1"

    if ! check_kafka; then
        error "Cannot start event processing - Kafka unavailable"
        exit 1
    fi

    log "Starting Gibson CLI event consumer for topics: $topics"

    # Use kafka-console-consumer to process events
    kafka-console-consumer \
        --bootstrap-server "${KAFKA_BROKERS}" \
        --topic "$topics" \
        --group "${CONSUMER_GROUP}" \
        --from-beginning \
        --property "print.key=true" \
        --property "key.separator=|" \
        2>/dev/null | while IFS='|' read -r key value; do

        # Parse the event
        local event_type=$(echo "$value" | jq -r '.eventType' 2>/dev/null)
        local project_id=$(echo "$value" | jq -r '.projectId' 2>/dev/null)

        if [[ -z "$event_type" ]]; then
            warning "Received malformed event: $value"
            continue
        fi

        log "Received event: $event_type (project: $project_id)"

        # Process based on event type
        case "$event_type" in
            "health-status")
                process_health_event "$value"
                ;;
            "activation")
                process_activation_event "$value"
                ;;
            "schema-generated")
                process_schema_event "$value"
                ;;
            "deployment")
                process_deployment_event "$value"
                ;;
            "error")
                process_error_event "$value"
                ;;
            *)
                log "Ignoring unknown event type: $event_type"
                ;;
        esac

    done
}

# Command line interface
case "${1:-help}" in
    "start")
        # Start event processing
        topics="${2:-gibson-events,project-events}"
        process_events "$topics"
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
    "topics")
        # List available topics
        if check_kafka; then
            log "Available Kafka topics:"
            kafka-topics --bootstrap-server "${KAFKA_BROKERS}" --list 2>/dev/null
        fi
        ;;
    "help"|*)
        echo "Kafka Gibson CLI Event Consumer"
        echo ""
        echo "Usage: $0 <command> [args...]"
        echo ""
        echo "Commands:"
        echo "  start [topics]          - Start processing events (default: gibson-events,project-events)"
        echo "  check                   - Check Kafka connectivity"
        echo "  topics                  - List available Kafka topics"
        echo "  help                    - Show this help"
        echo ""
        echo "Environment variables:"
        echo "  KAFKA_BROKERS    - Kafka broker addresses (default: localhost:9092)"
        echo "  GIBSONAI_PROJECT - Gibson project name (default: AI Agency Pro)"
        echo ""
        echo "Event Types Processed:"
        echo "  health-status     - Gibson CLI health check results"
        echo "  activation        - Gibson CLI activation events"
        echo "  schema-generated  - Schema generation completion"
        echo "  deployment        - Project deployment results"
        echo "  error             - Gibson CLI error events"
        exit 0
        ;;
esac