#!/bin/bash
# Environment Template with 1Password Secret Injection
# Source: configs/env-template.sh
# Usage: eval "$(op inject -i configs/env-template.sh)"

# === DIRECTORY PATHS (No hardcoding!) ===
export DEVELOPER_DIR="${DEVELOPER_DIR:-$HOME/Developer}"
export USER_HOME="${USER_HOME:-$HOME}"
export CONFIG_DIR="${CONFIG_DIR:-$HOME/.config}"
export DATA_DIR="${DATA_DIR:-$DEVELOPER_DIR/data}"
export LOG_DIR="${LOG_DIR:-$DEVELOPER_DIR/logs}"

# === MCP SERVER CONFIGURATION ===
export MCP_CONFIG_DIR="${MCP_CONFIG_DIR:-$HOME/.cursor/mcp}"
export MCP_FILESYSTEM_ROOT="${DEVELOPER_DIR}"

# === DATABASE CONNECTIONS ===
export POSTGRES_CONNECTION_STRING="op://MCP Servers/PostgreSQL MCP Server/connection_string"
export NEO4J_CONNECTION_URL="op://MCP Servers/Neo4j MCP Server/url"
export NEO4J_PASSWORD="op://Development/NEO4J_PASSWORD/password"
export REDIS_URL="op://MCP Servers/Redis MCP Server/url"
export MONGODB_URI="op://MCP Servers/MongoDB MCP Server/uri"
export QDRANT_API_KEY="op://MCP Servers/Qdrant MCP Server/api_key"
export QDRANT_CLUSTER_URL="op://MCP Servers/Qdrant MCP Server/url"

# === AI/ML API KEYS ===
export OPENAI_API_KEY="op://MCP Servers/OpenAI MCP Server/api_key"
export ANTHROPIC_API_KEY="op://MCP Servers/Anthropic MCP Server/api_key"
export GOOGLE_API_KEY="op://Development/GOOGLE_API_KEY/password"
export HUGGINGFACE_API_KEY="op://Development/HUGGINGFACE_API_KEY/password"

# === SEARCH & WEB APIs ===
export BRAVE_API_KEY="op://MCP Servers/Brave Search MCP Server/api_key"
export TAVILY_API_KEY="op://MCP Servers/Tavily MCP Server/api_key"
export EXA_API_KEY="op://MCP Servers/Exa MCP Server/api_key"
export FIRECRAWL_API_KEY="op://MCP Servers/Firecrawl MCP Server/api_key"

# === VERSION CONTROL ===
export GITHUB_TOKEN="op://Development/GITHUB_TOKEN/password"
export GITLAB_TOKEN="op://MCP Servers/GitLab MCP Server/token"

# === CLOUD PROVIDERS ===
export AWS_ACCESS_KEY_ID="op://MCP Servers/AWS MCP Server/access_key"
export AWS_SECRET_ACCESS_KEY="op://MCP Servers/AWS MCP Server/secret_key"
export AWS_REGION="us-east-1"

# === COMMUNICATION ===
export SLACK_BOT_TOKEN="op://MCP Servers/Slack MCP Server/bot_token"
export SLACK_APP_TOKEN="op://MCP Servers/Slack MCP Server/app_token"
export DISCORD_BOT_TOKEN="op://MCP Servers/Discord MCP Server/bot_token"
export N8N_API_KEY="op://MCP Servers/N8N MCP Server/api_key"
export N8N_WEBHOOK_URL="op://MCP Servers/N8N MCP Server/webhook_url"

# === ML TRACKING ===
export MLFLOW_TRACKING_URI="http://localhost:5000"
export MLFLOW_EXPERIMENT_NAME="ai-agency-experiments"
export OPTUNA_STORAGE="sqlite:///${DATA_DIR}/optuna.db"
export WANDB_API_KEY="op://Development/WANDB_API_KEY/password"

# === MONITORING ===
export SENTRY_DSN="op://Development/SENTRY_DSN/password"
export SENTRY_AUTH_TOKEN="op://Development/SENTRY_AUTH_TOKEN/password"

# === LITELLM GATEWAY ===
export LITELLM_MASTER_KEY="op://Development/LITELLM_MASTER_KEY/password"
export LITELLM_DATABASE_URL="sqlite:///${DATA_DIR}/litellm.db"

# === OLLAMA LOCAL ===
export OLLAMA_BASE_URL="http://localhost:11434"
export OLLAMA_MODELS="llama3.2:3b,codellama:7b,mistral:latest"

# === PATH ADDITIONS ===
export PATH="${PATH}:${HOME}/Library/Python/3.9/bin"
export PATH="${PATH}:${HOME}/.local/bin"
export PATH="${PATH}:${HOME}/.cargo/bin"
export PATH="${PATH}:${HOME}/go/bin"

echo "✅ Environment loaded with 1Password secrets"
