#!/bin/bash
export OLLAMA_BASE_URL="http://localhost:11434"
export CIPHER_DEV_MODE="true"
export CIPHER_ALLOW_MOCK_RESPONSES="true"

# Kill any existing cipher processes
pkill -f "@byterover/cipher" 2>/dev/null || true
sleep 2

# Start Cipher MCP server
exec npx @byterover/cipher --mode mcp --port 3001
