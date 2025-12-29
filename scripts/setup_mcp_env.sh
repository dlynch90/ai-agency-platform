#!/bin/bash

# Set up environment variables for MCP servers
# This script should be sourced to set environment variables

export OLLAMA_BASE_URL="http://localhost:11434"
export REDIS_URL="redis://localhost:6379"
export QDRANT_URL="http://localhost:6333"
export NEO4J_URI="bolt://localhost:7687"
export NEO4J_USER="neo4j"
export POSTGRES_CONNECTION_STRING="postgresql://localhost:5432"

# API Keys - Replace with actual values or use 1Password
# For now, using placeholder values - update these with real API keys
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-your_anthropic_key_here}"
export BRAVE_API_KEY="${BRAVE_API_KEY:-your_brave_key_here}"
export GITHUB_TOKEN="${GITHUB_TOKEN:-your_github_token_here}"
export TAVILY_API_KEY="${TAVILY_API_KEY:-your_tavily_key_here}"
export EXA_API_KEY="${EXA_API_KEY:-your_exa_key_here}"
export FIRECRAWL_API_KEY="${FIRECRAWL_API_KEY:-your_firecrawl_key_here}"

echo "MCP environment variables set"
