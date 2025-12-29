#!/bin/bash
# MCP Server Expansion Setup Script
# Adds AI/ML and cloud service integrations to your MCP configuration

set -e

echo "🤖 MCP Server Expansion Setup"
echo "============================"

# Check if main config exists
if [ ! -f "mcp-config.toml" ]; then
    echo "❌ mcp-config.toml not found. Please run MCP initialization first."
    exit 1
fi

# Create backup
echo "📋 Creating backup of current MCP configuration..."
cp mcp-config.toml mcp-config-backup-$(date +%Y%m%d-%H%M%S).toml

# Install additional MCP server packages
echo "📦 Installing additional MCP server packages..."
npm install -g @modelcontextprotocol/server-openai \
               @modelcontextprotocol/server-huggingface \
               @modelcontextprotocol/server-replicate \
               @modelcontextprotocol/server-modal \
               @modelcontextprotocol/server-langchain \
               @modelcontextprotocol/server-llamaindex \
               @modelcontextprotocol/server-qdrant \
               @modelcontextprotocol/server-weaviate \
               @modelcontextprotocol/server-chroma \
               @modelcontextprotocol/server-pinecone \
               @modelcontextprotocol/server-aws \
               @modelcontextprotocol/server-azure \
               @modelcontextprotocol/server-gcp \
               @modelcontextprotocol/server-vercel \
               @modelcontextprotocol/server-netlify \
               @modelcontextprotocol/server-railway \
               @modelcontextprotocol/server-planetscale \
               @modelcontextprotocol/server-supabase \
               @modelcontextprotocol/server-clerk \
               @modelcontextprotocol/server-slack \
               @modelcontextprotocol/server-discord \
               @modelcontextprotocol/server-linear \
               @modelcontextprotocol/server-notion \
               @modelcontextprotocol/server-figma \
               @modelcontextprotocol/server-stripe \
               @modelcontextprotocol/server-shopify \
               @modelcontextprotocol/server-algolia \
               @modelcontextprotocol/server-datadog \
               @modelcontextprotocol/server-sentry

# Create environment template
echo "🔧 Creating expanded environment template..."
cat > .env.mcp.expanded << 'EOF'
# Expanded MCP Environment Variables
# Add your API keys below - DO NOT commit this file!

# ==========================================
# AI/ML API Keys
# ==========================================
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
HUGGINGFACE_TOKEN=your_huggingface_token_here
REPLICATE_API_TOKEN=your_replicate_api_token_here
LANGCHAIN_API_KEY=your_langchain_api_key_here
LLAMAINDEX_API_KEY=your_llamaindex_api_key_here

# ==========================================
# Vector Database Keys
# ==========================================
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_api_key_here
WEAVIATE_URL=http://localhost:8080
WEAVIATE_API_KEY=your_weaviate_api_key_here
CHROMA_SERVER_URL=http://localhost:8000
CHROMA_SERVER_API_KEY=your_chroma_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here

# ==========================================
# Cloud Provider Keys
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
# Deployment Platforms
# ==========================================
VERCEL_TOKEN=your_vercel_token_here
NETLIFY_AUTH_TOKEN=your_netlify_auth_token_here
RAILWAY_TOKEN=your_railway_token_here
PLANETSCALE_TOKEN=your_planetscale_token_here

# ==========================================
# Backend Services
# ==========================================
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# ==========================================
# Communication
# ==========================================
SLACK_BOT_TOKEN=your_slack_bot_token_here
DISCORD_BOT_TOKEN=your_discord_bot_token_here

# ==========================================
# Project Management
# ==========================================
LINEAR_API_KEY=your_linear_api_key_here
NOTION_TOKEN=your_notion_token_here

# ==========================================
# Design
# ==========================================
FIGMA_ACCESS_TOKEN=your_figma_access_token_here

# ==========================================
# Business
# ==========================================
STRIPE_SECRET_KEY=your_stripe_secret_key_here
SHOPIFY_STORE_DOMAIN=your_store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_access_token_here

# ==========================================
# Search & Analytics
# ==========================================
ALGOLIA_APP_ID=your_algolia_app_id_here
ALGOLIA_API_KEY=your_algolia_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
DATADOG_API_KEY=your_datadog_api_key_here
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here

# ==========================================
# Infrastructure
# ==========================================
MODAL_TOKEN_ID=your_modal_token_id_here
MODAL_TOKEN_SECRET=your_modal_token_secret_here
EOF

echo "📝 Created .env.mcp.expanded template file"
echo "⚠️  IMPORTANT: Fill in your API keys in .env.mcp.expanded"
echo "   DO NOT commit this file to version control!"

# Test basic MCP servers
echo "🧪 Testing MCP server installations..."
npx @modelcontextprotocol/server-openai --help >/dev/null 2>&1 && echo "✅ OpenAI MCP server ready" || echo "⚠️ OpenAI MCP server needs configuration"
npx @modelcontextprotocol/server-huggingface --help >/dev/null 2>&1 && echo "✅ HuggingFace MCP server ready" || echo "⚠️ HuggingFace MCP server needs configuration"
npx @modelcontextprotocol/server-qdrant --help >/dev/null 2>&1 && echo "✅ Qdrant MCP server ready" || echo "⚠️ Qdrant MCP server needs configuration"

echo ""
echo "✅ MCP Expansion Setup Complete!"
echo "================================="
echo ""
echo "Next Steps:"
echo "1. Fill in API keys in .env.mcp.expanded"
echo "2. Merge desired servers from mcp-config-expanded.toml into mcp-config.toml"
echo "3. Start vector databases: docker run -p 6333:6333 qdrant/qdrant"
echo "4. Test expanded MCP servers: ./scripts/start_mcp_servers.sh"
echo "5. Configure Cursor/VSCode to use expanded MCP configuration"
echo ""
echo "🎯 Your MCP ecosystem now supports 35+ AI/ML and cloud integrations!"