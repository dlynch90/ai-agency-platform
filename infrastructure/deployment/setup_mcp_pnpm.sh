#!/bin/bash
# MCP Server Setup using pnpm (avoiding npm permission issues)

set -e

echo "🔧 MCP SERVER SETUP WITH PNPM"
echo "=============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Create temp directory for pnpm
TEMP_DIR="/tmp/mcp-setup"
mkdir -p "$TEMP_DIR"

# Set pnpm to use temp store
export PNPM_STORE_PATH="/tmp/.pnpm-store"
export PNPM_HOME="/tmp/.pnpm-home"

# Function to install MCP server with pnpm
install_mcp_server() {
    local server_name="$1"
    local package_name="$2"

    log "Installing $server_name MCP server with pnpm..."

    cd "$TEMP_DIR"
    if pnpm add -g "$package_name" 2>/dev/null; then
        log "$server_name installed successfully"
    else
        error "Failed to install $server_name"
        return 1
    fi
}

# Install core MCP servers
log "Installing core MCP servers..."

install_mcp_server "Ollama" "@modelcontextprotocol/server-ollama"
install_mcp_server "Task Master" "@modelcontextprotocol/server-task-master"
install_mcp_server "Sequential Thinking" "@modelcontextprotocol/server-sequential-thinking"
install_mcp_server "Desktop Commander" "@modelcontextprotocol/server-desktop-commander"
install_mcp_server "Filesystem" "@modelcontextprotocol/server-filesystem"
install_mcp_server "Git" "@modelcontextprotocol/server-git"

log "Core MCP servers installed successfully"

# Create MCP configuration for Cursor
MCP_CONFIG_DIR="${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}/.mcp"
mkdir -p "$MCP_CONFIG_DIR"

cat > "$MCP_CONFIG_DIR/config.json" << EOF
{
  "mcpServers": {
    "ollama": {
      "command": "node",
      "args": ["\$(pnpm root -g)/@modelcontextprotocol/server-ollama/dist/index.js"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434"
      }
    },
    "task-master": {
      "command": "node",
      "args": ["\$(pnpm root -g)/@modelcontextprotocol/server-task-master/dist/index.js"],
      "env": {
        "TASK_MASTER_DB_PATH": "${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}/.taskmaster.db"
      }
    },
    "sequential-thinking": {
      "command": "node",
      "args": ["\$(pnpm root -g)/@modelcontextprotocol/server-sequential-thinking/dist/index.js"],
      "env": {
        "SEQUENTIAL_THINKING_DB_PATH": "${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}/.sequential-thinking.db"
      }
    },
    "desktop-commander": {
      "command": "node",
      "args": ["\$(pnpm root -g)/@modelcontextprotocol/server-desktop-commander/dist/index.js"],
      "env": {
        "DESKTOP_COMMANDER_ALLOWED_DIRS": "${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}",
        "DESKTOP_COMMANDER_FILE_READ_LIMIT": "1000",
        "DESKTOP_COMMANDER_FILE_WRITE_LIMIT": "50"
      }
    },
    "filesystem": {
      "command": "node",
      "args": ["\$(pnpm root -g)/@modelcontextprotocol/server-filesystem/dist/index.js"],
      "env": {
        "FILESYSTEM_ROOT_PATH": "${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}"
      }
    },
    "git": {
      "command": "node",
      "args": ["\$(pnpm root -g)/@modelcontextprotocol/server-git/dist/index.js"],
      "env": {
        "GIT_REPOSITORY_PATH": "${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}"
      }
    }
  }
}
EOF

log "MCP configuration created at $MCP_CONFIG_DIR/config.json"

# Create environment setup script
cat > "$MCP_CONFIG_DIR/setup_env.sh" << 'EOF'
#!/bin/bash
# MCP Environment Setup Script

echo "🔧 SETTING UP MCP ENVIRONMENT"
echo "=============================="

# Add pnpm global bin to PATH
export PATH="$(pnpm root -g)/bin:$PATH"

# Set environment variables
export OLLAMA_BASE_URL="http://localhost:11434"
export TASK_MASTER_DB_PATH="${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}/.taskmaster.db"
export SEQUENTIAL_THINKING_DB_PATH="${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}/.sequential-thinking.db"
export DESKTOP_COMMANDER_ALLOWED_DIRS="${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}"
export FILESYSTEM_ROOT_PATH="${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}"
export GIT_REPOSITORY_PATH="${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}"

echo "MCP environment configured. Add the following to your shell profile:"
echo "export PATH=\"\$(pnpm root -g)/bin:\$PATH\""
echo "source ${DEVELOPER_DIR:-${USER_HOME:-${USER_HOME:-$HOME}}/Developer}/.mcp/setup_env.sh"
EOF

chmod +x "$MCP_CONFIG_DIR/setup_env.sh"

log "Environment setup script created at $MCP_CONFIG_DIR/setup_env.sh"

# Create health check
cat > "$MCP_CONFIG_DIR/health_check.sh" << 'EOF'
#!/bin/bash
echo "🔍 MCP SERVER HEALTH CHECK"
echo "==========================="

# Check Ollama
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "✓ Ollama: RUNNING"
else
    echo "✗ Ollama: NOT RUNNING"
fi

# Check MCP binaries
if command -v pnpm >/dev/null 2>&1; then
    PNPM_GLOBAL="$(pnpm root -g 2>/dev/null)/bin"
    if [ -d "$PNPM_GLOBAL" ]; then
        echo "✓ MCP binaries: AVAILABLE"
        ls "$PNPM_GLOBAL" | grep -c "mcp" | xargs echo "  MCP servers found:"
    else
        echo "✗ MCP binaries: NOT FOUND"
    fi
else
    echo "✗ pnpm: NOT FOUND"
fi

echo ""
echo "To configure Cursor IDE:"
echo "1. Open Cursor settings"
echo "2. Navigate to MCP settings"
echo "3. Import configuration from: $MCP_CONFIG_DIR/config.json"
EOF

chmod +x "$MCP_CONFIG_DIR/health_check.sh"

log "Health check script created at $MCP_CONFIG_DIR/health_check.sh"

echo ""
echo "🎉 MCP SETUP COMPLETE"
echo "===================="
echo ""
echo "Installed MCP servers:"
echo "- Ollama (Local AI models)"
echo "- Task Master (Project management)"
echo "- Sequential Thinking (Structured reasoning)"
echo "- Desktop Commander (File operations)"
echo "- Filesystem (File system access)"
echo "- Git (Version control operations)"
echo ""
echo "Next steps:"
echo "1. Run: source $MCP_CONFIG_DIR/setup_env.sh"
echo "2. Check health: $MCP_CONFIG_DIR/health_check.sh"
echo "3. Configure Cursor IDE with $MCP_CONFIG_DIR/config.json"
echo ""
echo "Note: Additional MCP servers can be installed as needed using:"
echo "pnpm add -g @modelcontextprotocol/server-[name]"

# Cleanup
rm -rf "$TEMP_DIR"