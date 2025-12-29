#!/bin/bash

# Manual Fixes for Critical Gaps
# Addresses Event Bus and Cipher MCP failures

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# Fix Event Bus with proper Kafka configuration
fix_event_bus_manual() {
    log "🔧 MANUALLY FIXING: Event Bus with KRaft mode"

    # Clean up failed container
    docker stop event-bus 2>/dev/null || true
    docker rm event-bus 2>/dev/null || true

    # Use KRaft configuration for modern Kafka
    docker run -d \
        --name event-bus \
        -p 9092:9092 \
        -e KAFKA_NODE_ID=1 \
        -e KAFKA_PROCESS_ROLES=broker,controller \
        -e KAFKA_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093 \
        -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
        -e KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER \
        -e KAFKA_CONTROLLER_QUORUM_VOTERS=1@localhost:9093 \
        -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
        -e KAFKA_TRANSACTION_STATE_LOG_MIN_ISR=1 \
        -e KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=1 \
        -e KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS=0 \
        -e KAFKA_NUM_PARTITIONS=3 \
        apache/kafka:latest

    sleep 20

    if docker ps | grep -q event-bus && nc -z localhost 9092 2>/dev/null; then
        success "Event Bus (Kafka KRaft) started successfully"

        # Create default topics
        docker exec event-bus /opt/kafka/bin/kafka-topics.sh \
            --create --topic code-gen-events --bootstrap-server localhost:9092 \
            --partitions 3 --replication-factor 1 2>/dev/null || true

        docker exec event-bus /opt/kafka/bin/kafka-topics.sh \
            --create --topic context-events --bootstrap-server localhost:9092 \
            --partitions 3 --replication-factor 1 2>/dev/null || true

        success "Default Kafka topics created"
        return 0
    else
        error "Event Bus failed to start"
        docker logs event-bus | tail -10
        return 1
    fi
}

# Alternative: Use Redis as simpler event bus
fix_event_bus_redis() {
    log "🔧 ALTERNATIVE: Using Redis as Event Bus"

    # Clean up Kafka if it exists
    docker stop event-bus 2>/dev/null || true
    docker rm event-bus 2>/dev/null || true

    # Start Redis
    docker run -d \
        --name event-bus \
        -p 6379:6379 \
        redis:alpine

    sleep 5

    if docker ps | grep -q event-bus && nc -z localhost 6379 2>/dev/null; then
        success "Event Bus (Redis) started successfully"
        echo "Note: Update event-router.json to use Redis instead of Kafka"
        return 0
    else
        error "Redis Event Bus failed to start"
        return 1
    fi
}

# Fix Cipher MCP with environment variables
fix_cipher_mcp_manual() {
    log "🔧 MANUALLY FIXING: Cipher MCP with environment configuration"

    # Create environment file for Cipher
    cat > .cipher.env << EOF
# Cipher MCP Environment Configuration
# Add your API keys below (remove the # and add your actual keys)

# Primary LLM Providers (choose at least one)
# OPENAI_API_KEY=sk-your-openai-key-here
# ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Alternative Providers
# OPENROUTER_API_KEY=sk-or-your-openrouter-key-here
OLLAMA_BASE_URL=http://localhost:11434
# GEMINI_API_KEY=your-gemini-key-here

# Optional: Local LLM
# LM_STUDIO_BASE_URL=http://localhost:1234

# Development mode (for testing without real API keys)
CIPHER_DEV_MODE=true
CIPHER_ALLOW_MOCK_RESPONSES=true
EOF

    # Set basic environment variables for development
    export OLLAMA_BASE_URL="http://localhost:11434"
    export CIPHER_DEV_MODE="true"
    export CIPHER_ALLOW_MOCK_RESPONSES="true"

    # Kill any existing cipher processes
    pkill -f "@byterover/cipher" 2>/dev/null || true
    sleep 2

    # Try starting with environment variables
    log "Starting Cipher MCP with development configuration..."
    nohup OLLAMA_BASE_URL="http://localhost:11434" \
          CIPHER_DEV_MODE="true" \
          CIPHER_ALLOW_MOCK_RESPONSES="true" \
          npx @byterover/cipher --mode mcp --port 3001 > logs/cipher-mcp.log 2>&1 &

    sleep 15

    if curl -s http://localhost:3001 >/dev/null 2>&1; then
        success "Cipher MCP started successfully in development mode"
        echo "Note: Add real API keys to .cipher.env for production use"
        return 0
    else
        error "Cipher MCP failed to start even in development mode"
        echo "Check logs/cipher-mcp.log for details"
        echo "You may need to install Ollama: brew install ollama && ollama serve"
        return 1
    fi
}

