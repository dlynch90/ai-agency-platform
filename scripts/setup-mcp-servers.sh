#!/bin/bash

# MCP Servers Setup Script
# Comprehensive MCP ecosystem for AI Agency development

set -e

echo "🤖 Setting up 20+ MCP servers for comprehensive analysis..."

# Create necessary directories
mkdir -p logs/mcp
mkdir -p data/mcp

# Install Node.js dependencies for MCP servers
install_dependencies() {
    echo "📦 Installing MCP server dependencies..."

    # Check if pnpm is available
    if command -v pnpm >/dev/null 2>&1; then
        PACKAGE_MANAGER="pnpm"
    elif command -v yarn >/dev/null 2>&1; then
        PACKAGE_MANAGER="yarn"
    else
        PACKAGE_MANAGER="npm"
    fi

    echo "Using package manager: $PACKAGE_MANAGER"

    # Install MCP servers
    $PACKAGE_MANAGER install \
        @modelcontextprotocol/server-sequential-thinking \
        @modelcontextprotocol/server-filesystem \
        @modelcontextprotocol/server-git \
        @modelcontextprotocol/server-github \
        @modelcontextprotocol/server-brave-search \
        @modelcontextprotocol/server-slack \
        @modelcontextprotocol/server-discord \
        @modelcontextprotocol/server-postgres \
        @modelcontextprotocol/server-redis \
        @modelcontextprotocol/server-neo4j \
        @modelcontextprotocol/server-http \
        @modelcontextprotocol/server-graphql \
        @modelcontextprotocol/server-kubernetes \
        @modelcontextprotocol/server-docker \
        @modelcontextprotocol/server-aws \
        @modelcontextprotocol/server-temporal \
        @modelcontextprotocol/server-n8n \
        @modelcontextprotocol/server-huggingface \
        @modelcontextprotocol/server-openai \
        @modelcontextprotocol/server-anthropic \
        @modelcontextprotocol/server-sentry \
        @modelcontextprotocol/server-prometheus \
        @modelcontextprotocol/server-elasticsearch \
        @modelcontextprotocol/server-kafka \
        @modelcontextprotocol/server-clickhouse \
        @modelcontextprotocol/server-memory \
        @modelcontextprotocol/server-rag-memory \
        @modelcontextprotocol/server-desktop-commander \
        @modelcontextprotocol/server-task-master \
        --save-dev
}

# Configure MCP servers
configure_servers() {
    echo "⚙️ Configuring MCP servers..."

    # Create environment file for MCP servers
    cat > .env.mcp << EOF
# MCP Server Environment Configuration

# API Keys (configure these with your actual keys)
GITHUB_TOKEN=\${GITHUB_TOKEN}
BRAVE_API_KEY=\${BRAVE_API_KEY}
SLACK_BOT_TOKEN=\${SLACK_BOT_TOKEN}
DISCORD_TOKEN=\${DISCORD_TOKEN}
OPENAI_API_KEY=\${OPENAI_API_KEY}
ANTHROPIC_API_KEY=\${ANTHROPIC_API_KEY}
HUGGINGFACE_API_KEY=\${HUGGINGFACE_API_KEY}

# Database Connections
DATABASE_URL=\${DATABASE_URL}
REDIS_URL=\${REDIS_URL}
NEO4J_URI=\${NEO4J_URI}
NEO4J_USERNAME=\${NEO4J_USERNAME}
NEO4J_PASSWORD=\${NEO4J_PASSWORD}
ELASTICSEARCH_URL=\${ELASTICSEARCH_URL}
CLICKHOUSE_URL=\${CLICKHOUSE_URL}

# Infrastructure
KUBECONFIG=\${KUBECONFIG}
DOCKER_HOST=\${DOCKER_HOST}
AWS_ACCESS_KEY_ID=\${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=\${AWS_SECRET_ACCESS_KEY}
AWS_REGION=\${AWS_REGION}

# Monitoring
SENTRY_DSN=\${SENTRY_DSN}
PROMETHEUS_URL=\${PROMETHEUS_URL}

# Workflow Engines
TEMPORAL_ADDRESS=\${TEMPORAL_ADDRESS}
N8N_URL=\${N8N_URL}
KAFKA_BROKERS=\${KAFKA_BROKERS}

# Development
LOG_LEVEL=info
MCP_TIMEOUT=30000
MCP_MAX_CONNECTIONS=50
EOF

    echo "✅ MCP server configuration created"
}

# Start MCP servers
start_servers() {
    echo "🚀 Starting MCP servers..."

    # Create startup script
    cat > scripts/start-mcp-servers.sh << 'EOF'
#!/bin/bash

# MCP Servers Startup Script

echo "🤖 Starting MCP ecosystem..."

# Load environment
if [ -f ".env.mcp" ]; then
    export $(cat .env.mcp | xargs)
fi

# Function to start a server
start_server() {
    local name=$1
    local command=$2
    shift 2

    echo "Starting $name..."
    nohup $command "$@" > "logs/mcp/$name.log" 2>&1 &
    echo $! > "data/mcp/$name.pid"
}

# Create PID directory
mkdir -p data/mcp

# Start core servers
start_server "sequential-thinking" npx @modelcontextprotocol/server-sequential-thinking
start_server "file-manager" npx @modelcontextprotocol/server-filesystem ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}
start_server "git" npx @modelcontextprotocol/server-git --repository ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}

