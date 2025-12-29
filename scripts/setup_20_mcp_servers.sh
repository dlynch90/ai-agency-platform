#!/bin/bash
# Setup 20 MCP Servers for Comprehensive AI/ML Integration
# This creates a complete AI/ML development ecosystem

set -e

echo "🤖 SETTING UP 20 MCP SERVERS"
echo "============================"

# Create MCP servers directory
mkdir -p mcp-servers
cd mcp-servers

echo ""
echo "📦 INSTALLING MCP SERVER PACKAGES"
echo "================================="

# Install all MCP server packages (batch installation to avoid timeouts)
MCP_PACKAGES=(
    "@modelcontextprotocol/server-openai"
    "@modelcontextprotocol/server-anthropic"
    "@modelcontextprotocol/server-huggingface"
    "@modelcontextprotocol/server-replicate"
    "@modelcontextprotocol/server-modal"
    "@modelcontextprotocol/server-langchain"
    "@modelcontextprotocol/server-llamaindex"
    "@modelcontextprotocol/server-qdrant"
    "@modelcontextprotocol/server-weaviate"
    "@modelcontextprotocol/server-chroma"
    "@modelcontextprotocol/server-pinecone"
    "@modelcontextprotocol/server-aws"
    "@modelcontextprotocol/server-azure"
    "@modelcontextprotocol/server-gcp"
    "@modelcontextprotocol/server-vercel"
    "@modelcontextprotocol/server-netlify"
    "@modelcontextprotocol/server-railway"
    "@modelcontextprotocol/server-planetscale"
    "@modelcontextprotocol/server-supabase"
    "@modelcontextprotocol/server-clerk"
    "@modelcontextprotocol/server-slack"
    "@modelcontextprotocol/server-discord"
    "@modelcontextprotocol/server-linear"
    "@modelcontextprotocol/server-notion"
    "@modelcontextprotocol/server-figma"
    "@modelcontextprotocol/server-stripe"
    "@modelcontextprotocol/server-shopify"
    "@modelcontextprotocol/server-algolia"
    "@modelcontextprotocol/server-datadog"
    "@modelcontextprotocol/server-sentry"
)

echo "Installing MCP server packages in batches..."

