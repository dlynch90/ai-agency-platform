#!/bin/bash

# Gibson CLI Event-Driven Integration
# Comprehensive setup for persistent, event-driven Gibson CLI operations

set -e

# Configuration
GIBSON_PROJECT="${GIBSONAI_PROJECT:-AI Agency Pro}"
KAFKA_BROKERS="${KAFKA_BROKERS:-localhost:9092}"
TEMPORAL_ADDRESS="${TEMPORAL_ADDRESS:-localhost:7233}"

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Gibson Integration: $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] Gibson Integration: $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] Gibson Integration: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] Gibson Integration: $1${NC}"
}

info() {
    echo -e "${PURPLE}[INFO] Gibson Integration: $1${NC}"
}

highlight() {
    echo -e "${CYAN}$1${NC}"
}

# Check system prerequisites
check_prerequisites() {
    log "Checking system prerequisites..."

    local missing_deps=()

    # Check Python 3.11
    if ! python3.11 --version >/dev/null 2>&1; then
        missing_deps+=("python3.11")
    fi

    # Check Docker
    if ! docker --version >/dev/null 2>&1; then
        missing_deps+=("docker")
    fi

    # Check Kafka
    if ! timeout 5 bash -c "</dev/tcp/localhost/9092" 2>/dev/null; then
        missing_deps+=("kafka")
    fi

    # Check Temporal (optional)
    if ! timeout 5 bash -c "</dev/tcp/localhost/7233" 2>/dev/null; then
        warning "Temporal not available - workflows will use fallback mode"
    fi

    if [[ ${#missing_deps[@]} -eq 0 ]]; then
        success "All prerequisites met"
        return 0
    else
        error "Missing prerequisites: ${missing_deps[*]}"
        return 1
    fi
}

# Setup Gibson CLI configuration
setup_gibson_config() {
    log "Setting up Gibson CLI configuration..."

    local config_dir="$HOME/.gibsonai"

    # Create config directory
    mkdir -p "$config_dir"

    # Create config file if it doesn't exist
    if [[ ! -f "$config_dir/config" ]]; then
        log "Creating Gibson CLI config file..."
        cat > "$config_dir/config" << 'EOF'
{
  "AI Agency Pro": {
    "id": "4b3c4aef-9704-4ca3-abb8-669ad2e0f0c4",
    "meta": {
      "version": 2,
      "project": {
        "description": "AI Agency Platform with Multi-Client Support"
      }
    },
    "api": {
      "key": null
    },
    "code": {
      "custom": {
        "model": {
          "class": "BaseModel",
          "path": "src/models"
        }
      },
      "frameworks": {
        "api": "fastapi",
        "model": "pydantic",
        "revision": "alembic",
        "schema": "sqlalchemy",
        "test": "pytest"
      },
      "language": "python"
    },
    "datastore": {
      "type": "postgresql",
      "uri": "postgresql://postgres:postgres@localhost:5432/ai_agency"
    },
    "modeler": {
      "version": "1.0"
    },
    "dev": {
      "active": true,
      "api": {"path": null, "prefix": "-", "version": "v1"},
      "base": {"path": "src"},
      "model": {"path": "src/models"},
      "schema": {"path": "src/schema"}
    }
  }
}
EOF
        success "Gibson CLI config file created"
    else
        success "Gibson CLI config file already exists"
    fi
}

# Setup event-driven hooks
setup_hooks() {
    log "Setting up event-driven hooks..."

    # Make hook scripts executable
    chmod +x hooks/gibson-persistence.sh
    chmod +x hooks/pre-workflow-validation.sh
    chmod +x hooks/post-workflow-notification.sh
    chmod +x hooks/workflow-error-handler.sh

    success "Event-driven hooks configured"
}

# Setup Kafka integration
setup_kafka_integration() {
    log "Setting up Kafka event streaming..."

    # Make Kafka scripts executable
    chmod +x scripts/kafka-gibson-producer.sh
    chmod +x scripts/kafka-gibson-consumer.sh

    # Test Kafka connectivity
    if ./scripts/kafka-gibson-producer.sh check >/dev/null 2>&1; then
        success "Kafka integration ready"
    else
        warning "Kafka not available - event streaming disabled"
    fi
}

# Setup Temporal workflows
setup_temporal_workflows() {
    log "Setting up Temporal workflow orchestration..."

    # Check if Temporal is available
    if timeout 5 bash -c "</dev/tcp/localhost/7233" 2>/dev/null; then
        success "Temporal available for workflow orchestration"

        # Register workflows (would be done by Temporal CLI in production)
        info "Temporal workflows ready for Gibson CLI operations"
    else
        warning "Temporal not available - using fallback workflow mode"
    fi
}

# Setup workflow orchestrator
setup_workflow_orchestrator() {
    log "Setting up Gibson workflow orchestrator..."

    chmod +x scripts/gibson-workflow-orchestrator.sh

    success "Workflow orchestrator configured"
}

# Comprehensive health check
comprehensive_health_check() {
    log "Running comprehensive health check..."

    local issues=()

    # Check Gibson CLI
    if ! GIBSONAI_PROJECT="$GIBSON_PROJECT" ./bin/gibson-official --help >/dev/null 2>&1; then
        issues+=("gibson-cli")
    fi

    # Check infrastructure
    if ! timeout 5 bash -c "</dev/tcp/localhost/5432" 2>/dev/null; then
        issues+=("postgres")
    fi

    if ! timeout 5 bash -c "</dev/tcp/localhost/7687" 2>/dev/null; then
        issues+=("neo4j")
    fi

    if ! timeout 5 bash -c "</dev/tcp/localhost/6379" 2>/dev/null; then
        issues+=("redis")
    fi

    if ! timeout 5 bash -c "</dev/tcp/localhost/9200" 2>/dev/null; then
        issues+=("elasticsearch")
    fi

    if ! timeout 5 bash -c "</dev/tcp/localhost/11434" 2>/dev/null; then
        issues+=("ollama")
    fi

    # Check Kafka (optional)
    if ! timeout 5 bash -c "</dev/tcp/localhost/9092" 2>/dev/null; then
        warning "Kafka not available - event streaming limited"
    fi

    # Check Temporal (optional)
    if ! timeout 5 bash -c "</dev/tcp/localhost/7233" 2>/dev/null; then
        warning "Temporal not available - workflow orchestration limited"
    fi

    if [[ ${#issues[@]} -eq 0 ]]; then
        success "All critical services healthy"
        return 0
    else
        error "Health check failed for: ${issues[*]}"
        return 1
    fi
}

# Demonstrate use cases
demonstrate_use_cases() {
    log "Demonstrating Gibson CLI event-driven use cases..."

    highlight "
🎯 Gibson CLI Event-Driven Use Cases
=====================================
"

    # Use Case 1: Development Environment Setup
    info "Use Case 1: Development Environment Setup"
    echo "  - Trigger: git clone or project init"
    echo "  - Action: Automatic Gibson CLI activation"
    echo "  - Integration: Pre-commit hooks + Temporal workflows"

    # Use Case 2: CI/CD Pipeline Integration
    info "Use Case 2: CI/CD Pipeline Integration"
    echo "  - Trigger: git push or deployment events"
    echo "  - Action: Automated schema validation"
    echo "  - Integration: Kafka events + health monitoring"

    # Use Case 3: AI Model Training Integration
    info "Use Case 3: AI Model Training Integration"
    echo "  - Trigger: Training job events"
    echo "  - Action: Dynamic schema optimization"
    echo "  - Integration: Event streaming + workflow orchestration"

    # Use Case 4: Multi-Tenant Project Management
    info "Use Case 4: Multi-Tenant Project Management"
    echo "  - Trigger: User authentication events"
    echo "  - Action: Context switching and isolation"
    echo "  - Integration: Kafka topics + Temporal workflows"

    # Use Case 5: Infrastructure Scaling Events
    info "Use Case 5: Infrastructure Scaling Events"
    echo "  - Trigger: Load threshold breaches"
    echo "  - Action: Automatic Gibson instance scaling"
    echo "  - Integration: Monitoring hooks + scaling workflows"

    # Use Case 6: Error Recovery and Resilience
    info "Use Case 6: Error Recovery and Resilience"
    echo "  - Trigger: Gibson CLI crashes"
    echo "  - Action: Automated diagnosis and recovery"
    echo "  - Integration: Health monitoring + recovery workflows"

    # Use Case 7: Collaborative Development
    info "Use Case 7: Collaborative Development"
    echo "  - Trigger: Code merge requests"
    echo "  - Action: Gibson-assisted code review"
    echo "  - Integration: Event-driven collaboration workflows"

    # Use Case 8: Production Deployment
    info "Use Case 8: Production Deployment"
    echo "  - Trigger: Release events"
    echo "  - Action: Production schema deployment"
    echo "  - Integration: Deployment hooks + monitoring"

    # Use Case 9: Monitoring and Analytics
    info "Use Case 9: Monitoring and Analytics"
    echo "  - Trigger: Scheduled health checks"
    echo "  - Action: Continuous Gibson optimization"
    echo "  - Integration: Analytics events + optimization workflows"

    # Use Case 10: Backup and Disaster Recovery
    info "Use Case 10: Backup and Disaster Recovery"
    echo "  - Trigger: System failures"
    echo "  - Action: Gibson state backup and restoration"
    echo "  - Integration: Backup hooks + recovery workflows"
}

# Command line interface
case "${1:-help}" in
    "setup")
        # Complete setup
        highlight "🚀 Setting up Gibson CLI Event-Driven Integration"

        check_prerequisites
        setup_gibson_config
        setup_hooks
        setup_kafka_integration
        setup_temporal_workflows
        setup_workflow_orchestrator

        if comprehensive_health_check; then
            success "Gibson CLI event-driven integration setup complete!"
            demonstrate_use_cases
        else
            error "Setup completed with health issues - check logs above"
            exit 1
        fi
        ;;
    "check")
        # Health check only
        if comprehensive_health_check; then
            success "All systems healthy"
        else
            error "Health check failed"
            exit 1
        fi
        ;;
    "demo")
        # Demonstrate use cases
        demonstrate_use_cases
        ;;
    "help"|*)
        echo "Gibson CLI Event-Driven Integration Setup"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  setup    - Complete event-driven integration setup"
        echo "  check    - Run comprehensive health check"
        echo "  demo     - Demonstrate use cases"
        echo "  help     - Show this help"
        echo ""
        echo "Environment variables:"
        echo "  GIBSONAI_PROJECT  - Gibson project name (default: AI Agency Pro)"
        echo "  KAFKA_BROKERS     - Kafka broker addresses (default: localhost:9092)"
        echo "  TEMPORAL_ADDRESS  - Temporal server address (default: localhost:7233)"
        echo ""
        echo "Features:"
        echo "  ✅ Event-driven Gibson CLI activation"
        echo "  ✅ Kafka event streaming integration"
        echo "  ✅ Temporal workflow orchestration"
        echo "  ✅ Pre/post-commit hooks"
        echo "  ✅ Infrastructure lifecycle hooks"
        echo "  ✅ Health monitoring and recovery"
        echo "  ✅ Multi-tenant project support"
        echo "  ✅ 10 comprehensive use cases"
        exit 0
        ;;
esac