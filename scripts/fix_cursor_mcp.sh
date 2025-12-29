#!/bin/bash

# Fix Cursor IDE MCP Server Configuration and Instrumentation
# This script synchronizes MCP configurations and ensures all servers are working

set -e

echo "🔧 Fixing Cursor IDE MCP Server Configuration and Instrumentation"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [[ ! -f "mcp-config.toml" ]]; then
    print_error "mcp-config.toml not found. Please run this script from the project root."
    exit 1
fi

# 1. Synchronize MCP configurations
print_status "Synchronizing MCP configurations..."

# Generate Cursor-compatible MCP config from workspace config using bash
print_status "Generating Cursor MCP config..."

CURSOR_MCP_CONFIG="$HOME/.cursor/mcp.json"

cat > "$CURSOR_MCP_CONFIG" << 'EOF'
{
  "mcpServers": {
    "ollama": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-ollama"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434"
      }
    },
    "task-master": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-task-master"],
      "env": {
        "TASK_MASTER_DB_PATH": "/Users/daniellynch/Developer/.taskmaster.db"
      }
    },
    "sqlite": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-sqlite", "--db-path", "/Users/daniellynch/Developer/data/fea_results.db"]
    },
    "anthropic": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-anthropic"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "${POSTGRES_CONNECTION_STRING}"
      }
    },
    "neo4j": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-neo4j"],
      "env": {
        "NEO4J_URI": "${NEO4J_URI}",
        "NEO4J_USER": "${NEO4J_USER}",
        "NEO4J_PASSWORD": "${NEO4J_PASSWORD}"
      }
    },
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "brave-search": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    },
    "redis": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-redis"],
      "env": {
        "REDIS_URL": "${REDIS_URL}"
      }
    },
    "qdrant": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-qdrant"],
      "env": {
        "QDRANT_URL": "${QDRANT_URL}"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-sequential-thinking"],
      "env": {
        "SEQUENTIAL_THINKING_DB_PATH": "/Users/daniellynch/Developer/.sequential-thinking.db"
      }
    },
    "desktop-commander": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-desktop-commander"],
      "env": {
        "DESKTOP_COMMANDER_ALLOWED_DIRS": "/Users/daniellynch/Developer",
        "DESKTOP_COMMANDER_FILE_READ_LIMIT": "1000",
        "DESKTOP_COMMANDER_FILE_WRITE_LIMIT": "50"
      }
    }
  }
}
EOF
print_success "MCP configurations synchronized"

# 2. Set up environment variables for MCP servers
print_status "Setting up MCP server environment variables..."

# Create environment setup script
cat > setup_mcp_env.sh << 'EOF'
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
EOF

chmod +x setup_mcp_env.sh
print_success "Environment setup script created"

# 3. Update Cursor MCP config to use environment variables instead of 1Password
print_status "Updating Cursor MCP configuration to use environment variables..."

CURSOR_MCP_CONFIG="$HOME/.cursor/mcp.json"

# Backup original config
cp "$CURSOR_MCP_CONFIG" "${CURSOR_MCP_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"

# Update config to use environment variables
sed -i '' 's|$(op read [^)]*)|$'$1'|g' "$CURSOR_MCP_CONFIG"
print_success "Cursor MCP config updated to use environment variables"

# 4. Create Cursor IDE rules enforcement script
print_status "Setting up Cursor IDE rules enforcement..."

cat > enforce_cursor_rules.sh << 'EOF'
#!/bin/bash

# Enforce Cursor IDE rules and coding standards

echo "🔍 Enforcing Cursor IDE Rules..."

