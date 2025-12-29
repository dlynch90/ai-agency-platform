#!/bin/bash
# MCP Server Health Check Script
# Generated from configs/mcp-server-registry.js

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "MCP Server Health Check"
echo "======================="
echo ""

HEALTHY=0
UNHEALTHY=0
SKIPPED=0

# Check filesystem
if [ -n "${DEVELOPER_DIR:-}" ]; then
  echo -e "${GREEN}[OK]${NC} filesystem - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} filesystem - missing DEVELOPER_DIR"
  ((SKIPPED++))
fi

# Check memory
if [ -n "${DEVELOPER_DIR:-}" ]; then
  echo -e "${GREEN}[OK]${NC} memory - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} memory - missing DEVELOPER_DIR"
  ((SKIPPED++))
fi

# Check sequential-thinking
if [ -n "${DEVELOPER_DIR:-}" ]; then
  echo -e "${GREEN}[OK]${NC} sequential-thinking - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} sequential-thinking - missing DEVELOPER_DIR"
  ((SKIPPED++))
fi

# Check ollama
echo -e "${GREEN}[OK]${NC} ollama - no secrets required"
((HEALTHY++))

# Check openai
if [ -n "${OPENAI_API_KEY:-}" ]; then
  echo -e "${GREEN}[OK]${NC} openai - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} openai - missing OPENAI_API_KEY"
  ((SKIPPED++))
fi

# Check anthropic
if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  echo -e "${GREEN}[OK]${NC} anthropic - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} anthropic - missing ANTHROPIC_API_KEY"
  ((SKIPPED++))
fi

# Check huggingface
if [ -n "${HUGGINGFACE_API_KEY:-}" ]; then
  echo -e "${GREEN}[OK]${NC} huggingface - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} huggingface - missing HUGGINGFACE_API_KEY"
  ((SKIPPED++))
fi

# Check brave-search
if [ -n "${BRAVE_API_KEY:-}" ]; then
  echo -e "${GREEN}[OK]${NC} brave-search - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} brave-search - missing BRAVE_API_KEY"
  ((SKIPPED++))
fi

# Check tavily
if [ -n "${TAVILY_API_KEY:-}" ]; then
  echo -e "${GREEN}[OK]${NC} tavily - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} tavily - missing TAVILY_API_KEY"
  ((SKIPPED++))
fi

# Check exa
if [ -n "${EXA_API_KEY:-}" ]; then
  echo -e "${GREEN}[OK]${NC} exa - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} exa - missing EXA_API_KEY"
  ((SKIPPED++))
fi

# Check firecrawl
if [ -n "${FIRECRAWL_API_KEY:-}" ]; then
  echo -e "${GREEN}[OK]${NC} firecrawl - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} firecrawl - missing FIRECRAWL_API_KEY"
  ((SKIPPED++))
fi

# Check deepwiki
echo -e "${GREEN}[OK]${NC} deepwiki - no secrets required"
((HEALTHY++))

# Check postgres
if [ -n "${DATABASE_URL:-}" ]; then
  echo -e "${GREEN}[OK]${NC} postgres - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} postgres - missing DATABASE_URL"
  ((SKIPPED++))
fi

# Check redis
echo -e "${GREEN}[OK]${NC} redis - no secrets required"
((HEALTHY++))

# Check neo4j
if [ -n "${NEO4J_PASSWORD:-}" ]; then
  echo -e "${GREEN}[OK]${NC} neo4j - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} neo4j - missing NEO4J_PASSWORD"
  ((SKIPPED++))
fi

# Check qdrant
echo -e "${GREEN}[OK]${NC} qdrant - no secrets required"
((HEALTHY++))

# Check mongodb
if [ -n "${MONGODB_URI:-}" ]; then
  echo -e "${GREEN}[OK]${NC} mongodb - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} mongodb - missing MONGODB_URI"
  ((SKIPPED++))
fi

# Check sqlite
echo -e "${GREEN}[OK]${NC} sqlite - no secrets required"
((HEALTHY++))

