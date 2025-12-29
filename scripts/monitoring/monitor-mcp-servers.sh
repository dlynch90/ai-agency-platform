#!/bin/bash

# MCP Server Monitoring Script
# Monitors the health and utilization of MCP servers

echo "📊 MCP Server Monitoring Report"
echo "================================"

# Check if MCP orchestrator is running
if pgrep -f "mcp-workflow-orchestrator.js" >/dev/null; then
    echo "✅ MCP Orchestrator: RUNNING"
else
    echo "❌ MCP Orchestrator: NOT RUNNING"
fi

# Check individual MCP servers
echo ""
echo "Individual MCP Servers:"
echo "-----------------------"

# Check npm packages
MCP_PACKAGES=(
    "@modelcontextprotocol/server-sequential-thinking"
    "@modelcontextprotocol/server-filesystem"
    "@modelcontextprotocol/server-task-master"
    "@modelcontextprotocol/server-sqlite"
    "@modelcontextprotocol/server-anthropic"
    "@modelcontextprotocol/server-postgres"
    "@modelcontextprotocol/server-neo4j"
    "@modelcontextprotocol/server-git"
    "@modelcontextprotocol/server-brave-search"
    "@modelcontextprotocol/server-redis"
    "@modelcontextprotocol/server-qdrant"
    "@modelcontextprotocol/server-desktop-commander"
)

total_packages=${#MCP_PACKAGES[@]}
installed_packages=0

for package in "${MCP_PACKAGES[@]}"; do
    if npm list -g "$package" >/dev/null 2>&1; then
        echo "✅ $(basename "$package")"
        ((installed_packages++))
    else
        echo "❌ $(basename "$package")"
    fi
done

echo ""
echo "Package Installation: $installed_packages/$total_packages ($(($installed_packages * 100 / $total_packages))%)"

# Check configuration files
echo ""
echo "Configuration Files:"
echo "--------------------"

config_files=(
    "mcp-config.toml"
    "mcp-client-content-gen.json"
    "mcp-client-ecommerce.json"
    "mcp-client-customer-service.json"
    "mcp-workflow-orchestrator.js"
)

for config in "${config_files[@]}"; do
    if [ -f "$config" ]; then
        echo "✅ $config"
    else
        echo "❌ $config"
    fi
done

# Performance metrics (placeholder)
echo ""
echo "Performance Metrics:"
echo "-------------------"
echo "Active Workflows: $(ps aux | grep -c mcp-workflow || echo 0)"
echo "Memory Usage: $(ps aux | grep mcp-workflow | awk '{sum += $6} END {print sum " KB"}' || echo "N/A")"
echo "CPU Usage: $(ps aux | grep mcp-workflow | awk '{sum += $3} END {print sum "%"}' || echo "N/A")"

echo ""
echo "Recommendations:"
echo "----------------"

if [ $installed_packages -lt $total_packages ]; then
    echo "• Run 'npm install -g' for missing MCP packages"
fi

if [ ! -f "mcp-workflow-orchestrator.js" ]; then
    echo "• MCP orchestrator not found - needs setup"
fi

if ! pgrep -f "mcp-workflow-orchestrator.js" >/dev/null; then
    echo "• Start MCP orchestrator for active monitoring"
fi

echo ""
echo "Monitoring complete ✅"
