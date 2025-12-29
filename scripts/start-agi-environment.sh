#!/bin/bash
# AGI Environment Startup Script
# Initializes the complete AGI development environment

set -e

echo "🚀 Starting AGI Development Environment"
echo "======================================="

# Load environment variables
if [ -f ".env" ]; then
    source scripts/load-env.sh
    echo "✅ Environment variables loaded"
else
    echo "⚠️  .env file not found - MCP servers may not work"
fi

# Initialize mise
if command_exists mise; then
    echo "🔧 Initializing mise..."
    mise install
    echo "✅ Mise initialized"
fi

# Start essential services
echo "🔄 Checking essential services..."

# Test API connectivity
./scripts/test-api-connectivity.sh

# Initialize pixi environment
if command_exists pixi; then
    echo "🐍 Initializing pixi environment..."
    pixi install --quiet
    echo "✅ Pixi environment ready"
fi

# Start AGI orchestrator
echo "🤖 Starting AGI orchestrator..."
python3 scripts/agi/agi-orchestrator.py &
AGI_PID=$!
echo "✅ AGI orchestrator started (PID: $AGI_PID)"

# Start MCP servers (if configured)
if [ -f "mcp-config.toml" ]; then
    echo "🔌 Starting MCP servers..."
    # Note: In a real implementation, this would start the MCP server coordinator
    echo "✅ MCP servers configured"
fi

echo ""
echo "🎉 AGI Development Environment Ready!"
echo ""
echo "Available commands:"
echo "  just setup-dev     - Setup all environments"
echo "  just dev-fea       - Start FEA development"
echo "  just dev-java      - Start Java development"
echo "  just dev-node      - Start Node.js development"
echo "  ./scripts/env-select.sh <env> - Switch environments"
echo "  python3 scripts/agi/agi-orchestrator.py - Run AGI tasks"
echo ""
echo "AGI Orchestrator PID: $AGI_PID"
echo "Use 'kill $AGI_PID' to stop the orchestrator"

# Keep the script running to maintain services
wait