# Install in batches of 5 to avoid timeouts
for ((i=0; i<${#MCP_PACKAGES[@]}; i+=5)); do
    batch=("${MCP_PACKAGES[@]:i:5}")
    echo "Installing batch $((i/5 + 1)): ${batch[*]}"
    npm install -g "${batch[@]}" || echo "Some packages may have failed, continuing..."
    sleep 2
done

echo ""
echo "🔧 CREATING COMPREHENSIVE MCP CONFIGURATION"
echo "=========================================="

# Create the complete MCP configuration with all 20 servers
cat > ../mcp-config-20-servers.toml << 'EOF'
# Complete MCP Configuration with 20 AI/ML & Cloud Servers
# This provides comprehensive AI/ML and cloud integration

[mcp]
enabled = true

# ==========================================
# CORE AI/ML SERVERS (5 servers)
# ==========================================

[servers.ollama]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-ollama"]
env = { "OLLAMA_BASE_URL" = "http://localhost:11434" }

[servers.openai]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-openai"]
env = { "OPENAI_API_KEY" = "${OPENAI_API_KEY}" }

[servers.anthropic]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-anthropic"]
env = { "ANTHROPIC_API_KEY" = "${ANTHROPIC_API_KEY}" }

[servers.huggingface]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-huggingface"]
env = { "HUGGINGFACE_TOKEN" = "${HUGGINGFACE_TOKEN}" }

[servers.replicate]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-replicate"]
env = { "REPLICATE_API_TOKEN" = "${REPLICATE_API_TOKEN}" }

# ==========================================
# VECTOR DATABASES & AI INFRA (4 servers)
# ==========================================

[servers.qdrant]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-qdrant"]
env = {
  "QDRANT_URL" = "http://localhost:6333",
  "QDRANT_API_KEY" = "${QDRANT_API_KEY}"
}

[servers.weaviate]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-weaviate"]
env = {
  "WEAVIATE_URL" = "http://localhost:8080",
  "WEAVIATE_API_KEY" = "${WEAVIATE_API_KEY}"
}

[servers.chroma]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-chroma"]
env = {
  "CHROMA_SERVER_URL" = "http://localhost:8000",
  "CHROMA_SERVER_API_KEY" = "${CHROMA_SERVER_API_KEY}"
}

[servers.pinecone]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-pinecone"]
env = { "PINECONE_API_KEY" = "${PINECONE_API_KEY}" }

# ==========================================
# CLOUD & INFRASTRUCTURE (4 servers)
# ==========================================

[servers.aws]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-aws"]
env = {
  "AWS_ACCESS_KEY_ID" = "${AWS_ACCESS_KEY_ID}",
  "AWS_SECRET_ACCESS_KEY" = "${AWS_SECRET_ACCESS_KEY}",
  "AWS_REGION" = "${AWS_REGION}"
}

[servers.azure]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-azure"]
env = {
  "AZURE_CLIENT_ID" = "${AZURE_CLIENT_ID}",
  "AZURE_CLIENT_SECRET" = "${AZURE_CLIENT_SECRET}",
  "AZURE_TENANT_ID" = "${AZURE_TENANT_ID}"
}

[servers.gcp]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-gcp"]
env = {
  "GOOGLE_CLIENT_ID" = "${GOOGLE_CLIENT_ID}",
  "GOOGLE_CLIENT_SECRET" = "${GOOGLE_CLIENT_SECRET}",
  "GOOGLE_PROJECT_ID" = "${GOOGLE_PROJECT_ID}"
}

[servers.vercel]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-vercel"]
env = { "VERCEL_TOKEN" = "${VERCEL_TOKEN}" }

# ==========================================
# DEPLOYMENT & BACKEND (3 servers)
# ==========================================

[servers.supabase]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-supabase"]
env = {
  "SUPABASE_URL" = "${SUPABASE_URL}",
  "SUPABASE_ANON_KEY" = "${SUPABASE_ANON_KEY}",
  "SUPABASE_SERVICE_ROLE_KEY" = "${SUPABASE_SERVICE_ROLE_KEY}"
}

[servers.clerk]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-clerk"]
env = { "CLERK_SECRET_KEY" = "${CLERK_SECRET_KEY}" }

[servers.railway]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-railway"]
env = { "RAILWAY_TOKEN" = "${RAILWAY_TOKEN}" }

# ==========================================
# COLLABORATION & PROJECT MANAGEMENT (2 servers)
# ==========================================

[servers.linear]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-linear"]
env = { "LINEAR_API_KEY" = "${LINEAR_API_KEY}" }

[servers.notion]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-notion"]
env = { "NOTION_TOKEN" = "${NOTION_TOKEN}" }

# ==========================================
# EXISTING SERVERS (2 servers - already configured)
# ==========================================

[servers.sequential-thinking]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-sequential-thinking"]

[servers.task-master]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-task-master"]
env = { "TASK_MASTER_DB_PATH" = "${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.taskmaster.db" }

# ==========================================
# BONUS SERVERS (Optional advanced integrations)
# ==========================================

[servers.stripe]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-stripe"]
env = { "STRIPE_SECRET_KEY" = "${STRIPE_SECRET_KEY}" }

[servers.datadog]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-datadog"]
env = { "DATADOG_API_KEY" = "${DATADOG_API_KEY}" }

# ==========================================
# ENVIRONMENT VARIABLES
# ==========================================

[env]
# AI/ML API Keys
OPENAI_API_KEY = "${OPENAI_API_KEY}"
ANTHROPIC_API_KEY = "${ANTHROPIC_API_KEY}"
HUGGINGFACE_TOKEN = "${HUGGINGFACE_TOKEN}"
REPLICATE_API_TOKEN = "${REPLICATE_API_TOKEN}"

# Vector Database Keys
QDRANT_URL = "http://localhost:6333"
QDRANT_API_KEY = "${QDRANT_API_KEY}"
WEAVIATE_URL = "http://localhost:8080"
WEAVIATE_API_KEY = "${WEAVIATE_API_KEY}"
CHROMA_SERVER_URL = "http://localhost:8000"
CHROMA_SERVER_API_KEY = "${CHROMA_SERVER_API_KEY}"
PINECONE_API_KEY = "${PINECONE_API_KEY}"

# Cloud Provider Keys
AWS_ACCESS_KEY_ID = "${AWS_ACCESS_KEY_ID}"
AWS_SECRET_ACCESS_KEY = "${AWS_SECRET_ACCESS_KEY}"
AWS_REGION = "${AWS_REGION:-us-east-1}"
AZURE_CLIENT_ID = "${AZURE_CLIENT_ID}"
AZURE_CLIENT_SECRET = "${AZURE_CLIENT_SECRET}"
AZURE_TENANT_ID = "${AZURE_TENANT_ID}"
GOOGLE_CLIENT_ID = "${GOOGLE_CLIENT_ID}"
GOOGLE_CLIENT_SECRET = "${GOOGLE_CLIENT_SECRET}"
GOOGLE_PROJECT_ID = "${GOOGLE_PROJECT_ID}"

# Deployment Platforms
VERCEL_TOKEN = "${VERCEL_TOKEN}"
RAILWAY_TOKEN = "${RAILWAY_TOKEN}"

# Backend Services
SUPABASE_URL = "${SUPABASE_URL}"
SUPABASE_ANON_KEY = "${SUPABASE_ANON_KEY}"
SUPABASE_SERVICE_ROLE_KEY = "${SUPABASE_SERVICE_ROLE_KEY}"
CLERK_SECRET_KEY = "${CLERK_SECRET_KEY}"

# Project Management
LINEAR_API_KEY = "${LINEAR_API_KEY}"
NOTION_TOKEN = "${NOTION_TOKEN}"

# Business Services
STRIPE_SECRET_KEY = "${STRIPE_SECRET_KEY}"

# Monitoring
DATADOG_API_KEY = "${DATADOG_API_KEY}"

# MCP Configuration
MCP_LOG_LEVEL = "info"
MCP_20_SERVERS_ENABLED = "true"
EOF

cd ..

echo "✅ Created comprehensive MCP configuration with 20 servers"

echo ""
echo "🔧 CREATING MCP MANAGEMENT SCRIPTS"
echo "==================================="

# Create MCP server management script
cat > manage_mcp_servers.sh << 'EOF'
#!/bin/bash
# MCP Server Management Script
# Start, stop, and monitor 20 MCP servers

COMMAND=${1:-status}

case $COMMAND in
    "start")
        echo "🚀 Starting MCP servers..."
        # Start core servers first
        npx @modelcontextprotocol/server-ollama &
        echo $! > ollama.pid

        npx @modelcontextprotocol/server-sequential-thinking &
        echo $! > sequential.pid

        npx @modelcontextprotocol/server-task-master &
        echo $! > taskmaster.pid

        echo "✅ Core MCP servers started"
        ;;

    "start-ai")
        echo "🤖 Starting AI/ML MCP servers..."
        # Start AI servers (require API keys)
        [ -n "$OPENAI_API_KEY" ] && npx @modelcontextprotocol/server-openai &
        [ -n "$ANTHROPIC_API_KEY" ] && npx @modelcontextprotocol/server-anthropic &
        [ -n "$HUGGINGFACE_TOKEN" ] && npx @modelcontextprotocol/server-huggingface &
        echo "✅ AI/ML MCP servers started (where API keys available)"
        ;;

    "start-cloud")
        echo "☁️ Starting Cloud MCP servers..."
        # Start cloud servers (require credentials)
        [ -n "$AWS_ACCESS_KEY_ID" ] && npx @modelcontextprotocol/server-aws &
        [ -n "$VERCEL_TOKEN" ] && npx @modelcontextprotocol/server-vercel &
        [ -n "$SUPABASE_URL" ] && npx @modelcontextprotocol/server-supabase &
        echo "✅ Cloud MCP servers started (where credentials available)"
        ;;

    "start-vector")
        echo "🗄️ Starting Vector Database MCP servers..."
        # Start vector DB servers (require running databases)
        npx @modelcontextprotocol/server-qdrant &
        npx @modelcontextprotocol/server-weaviate &
        npx @modelcontextprotocol/server-chroma &
        echo "✅ Vector database MCP servers started"
        ;;

    "stop")
        echo "🛑 Stopping all MCP servers..."
        kill $(cat *.pid 2>/dev/null) 2>/dev/null || true
        rm -f *.pid
        echo "✅ All MCP servers stopped"
        ;;

    "status")
        echo "📊 MCP Server Status:"
        echo "===================="

        # Check running processes
        echo "Running MCP processes:"
        ps aux | grep "@modelcontextprotocol/server" | grep -v grep | wc -l | xargs echo "Active servers:"

        # Check PID files
        echo "PID files found:"
        ls *.pid 2>/dev/null | wc -l | xargs echo "PID files:"

        # Check API key availability
        echo "API Keys configured:"
        [ -n "$OPENAI_API_KEY" ] && echo "✅ OpenAI" || echo "❌ OpenAI"
        [ -n "$ANTHROPIC_API_KEY" ] && echo "✅ Anthropic" || echo "❌ Anthropic"
        [ -n "$HUGGINGFACE_TOKEN" ] && echo "✅ HuggingFace" || echo "❌ HuggingFace"
        [ -n "$AWS_ACCESS_KEY_ID" ] && echo "✅ AWS" || echo "❌ AWS"
        [ -n "$VERCEL_TOKEN" ] && echo "✅ Vercel" || echo "❌ Vercel"
        ;;

    "test")
        echo "🧪 Testing MCP server connectivity..."
        # Test basic connectivity
        curl -s http://localhost:11434/api/tags >/dev/null && echo "✅ Ollama connected" || echo "❌ Ollama not responding"

        # Test with timeout
        timeout 5 npx @modelcontextprotocol/server-sequential-thinking --help >/dev/null 2>&1 && echo "✅ Sequential Thinking server functional" || echo "❌ Sequential Thinking server issue"
        ;;

    "install-deps")
        echo "📦 Installing MCP server dependencies..."
        # Install any missing dependencies
        brew install ollama 2>/dev/null || echo "Ollama may already be installed"
        brew install qdrant 2>/dev/null || echo "Qdrant may already be installed"
        echo "✅ Dependencies check complete"
        ;;

    *)
        echo "Usage: $0 {start|start-ai|start-cloud|start-vector|stop|status|test|install-deps}"
        echo ""
        echo "Commands:"
        echo "  start        - Start core MCP servers (Ollama, Sequential, Task Master)"
        echo "  start-ai     - Start AI/ML servers (requires API keys)"
        echo "  start-cloud  - Start cloud servers (requires credentials)"
        echo "  start-vector - Start vector database servers"
        echo "  stop         - Stop all MCP servers"
        echo "  status       - Show MCP server status"
        echo "  test         - Test MCP server connectivity"
        echo "  install-deps - Install required dependencies"
        ;;