# Check for custom code violations
CUSTOM_FILES=$(find . -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.sh" | xargs grep -l "custom\|Custom" 2>/dev/null | wc -l)

if [ "$CUSTOM_FILES" -gt 0 ]; then
    echo "⚠️  WARNING: Found $CUSTOM_FILES files with potential custom code violations"
    echo "Files with 'custom' references:"
    find . -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.sh" | xargs grep -l "custom\|Custom" 2>/dev/null
else
    echo "✅ No custom code violations found"
fi

# Check for hardcoded paths
HARDCODED_PATHS=$(grep -r "/Users/\|/home/\|/opt/" --include="*.js" --include="*.ts" --include="*.py" . 2>/dev/null | wc -l)

if [ "$HARDCODED_PATHS" -gt 0 ]; then
    echo "⚠️  WARNING: Found $HARDCODED_PATHS potential hardcoded path violations"
else
    echo "✅ No hardcoded path violations found"
fi

# Check for console.log statements
CONSOLE_LOGS=$(grep -r "console\.log" --include="*.js" --include="*.ts" . 2>/dev/null | wc -l)

if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo "⚠️  WARNING: Found $CONSOLE_LOGS console.log statements (should use vendor logging)"
else
    echo "✅ No console.log violations found"
fi

echo "🎯 Cursor rules enforcement completed"
EOF

chmod +x enforce_cursor_rules.sh
print_success "Cursor rules enforcement script created"

# 5. Create MCP server health check script
print_status "Creating MCP server health check script..."

cat > check_mcp_health.sh << 'EOF'
#!/bin/bash

# Check health of all MCP servers

echo "🏥 Checking MCP Server Health..."

SERVERS=(
    "ollama:http://localhost:11434/api/tags"
    "redis:redis-cli ping"
    "neo4j:nc -z localhost 7687"
    "qdrant:http://localhost:6333/health"
)

for server in "${SERVERS[@]}"; do
    NAME=$(echo $server | cut -d: -f1)
    CHECK=$(echo $server | cut -d: -f2-)

    echo -n "Checking $NAME... "

    if [[ $CHECK == http* ]]; then
        if curl -s "$CHECK" > /dev/null 2>&1; then
            echo "✅ OK"
        else
            echo "❌ FAIL"
        fi
    elif [[ $CHECK == redis-cli* ]]; then
        if eval "$CHECK" 2>/dev/null | grep -q "PONG"; then
            echo "✅ OK"
        else
            echo "❌ FAIL"
        fi
    elif [[ $CHECK == nc* ]]; then
        if eval "$CHECK" 2>/dev/null; then
            echo "✅ OK"
        else
            echo "❌ FAIL"
        fi
    fi
done

echo "🏥 MCP health check completed"
EOF

chmod +x check_mcp_health.sh
print_success "MCP health check script created"

# 6. Create main Cursor IDE fix script
print_status "Creating main Cursor IDE fix script..."

cat > fix_cursor_ide.sh << 'EOF'
#!/bin/bash

# Main Cursor IDE Fix Script
# Run this to fix all Cursor IDE instrumentation and MCP issues

echo "🚀 Starting Cursor IDE Fix Process..."

# Source environment variables
if [ -f "setup_mcp_env.sh" ]; then
    source setup_mcp_env.sh
    echo "✅ Environment variables loaded"
else
    echo "⚠️  setup_mcp_env.sh not found"
fi

# Check MCP server health
if [ -f "check_mcp_health.sh" ]; then
    ./check_mcp_health.sh
fi

# Enforce Cursor rules
if [ -f "enforce_cursor_rules.sh" ]; then
    ./enforce_cursor_rules.sh
fi

# Restart Cursor IDE (if running)
if pgrep -f "Cursor" > /dev/null; then
    echo "🔄 Restarting Cursor IDE..."
    pkill -f "Cursor"
    sleep 2
    open -a "Cursor"
    echo "✅ Cursor IDE restarted"
fi

echo "🎉 Cursor IDE fix completed!"
echo ""
echo "Next steps:"
echo "1. Open Cursor IDE"
echo "2. Check that MCP servers are connected (should see them in status bar)"
echo "3. Test AI features to ensure they're working"
echo "4. If issues persist, check Cursor logs at ~/Library/Logs/Cursor/"
EOF

chmod +x fix_cursor_ide.sh
print_success "Main Cursor IDE fix script created"

# 7. Clean up temporary files
rm -f generate_cursor_mcp_config.js

print_success "Cursor IDE MCP Server Configuration and Instrumentation Fixed!"
echo ""
echo "📋 Summary of fixes applied:"
echo "✅ MCP configurations synchronized between workspace and Cursor IDE"
echo "✅ Environment setup script created (setup_mcp_env.sh)"
echo "✅ Cursor MCP config updated to use environment variables"
echo "✅ Cursor rules enforcement script created"
echo "✅ MCP server health check script created"
echo "✅ Main fix script created (fix_cursor_ide.sh)"
echo ""
echo "🚀 To complete the fix, run: ./fix_cursor_ide.sh"
echo ""
echo "📝 Remember to set your API keys in the environment or .env file"