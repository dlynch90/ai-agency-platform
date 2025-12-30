#!/bin/bash

# Gibson CLI Workflow Orchestrator
# Event-driven Gibson CLI operations with hooks, Kafka, and Temporal integration

set -e

# Configuration
GIBSON_PROJECT="${GIBSONAI_PROJECT:-AI Agency Pro}"
WORKFLOW_TIMEOUT=300  # 5 minutes
KAFKA_BROKERS="${KAFKA_BROKERS:-localhost:9092}"

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Gibson Orchestrator: $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] Gibson Orchestrator: $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] Gibson Orchestrator: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] Gibson Orchestrator: $1${NC}"
}

info() {
    echo -e "${PURPLE}[INFO] Gibson Orchestrator: $1${NC}"
}

# Check Gibson CLI health
check_gibson_health() {
    log "Checking Gibson CLI health..."

    if timeout 10s bash -c "cd ${HOME}/Developer && GIBSONAI_PROJECT='$GIBSON_PROJECT' ./bin/gibson-official --help >/dev/null 2>&1"; then
        success "Gibson CLI is healthy"
        return 0
    else
        error "Gibson CLI health check failed"
        return 1
    fi
}

# Activate Gibson CLI
activate_gibson() {
    log "Activating Gibson CLI..."

    # Check infrastructure readiness
    if ! check_infrastructure; then
        error "Infrastructure not ready for Gibson activation"
        return 1
    fi

    # Trigger Temporal activation workflow
    if command -v temporal &>/dev/null; then
        log "Triggering Temporal Gibson activation workflow"

        temporal workflow start \
            --task-queue gibson-activation \
            --workflow-id "gibson-activation-$(date +%s)" \
            --type GibsonActivationWorkflow \
            --input "{\"projectId\":\"$GIBSON_PROJECT\",\"services\":[\"postgres\",\"neo4j\",\"redis\",\"elasticsearch\",\"ollama\"],\"trigger\":\"manual-activation\"}" \
            2>/dev/null

        if [[ $? -eq 0 ]]; then
            success "Gibson activation workflow started"

            # Publish activation event to Kafka
            ./scripts/kafka-gibson-producer.sh activation true "http://localhost:8000" 2>/dev/null || true

            return 0
        else
            error "Failed to start Gibson activation workflow"
            return 1
        fi
    else
        # Fallback: direct activation
        warning "Temporal not available, attempting direct Gibson activation"

        if check_gibson_health; then
            success "Gibson CLI activated (direct mode)"
            return 0
        else
            error "Gibson CLI activation failed"
            return 1
        fi
    fi
}