# Start database servers (if configured)
if [ ! -z "$DATABASE_URL" ]; then
    start_server "postgres" npx @modelcontextprotocol/server-postgres
fi

if [ ! -z "$REDIS_URL" ]; then
    start_server "redis" npx @modelcontextprotocol/server-redis
fi

if [ ! -z "$NEO4J_URI" ]; then
    start_server "neo4j" npx @modelcontextprotocol/server-neo4j
fi

# Start AI/ML servers (if configured)
if [ ! -z "$OPENAI_API_KEY" ]; then
    start_server "openai" npx @modelcontextprotocol/server-openai
fi

if [ ! -z "$HUGGINGFACE_API_KEY" ]; then
    start_server "huggingface" npx @modelcontextprotocol/server-huggingface
fi

# Start cloud services (if configured)
if [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
    start_server "aws" npx @modelcontextprotocol/server-aws
fi

if [ ! -z "$KUBECONFIG" ]; then
    start_server "kubernetes" npx @modelcontextprotocol/server-kubernetes
fi

# Start monitoring servers
start_server "memory" npx @modelcontextprotocol/server-memory
start_server "rag-memory" npx @modelcontextprotocol/server-rag-memory
start_server "desktop-commander" npx @modelcontextprotocol/server-desktop-commander
start_server "task-master" npx @modelcontextprotocol/server-task-master

echo "✅ MCP servers started!"
echo "📋 Check logs/mcp/ for individual server logs"
EOF

    chmod +x scripts/start-mcp-servers.sh

    echo "✅ MCP server startup script created"
}

# Create health check script
create_health_check() {
    echo "🏥 Creating MCP health check script..."

    cat > scripts/health-check-mcp.sh << 'EOF'
#!/bin/bash

# MCP Servers Health Check Script

echo "🏥 Checking MCP server health..."

SERVERS=(
    "sequential-thinking:3001"
    "file-manager:3002"
    "git:3003"
    "postgres:3004"
    "redis:3005"
    "neo4j:3006"
    "openai:3007"
    "huggingface:3008"
    "aws:3009"
    "kubernetes:3010"
    "memory:3011"
    "rag-memory:3012"
    "desktop-commander:3013"
    "task-master:3014"
)

healthy=0
total=${#SERVERS[@]}

for server in "${SERVERS[@]}"; do
    name=$(echo $server | cut -d: -f1)
    port=$(echo $server | cut -d: -f2)

    if curl -s --max-time 5 "http://localhost:$port/health" >/dev/null 2>&1; then
        echo "✅ $name is healthy"
        ((healthy++))
    else
        echo "❌ $name is not responding"
    fi
done

echo "📊 Health Status: $healthy/$total servers healthy"

if [ $healthy -eq $total ]; then
    echo "🎉 All MCP servers are healthy!"
    exit 0
else
    echo "⚠️ Some MCP servers are unhealthy"
    exit 1
fi
EOF

    chmod +x scripts/health-check-mcp.sh

    echo "✅ MCP health check script created"
}

# Create monitoring script
create_monitoring() {
    echo "📊 Creating MCP monitoring script..."

    cat > scripts/monitor-mcp.sh << 'EOF'
#!/bin/bash

# MCP Servers Monitoring Script

echo "📊 MCP Server Monitoring Report"
echo "================================="

# Check running processes
echo "🔍 Running MCP Processes:"
ps aux | grep "modelcontextprotocol" | grep -v grep || echo "No MCP processes found"

echo ""

# Check log files
echo "📝 Recent Log Activity:"
for log in logs/mcp/*.log; do
    if [ -f "$log" ]; then
        echo "📄 $(basename "$log"):"
        tail -5 "$log" 2>/dev/null | head -3
        echo ""
    fi
done

# Check PID files
echo "🔢 Active PIDs:"
for pid_file in data/mcp/*.pid; do
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            echo "✅ $(basename "$pid_file" .pid) (PID: $pid)"
        else
            echo "❌ $(basename "$pid_file" .pid) (PID: $pid - dead)"
        fi
    fi
done

# Resource usage
echo ""
echo "💾 Resource Usage:"
echo "Memory usage by MCP processes:"
ps aux | grep "modelcontextprotocol" | grep -v grep | awk '{sum += $6} END {print sum " KB"}' || echo "Unable to calculate"

echo ""
echo "🔄 Network connections:"
netstat -tlnp 2>/dev/null | grep :300 | head -10 || echo "Unable to check network connections"
EOF

    chmod +x scripts/monitor-mcp.sh

    echo "✅ MCP monitoring script created"
}

# Main setup function
main() {
    echo "🎯 Starting MCP server setup..."

    # Install dependencies
    install_dependencies

    # Configure servers
    configure_servers

    # Create startup scripts
    start_servers

    # Create health check
    create_health_check

    # Create monitoring
    create_monitoring

    echo "✅ MCP server setup completed!"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Configure API keys in .env.mcp"
    echo "  2. Run './scripts/start-mcp-servers.sh' to start servers"
    echo "  3. Run './scripts/health-check-mcp.sh' to verify health"
    echo "  4. Run './scripts/monitor-mcp.sh' to monitor servers"
}

# Run main function
main "$@"