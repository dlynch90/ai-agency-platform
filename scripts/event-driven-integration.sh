#!/bin/bash

# Event-Driven Architecture Integration Script
# Integrates Byterover Cipher, Gibson CLI, and 40+ MCP/CLI tools

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EVENT_BUS_PORT=9092
CIPHER_MCP_PORT=3001
GIBSON_API_PORT=8000
WORKSPACE_DIR="/Users/daniellynch/Developer"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Check if service is running
check_service() {
    local port=$1
    local name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        success "$name is running on port $port"
        return 0
    else
        warning "$name is not running on port $port"
        return 1
    fi
}

# Start Event Bus (Kafka)
start_event_bus() {
    log "Starting Event Bus (Kafka)..."

    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running. Please start Docker first."
        return 1
    fi

    # Start Kafka using Docker
    docker run -d \
        --name event-bus \
        -p 9092:9092 \
        -p 2181:2181 \
        -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
        -e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092 \
        -e KAFKA_ZOOKEEPER_CONNECT=localhost:2181 \
        -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
        -e KAFKA_TRANSACTION_STATE_LOG_MIN_ISR=1 \
        -e KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=1 \
        confluentinc/cp-kafka:latest

    sleep 10
    check_service 9092 "Event Bus (Kafka)"
}

# Start Byterover Cipher MCP Server
start_cipher_mcp() {
    log "Starting Byterover Cipher MCP Server..."

    # Kill any existing cipher processes
    pkill -f "@byterover/cipher" 2>/dev/null || true

    # Start in background
    nohup npx @byterover/cipher --mode mcp --port 3001 > /tmp/cipher-mcp.log 2>&1 &

    sleep 5
    check_service 3001 "Byterover Cipher MCP"
}

# Start Gibson CLI API Server
start_gibson_api() {
    log "Starting Gibson CLI API Server..."

    # Check if Gibson is available
    if ! command -v gibson >/dev/null 2>&1; then
        warning "Gibson CLI not found, skipping API server start"
        return 1
    fi

    # Start Gibson in API mode (if supported)
    # Note: Gibson might need custom API wrapper
    warning "Gibson API server integration pending - requires custom wrapper"
}

# Initialize ByteRover Context Tree
init_byterover() {
    log "Initializing ByteRover Context Tree..."

    cd "$WORKSPACE_DIR"

    # Check if already initialized
    if [ -d ".brv" ]; then
        success "ByteRover already initialized"
        return 0
    fi

    # Initialize (requires authentication)
    if ! npx byterover-cli status | grep -q "Not logged in"; then
        warning "ByteRover not authenticated. Please run: npx byterover-cli"
        warning "Then: /login"
        return 1
    fi

    # Initialize project
    npx byterover-cli init

    success "ByteRover context tree initialized"
}