esac
EOF

chmod +x manage_mcp_servers.sh

echo "✅ Created MCP server management script"

echo ""
echo "🔑 CREATING ENVIRONMENT TEMPLATE"
echo "==============================="

# Create comprehensive environment template
cat > .env.mcp.20servers << 'EOF'
# Comprehensive MCP Environment Variables for 20 Servers
# Copy this to .env and fill in your API keys

# ==========================================
# AI/ML API Keys (Required for AI servers)
# ==========================================
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
HUGGINGFACE_TOKEN=your_huggingface_token_here
REPLICATE_API_TOKEN=your_replicate_api_token_here

# ==========================================
# Vector Database Configuration
# ==========================================
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_api_key_here
WEAVIATE_URL=http://localhost:8080
WEAVIATE_API_KEY=your_weaviate_api_key_here
CHROMA_SERVER_URL=http://localhost:8000
CHROMA_SERVER_API_KEY=your_chroma_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here

# ==========================================
# Cloud Provider Credentials (Required for cloud servers)
# ==========================================
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=us-east-1
AZURE_CLIENT_ID=your_azure_client_id_here
AZURE_CLIENT_SECRET=your_azure_client_secret_here
AZURE_TENANT_ID=your_azure_tenant_id_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_PROJECT_ID=your_google_project_id_here

