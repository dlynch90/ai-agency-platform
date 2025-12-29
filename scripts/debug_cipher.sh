#!/bin/bash

# Debug script for Cipher MCP server
echo "🔍 Debugging Cipher MCP Server..."

# Kill any existing processes
pkill -f "@byterover/cipher" 2>/dev/null || true
pkill -f "cipher --mode mcp" 2>/dev/null || true
sleep 2

# Check Ollama status
echo "📊 Checking Ollama status..."
curl -s http://localhost:11434/api/tags | jq '.models[]?.name // empty' 2>/dev/null || echo "❌ Ollama not responding"

# Set environment variables
export OLLAMA_BASE_URL="http://localhost:11434"
export CIPHER_DEV_MODE="true"
export CIPHER_ALLOW_MOCK_RESPONSES="true"

echo "🔧 Starting Cipher MCP with environment:"
echo "  OLLAMA_BASE_URL=$OLLAMA_BASE_URL"
echo "  CIPHER_DEV_MODE=$CIPHER_DEV_MODE"
echo "  CIPHER_ALLOW_MOCK_RESPONSES=$CIPHER_ALLOW_MOCK_RESPONSES"

# Start Cipher directly (not in background for debugging)
echo "🚀 Starting Cipher MCP server..."
timeout 30s npx @byterover/cipher --mode mcp --port 3001 2>&1 | head -50

echo "🔍 Checking if Cipher is accessible..."
curl -s http://localhost:3001/health && echo "✅ Cipher MCP is running!" || echo "❌ Cipher MCP failed to start"