# Check MCP Servers
check_mcp_servers() {
    log "Checking MCP server status..."

    local mcp_servers=(
        "gibson:61659"
        "chroma-mcp:87807"
        "episodic-memory:98563"
        "context7-mcp:85386"
        "claude-mem:98440"
        "sequential-thinking:34333"
        "ollama-mcp:64106"
        "playwright-mcp:64716"
        "filesystem-mcp:64003"
        "memory-mcp:64234"
        "docker-mcp:33884"
        "kubernetes-mcp:33833"
        "deepwiki-mcp:63794"
        "linear-mcp:34035"
        "serena:84784"
        "instruct-mcp:64136"
        "everything-mcp:30668"
    )

    local running=0
    local total=${#mcp_servers[@]}

    for server in "${mcp_servers[@]}"; do
        IFS=':' read -r name pid <<< "$server"
        if ps -p "$pid" >/dev/null 2>&1; then
            ((running++))
            success "MCP Server $name (PID: $pid) is running"
        else
            warning "MCP Server $name (PID: $pid) is not running"
        fi
    done

    log "MCP Servers: $running/$total running"
}

# Check CLI Tools
check_cli_tools() {
    log "Checking CLI tool availability..."

    local cli_tools=(
        "brv:ByteRover CLI"
        "gibson:Gibson CLI"
        "pixi:Pixi environment manager"
        "pnpm:Package manager"
        "node:Node.js runtime"
        "npm:NPM package manager"
        "python3:Python runtime"
        "git:Version control"
        "docker:Container runtime"
        "kubectl:Kubernetes CLI"
        "helm:Kubernetes package manager"
        "terraform:Infrastructure as Code"
        "aws:AWS CLI"
        "az:Azure CLI"
        "jq:JSON processor"
        "yq:YAML processor"
        "curl:HTTP client"
        "rsync:File synchronization"
        "make:Build automation"
        "just:Command runner"
    )

    local available=0
    local total=${#cli_tools[@]}

    for tool in "${cli_tools[@]}"; do
        IFS=':' read -r cmd name <<< "$tool"
        if command -v "$cmd" >/dev/null 2>&1; then
            ((available++))
            success "CLI Tool $name ($cmd) is available"
        else
            warning "CLI Tool $name ($cmd) is not available"
        fi
    done

    log "CLI Tools: $available/$total available"
}

# Test Event Flow
test_event_flow() {
    log "Testing event-driven architecture flow..."

    # Test 1: Event Bus connectivity
    if check_service 9092 "Event Bus"; then
        success "Event Bus connectivity test passed"
    else
        error "Event Bus connectivity test failed"
        return 1
    fi

    # Test 2: Cipher MCP connectivity
    if check_service 3001 "Cipher MCP"; then
        success "Cipher MCP connectivity test passed"
    else
        error "Cipher MCP connectivity test failed"
        return 1
    fi

    # Test 3: Basic CLI tool integration
    if command -v brv >/dev/null 2>&1 && command -v gibson >/dev/null 2>&1; then
        success "Core CLI tools integration test passed"
    else
        error "Core CLI tools integration test failed"
        return 1
    fi

    # Test 4: MCP server integration
    check_mcp_servers

    success "Event-driven architecture flow test completed"
}

# Create Event Router Configuration
create_event_router_config() {
    log "Creating event router configuration..."

    cat > "$WORKSPACE_DIR/configs/event-router.json" << EOF
{
  "version": "1.0.0",
  "eventBus": {
    "type": "kafka",
    "brokers": ["localhost:9092"],
    "topics": {
      "code-generation": "code-gen-events",
      "context-management": "context-events",
      "infrastructure": "infra-events",
      "testing": "test-events",
      "monitoring": "monitor-events"
    }
  },
  "mcpServers": {
    "cipher": {
      "endpoint": "http://localhost:3001",
      "capabilities": ["memory", "context", "search"]
    },
    "gibson": {
      "endpoint": "http://localhost:8000",
      "capabilities": ["code-generation", "database"]
    }
  },
  "cliTools": {
    "byterover": {
      "command": "npx byterover-cli",
      "capabilities": ["context-curation", "knowledge-management"]
    },
    "gibson-cli": {
      "command": "gibson",
      "capabilities": ["code-generation", "entity-management"]
    }
  },
  "routes": [
    {
      "eventType": "code-request",
      "handlers": ["gibson", "cipher-memory"],
      "priority": "high"
    },
    {
      "eventType": "context-update",
      "handlers": ["byterover", "cipher-storage"],
      "priority": "medium"
    },
    {
      "eventType": "infrastructure-change",
      "handlers": ["terraform", "kubectl", "docker"],
      "priority": "high"
    }
  ],
  "monitoring": {
    "enabled": true,
    "metrics": ["throughput", "latency", "error-rate"],
    "alerts": ["service-down", "high-latency", "queue-depth"]
  }
}
EOF

    success "Event router configuration created"
}

# Main integration function
main() {
    log "Starting Event-Driven Architecture Integration..."

    # Create necessary directories
    mkdir -p "$WORKSPACE_DIR/configs"
    mkdir -p "$WORKSPACE_DIR/logs"

    # Start core services
    start_event_bus
    start_cipher_mcp
    start_gibson_api

    # Initialize tools
    init_byterover

    # Check integrations
    check_mcp_servers
    check_cli_tools

    # Test system
    test_event_flow

    # Create configuration
    create_event_router_config

    log "Event-Driven Architecture Integration completed!"
    success "System is ready for event-driven operations"
}

# Handle command line arguments
case "${1:-}" in
    "start")
        main
        ;;
    "check")
        check_mcp_servers
        check_cli_tools
        ;;
    "test")
        test_event_flow
        ;;
    "config")
        create_event_router_config
        ;;
    "stop")
        log "Stopping services..."
        docker stop event-bus 2>/dev/null || true
        pkill -f "@byterover/cipher" 2>/dev/null || true
        success "Services stopped"
        ;;
    *)
        echo "Usage: $0 {start|check|test|config|stop}"
        echo "  start  - Start all services and initialize integration"
        echo "  check  - Check MCP servers and CLI tools status"
        echo "  test   - Test event-driven architecture flow"
        echo "  config - Create event router configuration"
        echo "  stop   - Stop all services"
        exit 1
        ;;
esac