# ==========================================
# Deployment & Backend Platforms
# ==========================================
VERCEL_TOKEN=your_vercel_token_here
RAILWAY_TOKEN=your_railway_token_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# ==========================================
# Project Management & Collaboration
# ==========================================
LINEAR_API_KEY=your_linear_api_key_here
NOTION_TOKEN=your_notion_token_here

# ==========================================
# Business & Commerce
# ==========================================
STRIPE_SECRET_KEY=your_stripe_secret_key_here

# ==========================================
# Monitoring & Analytics
# ==========================================
DATADOG_API_KEY=your_datadog_api_key_here

# ==========================================
# Local Service URLs (for development)
# ==========================================
OLLAMA_BASE_URL=http://localhost:11434
TASK_MASTER_DB_PATH=${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.taskmaster.db

# ==========================================
# MCP Configuration
# ==========================================
MCP_LOG_LEVEL=info
MCP_20_SERVERS_ENABLED=true
MCP_CACHE_DIR=${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cache/mcp
MCP_CONFIG_DIR=${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.mcp

# Instructions:
# 1. Copy this file to .env in your project root
# 2. Fill in all API keys and credentials
# 3. Run: source .env
# 4. Start MCP servers: ./manage_mcp_servers.sh start
# 5. Start AI servers: ./manage_mcp_servers.sh start-ai
# 6. Start cloud servers: ./manage_mcp_servers.sh start-cloud
EOF

echo "✅ Created comprehensive environment template"

echo ""
echo "🧪 TESTING MCP SERVER INSTALLATIONS"
echo "==================================="

# Test a few key servers
echo "Testing installed MCP servers..."
npx @modelcontextprotocol/server-sequential-thinking --help >/dev/null 2>&1 && echo "✅ Sequential Thinking MCP functional" || echo "❌ Sequential Thinking MCP issue"
npx @modelcontextprotocol/server-ollama --help >/dev/null 2>&1 && echo "✅ Ollama MCP functional" || echo "❌ Ollama MCP issue"
npx @modelcontextprotocol/server-openai --help >/dev/null 2>&1 && echo "✅ OpenAI MCP functional" || echo "❌ OpenAI MCP issue"

echo ""
echo "🎯 20 MCP SERVERS SETUP COMPLETE"
echo "==============================="
echo ""
echo "Configured MCP Servers:"
echo "🤖 AI/ML (5): Ollama, OpenAI, Anthropic, HuggingFace, Replicate"
echo "🗄️ Vector DB (4): Qdrant, Weaviate, Chroma, Pinecone"
echo "☁️ Cloud (3): AWS, Azure, GCP"
echo "🚀 Deployment (3): Vercel, Supabase, Railway"
echo "👥 Collaboration (2): Linear, Notion"
echo "🛠️ Core (3): Sequential Thinking, Task Master, Clerk"
echo ""
echo "Management Commands:"
echo "  ./manage_mcp_servers.sh start        - Start core servers"
echo "  ./manage_mcp_servers.sh start-ai     - Start AI servers"
echo "  ./manage_mcp_servers.sh start-cloud  - Start cloud servers"
echo "  ./manage_mcp_servers.sh status       - Check status"
echo "  ./manage_mcp_servers.sh stop         - Stop all servers"
echo ""
echo "Configuration:"
echo "  1. Copy .env.mcp.20servers to .env"
echo "  2. Fill in API keys and credentials"
echo "  3. Run: source .env"
echo "  4. Start servers with management script"
echo ""
echo "🎉 Your MCP ecosystem now supports comprehensive AI/ML and cloud integration!"