# Check github
if [ -n "${GITHUB_TOKEN:-}" ]; then
  echo -e "${GREEN}[OK]${NC} github - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} github - missing GITHUB_TOKEN"
  ((SKIPPED++))
fi

# Check gitlab
if [ -n "${GITLAB_TOKEN:-}" ]; then
  echo -e "${GREEN}[OK]${NC} gitlab - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} gitlab - missing GITLAB_TOKEN"
  ((SKIPPED++))
fi

# Check git
echo -e "${GREEN}[OK]${NC} git - no secrets required"
((HEALTHY++))

# Check docker
echo -e "${GREEN}[OK]${NC} docker - no secrets required"
((HEALTHY++))

# Check kubernetes
if [ -n "${HOME}/.kube/confi:-}" ]; then
  echo -e "${GREEN}[OK]${NC} kubernetes - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} kubernetes - missing HOME}/.kube/confi"
  ((SKIPPED++))
fi

# Check terraform
echo -e "${GREEN}[OK]${NC} terraform - no secrets required"
((HEALTHY++))

# Check aws
echo -e "${GREEN}[OK]${NC} aws - no secrets required"
((HEALTHY++))

# Check vercel
if [ -n "${VERCEL_TOKEN:-}" ]; then
  echo -e "${GREEN}[OK]${NC} vercel - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} vercel - missing VERCEL_TOKEN"
  ((SKIPPED++))
fi

# Check supabase
if [ -n "${SUPABASE_URL:-}" ]; then
  echo -e "${GREEN}[OK]${NC} supabase - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} supabase - missing SUPABASE_URL"
  ((SKIPPED++))
fi

# Check slack
if [ -n "${SLACK_BOT_TOKEN:-}" ]; then
  echo -e "${GREEN}[OK]${NC} slack - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} slack - missing SLACK_BOT_TOKEN"
  ((SKIPPED++))
fi

# Check discord
if [ -n "${DISCORD_BOT_TOKEN:-}" ]; then
  echo -e "${GREEN}[OK]${NC} discord - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} discord - missing DISCORD_BOT_TOKEN"
  ((SKIPPED++))
fi

# Check email
echo -e "${GREEN}[OK]${NC} email - no secrets required"
((HEALTHY++))

# Check notion
if [ -n "${NOTION_TOKEN:-}" ]; then
  echo -e "${GREEN}[OK]${NC} notion - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} notion - missing NOTION_TOKEN"
  ((SKIPPED++))
fi

# Check linear
if [ -n "${LINEAR_API_KEY:-}" ]; then
  echo -e "${GREEN}[OK]${NC} linear - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} linear - missing LINEAR_API_KEY"
  ((SKIPPED++))
fi

# Check task-master
if [ -n "${HOME}/.claude/tasks.d:-}" ]; then
  echo -e "${GREEN}[OK]${NC} task-master - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} task-master - missing HOME}/.claude/tasks.d"
  ((SKIPPED++))
fi

# Check clerk
if [ -n "${CLERK_SECRET_KEY:-}" ]; then
  echo -e "${GREEN}[OK]${NC} clerk - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} clerk - missing CLERK_SECRET_KEY"
  ((SKIPPED++))
fi

# Check n8n
if [ -n "${N8N_API_KEY:-}" ]; then
  echo -e "${GREEN}[OK]${NC} n8n - configured"
  ((HEALTHY++))
else
  echo -e "${YELLOW}[SKIP]${NC} n8n - missing N8N_API_KEY"
  ((SKIPPED++))
fi

# Check playwright
echo -e "${GREEN}[OK]${NC} playwright - no secrets required"
((HEALTHY++))


echo ""
echo "Summary"
echo "-------"
echo -e "Healthy: ${GREEN}${HEALTHY}${NC}"
echo -e "Skipped: ${YELLOW}${SKIPPED}${NC}"
echo -e "Unhealthy: ${RED}${UNHEALTHY}${NC}"