# Check infrastructure readiness
check_infrastructure() {
    log "Checking infrastructure readiness..."

    local services=("postgres" "neo4j" "redis" "elasticsearch" "ollama")
    local failed_services=()

    for service in "${services[@]}"; do
        case "$service" in
            "postgres")
                if ! timeout 5 bash -c "</dev/tcp/localhost/5432" 2>/dev/null; then
                    failed_services+=("postgres")
                fi
                ;;
            "neo4j")
                if ! timeout 5 bash -c "</dev/tcp/localhost/7687" 2>/dev/null; then
                    failed_services+=("neo4j")
                fi
                ;;
            "redis")
                if ! timeout 5 bash -c "</dev/tcp/localhost/6379" 2>/dev/null; then
                    failed_services+=("redis")
                fi
                ;;
            "elasticsearch")
                if ! timeout 5 bash -c "</dev/tcp/localhost/9200" 2>/dev/null; then
                    failed_services+=("elasticsearch")
                fi
                ;;
            "ollama")
                if ! timeout 5 bash -c "</dev/tcp/localhost/11434" 2>/dev/null; then
                    failed_services+=("ollama")
                fi
                ;;
        esac
    done

    if [[ ${#failed_services[@]} -eq 0 ]]; then
        success "All infrastructure services are ready"
        return 0
    else
        warning "Infrastructure services not ready: ${failed_services[*]}"
        return 1
    fi
}

# Generate schema with Gibson CLI
generate_schema() {
    local entity_name="$1"
    local entity_type="$2"

    if [[ -z "$entity_name" || -z "$entity_type" ]]; then
        error "Usage: $0 schema <entity_name> <entity_type>"
        return 1
    fi

    log "Generating $entity_type schema for: $entity_name"

    # Check Gibson health first
    if ! check_gibson_health; then
        error "Gibson CLI not healthy, cannot generate schema"
        return 1
    fi

    # Generate schema
    local success=false
    if GIBSONAI_PROJECT="$GIBSON_PROJECT" ./bin/gibson-official code "$entity_type" "$entity_name" 2>/dev/null; then
        success=true
        success "Schema generated: $entity_name ($entity_type)"
    else
        error "Schema generation failed: $entity_name ($entity_type)"
    fi

    # Publish event to Kafka
    ./scripts/kafka-gibson-producer.sh schema "$entity_name" "$entity_type" "$success" 2>/dev/null || true

    return $([ "$success" = true ] && echo 0 || echo 1)
}

# Deploy project with Gibson CLI
deploy_project() {
    log "Deploying Gibson project: $GIBSON_PROJECT"

    # Check Gibson health first
    if ! check_gibson_health; then
        error "Gibson CLI not healthy, cannot deploy"
        return 1
    fi

    # Deploy project
    local success=false
    local changes="[]"

    if GIBSONAI_PROJECT="$GIBSON_PROJECT" ./bin/gibson-official deploy 2>/dev/null; then
        success=true
        success "Project deployed successfully"

        # Extract changes (simplified)
        changes="[\"schema\", \"migrations\"]"
    else
        error "Project deployment failed"
    fi

    # Publish event to Kafka
    ./scripts/kafka-gibson-producer.sh deployment "$success" "$changes" 2>/dev/null || true

    return $([ "$success" = true ] && echo 0 || echo 1)
}

# Monitor Gibson CLI health
monitor_gibson() {
    log "Starting Gibson CLI health monitoring..."

    while true; do
        if check_gibson_health; then
            ./scripts/kafka-gibson-producer.sh health healthy "{}" 2>/dev/null || true
        else
            ./scripts/kafka-gibson-producer.sh health unhealthy "{\"lastCheck\":\"$(date)\"}" 2>/dev/null || true

            # Trigger recovery
            ./hooks/gibson-persistence.sh recover "$GIBSON_PROJECT" 2>/dev/null || true
        fi

        sleep 60  # Check every minute
    done
}

# Command line interface
case "${1:-help}" in
    "activate")
        # Activate Gibson CLI
        if activate_gibson; then
            success "Gibson CLI activation completed"
            exit 0
        else
            error "Gibson CLI activation failed"
            exit 1
        fi
        ;;
    "schema")
        # Generate schema
        if generate_schema "$2" "$3"; then
            exit 0
        else
            exit 1
        fi
        ;;
    "deploy")
        # Deploy project
        if deploy_project; then
            exit 0
        else
            exit 1
        fi
        ;;
    "monitor")
        # Start monitoring
        monitor_gibson
        ;;
    "health")
        # Check health
        if check_gibson_health; then
            success "Gibson CLI is healthy"
            exit 0
        else
            error "Gibson CLI is not healthy"
            exit 1
        fi
        ;;
    "check-infra")
        # Check infrastructure
        if check_infrastructure; then
            success "Infrastructure is ready"
            exit 0
        else
            error "Infrastructure is not ready"
            exit 1
        fi
        ;;
    "help"|*)
        echo "Gibson CLI Workflow Orchestrator"
        echo ""
        echo "Usage: $0 <command> [args...]"
        echo ""
        echo "Commands:"
        echo "  activate                 - Activate Gibson CLI with event-driven workflow"
        echo "  schema <name> <type>     - Generate schema (api, model, schema)"
        echo "  deploy                   - Deploy Gibson project"
        echo "  monitor                  - Start health monitoring"
        echo "  health                   - Check Gibson CLI health"
        echo "  check-infra              - Check infrastructure readiness"
        echo "  help                     - Show this help"
        echo ""
        echo "Environment variables:"
        echo "  GIBSONAI_PROJECT  - Gibson project name (default: AI Agency Pro)"
        echo "  KAFKA_BROKERS     - Kafka broker addresses (default: localhost:9092)"
        echo ""
        echo "Integration:"
        echo "  - Temporal workflows for orchestration"
        echo "  - Kafka event streaming"
        echo "  - Pre/post-commit hooks"
        echo "  - Infrastructure lifecycle hooks"
        exit 0
        ;;
esac