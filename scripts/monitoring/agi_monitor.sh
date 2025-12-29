#!/bin/bash
# AGI Automation System Monitor
# Comprehensive monitoring across all services and components

echo "🔍 AGI SYSTEM MONITOR - $(date)"
echo "================================="

# Service Health Check
echo "🔧 SERVICE HEALTH:"
services=("postgresql:5432" "neo4j:7687" "redis:6379" "ollama:11434" "agi-core:8000")

for service in "${services[@]}"; do
  name=$(echo $service | cut -d: -f1)
  port=$(echo $service | cut -d: -f2)
  
  if nc -z localhost $port 2>/dev/null; then
    echo "✅ $name ($port): RUNNING"
  else
    echo "❌ $name ($port): DOWN"
  fi
done

# Resource Usage
echo -e "\n💾 RESOURCE USAGE:"
echo "Memory: $(ps aux | awk '{sum += $4} END {print sum "%"}')"
echo "CPU: $(ps aux | awk '{sum += $3} END {print sum "%"}')"

# AGI Core Metrics
echo -e "\n🤖 AGI CORE METRICS:"
if nc -z localhost 8000 2>/dev/null; then
  health=$(curl -s http://localhost:8000/health)
  echo "Health Status: $(echo $health | jq -r '.status' 2>/dev/null || echo 'Unknown')"
else
  echo "AGI Core: NOT RUNNING"
fi

# Workflow Status
echo -e "\n⚙️ WORKFLOW STATUS:"
workflow_count=$(find ${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}/agi-core/workflows -name "*.json" 2>/dev/null | wc -l)
echo "Available Workflows: $workflow_count"

# MCP Server Status
echo -e "\n🔗 MCP SERVER STATUS:"
mcp_logs="${USER_HOME:-${USER_HOME:-$HOME}}/Library/Application Support/Cursor/logs/20251228T131509/window1/exthost/anysphere.cursor-mcp/"
if [ -d "$mcp_logs" ]; then
  connected=$(grep -r "Successfully connected" "$mcp_logs" 2>/dev/null | wc -l)
  total_logs=$(find "$mcp_logs" -name "*.log" 2>/dev/null | wc -l)
  echo "MCP Servers Connected: $connected/$total_logs"
else
  echo "MCP Logs: Not accessible"
fi

echo -e "\n✅ MONITORING COMPLETE"