# Fix brv PATH issue
fix_brv_path_manual() {
    log "🔧 MANUALLY FIXING: brv PATH issue"

    # Find brv binary
    local brv_path=$(find /usr -name "*brv*" -type f -executable 2>/dev/null | head -1)

    if [ -z "$brv_path" ]; then
        # Try npm prefix
        local npm_prefix=$(npm config get prefix 2>/dev/null)
        if [ -f "$npm_prefix/bin/brv" ]; then
            brv_path="$npm_prefix/bin/brv"
        fi
    fi

    if [ -n "$brv_path" ]; then
        sudo ln -sf "$brv_path" /usr/local/bin/brv
        if command -v brv >/dev/null 2>&1; then
            success "brv added to PATH successfully"
            return 0
        fi
    fi

    # Fallback: create wrapper script
    cat > /usr/local/bin/brv << 'EOF'
#!/bin/bash
exec npx byterover-cli "$@"
EOF
    chmod +x /usr/local/bin/brv

    if command -v brv >/dev/null 2>&1; then
        success "brv wrapper script created"
        return 0
    else
        error "Failed to create brv wrapper"
        return 1
    fi
}

# Run validation after fixes
run_validation() {
    log "🔍 RUNNING VALIDATION AFTER MANUAL FIXES"

    echo ""
    echo "=== SYSTEM STATUS BEFORE FIXES ==="
    echo "Event Bus: ❌ Not running"
    echo "Cipher MCP: ❌ Not running"
    echo "brv PATH: ❌ Not available"
    echo ""

    echo "=== APPLYING MANUAL FIXES ==="

    local fixes_applied=0

    if fix_event_bus_manual; then
        ((fixes_applied++))
    fi

    if fix_cipher_mcp_manual; then
        ((fixes_applied++))
    fi

    if fix_brv_path_manual; then
        ((fixes_applied++))
    fi

    echo ""
    echo "=== VALIDATION RESULTS ==="
    echo "Manual fixes applied: $fixes_applied/3"

    if [ $fixes_applied -gt 0 ]; then
        echo ""
        echo "Running final system check..."
        ./scripts/event-driven-integration.sh check
    fi
}

# Main menu
main() {
    echo "🔧 Manual Fixes for Critical Gaps"
    echo "=================================="
    echo ""
    echo "This script addresses the 3 failed fixes from the automated script:"
    echo "1. Event Bus (Kafka KRaft configuration)"
    echo "2. Cipher MCP (Environment variables)"
    echo "3. brv PATH (Manual symlink/wrapper)"
    echo ""

    case "${1:-}" in
        "all")
            run_validation
            ;;
        "event-bus")
            fix_event_bus_manual
            ;;
        "event-bus-redis")
            fix_event_bus_redis
            ;;
        "cipher")
            fix_cipher_mcp_manual
            ;;
        "brv")
            fix_brv_path_manual
            ;;
        "validate")
            ./scripts/event-driven-integration.sh check
            ;;
        *)
            echo "Usage: $0 <command>"
            echo ""
            echo "Commands:"
            echo "  all              - Apply all manual fixes"
            echo "  event-bus        - Fix Event Bus with Kafka KRaft"
            echo "  event-bus-redis  - Fix Event Bus with Redis (alternative)"
            echo "  cipher           - Fix Cipher MCP server"
            echo "  brv              - Fix brv PATH issue"
            echo "  validate         - Run system validation"
            echo ""
            echo "Example: $0 all"
            ;;
    esac
}

main "$@"