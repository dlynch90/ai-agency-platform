#!/bin/bash

# MCP Server Orchestrator
# Ensures all MCP servers are running and properly utilized

set -e

echo "🎭 Starting MCP Server Orchestrator..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to log with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Check if MCP config exists
check_mcp_config() {
    if [ ! -f "mcp-config.toml" ]; then
        log "❌ MCP config file not found"
        exit 1
    fi
    log "✅ MCP config file found"
}

# Parse MCP servers from config
parse_mcp_servers() {
    log "Parsing MCP servers from configuration..."

    # Extract server names using grep and sed
    servers=$(grep '\[servers\.' mcp-config.toml | sed 's/\[servers\.//' | sed 's/\]//' | tr '\n' ' ')

    # Convert to array
    IFS=' ' read -r -a MCP_SERVERS <<< "$servers"

    log "Found ${#MCP_SERVERS[@]} MCP servers: ${MCP_SERVERS[*]}"
}

# Check if npm is available for MCP servers
check_npm_availability() {
    if ! command_exists npm; then
        log "❌ npm not found - required for MCP servers"
        exit 1
    fi
    log "✅ npm available for MCP server installation"
}

# Install MCP server packages
install_mcp_packages() {
    log "Installing MCP server packages..."

    # List of MCP packages to install
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

    # Install packages globally
    for package in "${MCP_PACKAGES[@]}"; do
        log "Installing $package..."
        if npm list -g "$package" >/dev/null 2>&1; then
            log "✅ $package already installed"
        else
            if npm install -g "$package" 2>/dev/null; then
                log "✅ $package installed successfully"
            else
                log "⚠️ Failed to install $package"
            fi
        fi
    done
}

# Test MCP server availability
test_mcp_servers() {
    log "Testing MCP server availability..."

    local available_count=0
    local total_count=${#MCP_PACKAGES[@]}

    for package in "${MCP_PACKAGES[@]}"; do
        # Extract server name from package
        server_name=$(echo "$package" | sed 's/@modelcontextprotocol\/server-//' | sed 's/-/_/g')

        # Try to run the server with --help to test availability
        if npx "$package" --help >/dev/null 2>&1; then
            log "✅ $server_name server is available"
            ((available_count++))
        else
            log "❌ $server_name server is not available"
        fi
    done

    local availability_rate=$((available_count * 100 / total_count))
    log "MCP Server Availability: $available_count/$total_count ($availability_rate%)"

    if [ $availability_rate -ge 80 ]; then
        log "🎉 MCP server availability is excellent!"
    elif [ $availability_rate -ge 60 ]; then
        log "⚠️ MCP server availability is good but could be better"
    else
        log "❌ MCP server availability is poor - manual intervention required"
    fi
}

# Create MCP client configuration for different use cases
create_mcp_clients() {
    log "Creating MCP client configurations for use cases..."

    # AI Agency Content Generation Client
    cat > mcp-client-content-gen.json << EOF
{
  "name": "AI Agency Content Generation",
  "description": "MCP client configuration for content generation workflows",
  "servers": {
    "anthropic": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-anthropic"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "${HOME}/Developer/content"],
      "env": {
        "ALLOW_FILE_READ": "true",
        "ALLOW_FILE_WRITE": "true"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-sequential-thinking"]
    }
  },
  "workflows": {
    "blog-post": ["anthropic", "filesystem", "sequential-thinking"],
    "social-media": ["anthropic", "filesystem"],
    "seo-optimization": ["anthropic", "sequential-thinking"]
  }
}
EOF

    # E-commerce Personalization Client
    cat > mcp-client-ecommerce.json << EOF
{
  "name": "E-commerce Personalization",
  "description": "MCP client configuration for e-commerce personalization",
  "servers": {
    "postgres": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "${POSTGRES_CONNECTION_STRING}"
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
    }
  },
  "workflows": {
    "product-recommendation": ["postgres", "redis", "qdrant"],
    "customer-segmentation": ["postgres", "redis"],
    "inventory-optimization": ["postgres", "redis"]
  }
}
EOF

    # Customer Service Automation Client
    cat > mcp-client-customer-service.json << EOF
{
  "name": "Customer Service Automation",
  "description": "MCP client configuration for customer service automation",
  "servers": {
    "anthropic": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-anthropic"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
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
    "sqlite": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-sqlite", "--db-path", "${HOME}/Developer/data/support.db"]
    }
  },
  "workflows": {
    "ticket-classification": ["anthropic", "neo4j", "sqlite"],
    "response-generation": ["anthropic", "neo4j"],
    "knowledge-base": ["neo4j", "sqlite"]
  }
}
EOF

    log "MCP client configurations created for different use cases"
}

# Create MCP workflow orchestrator
create_workflow_orchestrator() {
    log "Creating MCP workflow orchestrator..."

    cat > mcp-workflow-orchestrator.js << 'EOF'
// MCP Workflow Orchestrator for AI Agency Platform
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class MCPWorkflowOrchestrator {
    constructor() {
        this.activeServers = new Map();
        this.workflows = new Map();
    }

    async loadWorkflowConfig(workflowName) {
        try {
            const configPath = path.join(__dirname, `mcp-client-${workflowName}.json`);
            const configData = await fs.readFile(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error(`Failed to load workflow config for ${workflowName}:`, error);
            return null;
        }
    }

    async startServersForWorkflow(workflowConfig) {
        const startedServers = [];

        for (const [serverName, serverConfig] of Object.entries(workflowConfig.servers)) {
            try {
                const server = spawn(serverConfig.command, serverConfig.args, {
                    env: { ...process.env, ...serverConfig.env },
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                this.activeServers.set(serverName, server);
                startedServers.push(serverName);

                console.log(`✅ Started MCP server: ${serverName}`);

                // Handle server output
                server.stdout.on('data', (data) => {
                    console.log(`[${serverName}] ${data.toString().trim()}`);
                });

                server.stderr.on('data', (data) => {
                    console.error(`[${serverName}] ${data.toString().trim()}`);
                });

                server.on('close', (code) => {
                    console.log(`MCP server ${serverName} exited with code ${code}`);
                    this.activeServers.delete(serverName);
                });

            } catch (error) {
                console.error(`Failed to start MCP server ${serverName}:`, error);
            }
        }

        return startedServers;
    }

    async executeWorkflow(workflowName, input) {
        console.log(`🚀 Executing workflow: ${workflowName}`);

        const config = await this.loadWorkflowConfig(workflowName);
        if (!config) {
            throw new Error(`Workflow ${workflowName} not found`);
        }

        // Start required servers
        const startedServers = await this.startServersForWorkflow(config);
        console.log(`Started servers for ${workflowName}: ${startedServers.join(', ')}`);

        // Execute workflow steps
        const results = {};
        for (const step of config.workflows[workflowName] || []) {
            if (startedServers.includes(step)) {
                results[step] = await this.executeServerCall(step, input);
            }
        }

        return results;
    }

    async executeServerCall(serverName, input) {
        // This is a placeholder for actual MCP protocol communication
        // In a real implementation, this would use the MCP protocol
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    server: serverName,
                    result: `Processed input: ${input}`,
                    timestamp: new Date().toISOString()
                });
            }, 100);
        });
    }

    async stopAllServers() {
        console.log('🛑 Stopping all MCP servers...');

        for (const [serverName, server] of this.activeServers) {
            try {
                server.kill('SIGTERM');
                console.log(`✅ Stopped MCP server: ${serverName}`);
            } catch (error) {
                console.error(`Failed to stop MCP server ${serverName}:`, error);
                server.kill('SIGKILL'); // Force kill if needed
            }
        }

        this.activeServers.clear();
    }

    getActiveServers() {
        return Array.from(this.activeServers.keys());
    }

    getAvailableWorkflows() {
        return [
            'content-gen',
            'ecommerce',
            'customer-service',
            'finance',
            'healthcare',
            'supply-chain',
            'real-estate',
            'education',
            'legal',
            'manufacturing'
        ];
    }
}

// CLI interface
async function main() {
    const orchestrator = new MCPWorkflowOrchestrator();

    const command = process.argv[2];
    const workflow = process.argv[3];

    switch (command) {
        case 'start':
            if (!workflow) {
                console.log('Available workflows:', orchestrator.getAvailableWorkflows().join(', '));
                return;
            }
            await orchestrator.executeWorkflow(workflow, process.argv[4] || 'test input');
            break;

        case 'stop':
            await orchestrator.stopAllServers();
            break;

        case 'status':
            console.log('Active servers:', orchestrator.getActiveServers());
            console.log('Available workflows:', orchestrator.getAvailableWorkflows());
            break;

        default:
            console.log('Usage: node mcp-workflow-orchestrator.js <command> [workflow] [input]');
            console.log('Commands: start, stop, status');
            console.log('Example: node mcp-workflow-orchestrator.js start content-gen "Write a blog post"');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = MCPWorkflowOrchestrator;
EOF

    log "MCP workflow orchestrator created"
}

# Create MCP monitoring script
create_monitoring_script() {
    log "Creating MCP monitoring script..."

    cat > monitor-mcp-servers.sh << 'EOF'
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
EOF

    chmod +x monitor-mcp-servers.sh
    log "MCP monitoring script created"
}

# Main orchestration function
main() {
    log "Starting MCP Server Orchestration..."

    check_mcp_config
    parse_mcp_servers
    check_npm_availability
    install_mcp_packages
    test_mcp_servers
    create_mcp_clients
    create_workflow_orchestrator
    create_monitoring_script

    log "MCP Server Orchestration completed!"
    log ""
    log "🎯 Next steps:"
    log "1. Start workflows: node mcp-workflow-orchestrator.js start <workflow-name>"
    log "2. Monitor servers: ./monitor-mcp-servers.sh"
    log "3. Check status: node mcp-workflow-orchestrator.js status"
    log ""
    log "Available workflows:"
    log "• content-gen - Content generation"
    log "• ecommerce - E-commerce personalization"
    log "• customer-service - Customer service automation"
    log "• finance - Financial services"
    log "• healthcare - Healthcare applications"
    log "• supply-chain - Supply chain optimization"
    log "• real-estate - Real estate intelligence"
    log "• education - Education personalization"
    log "• legal - Legal document automation"
    log "• manufacturing - Manufacturing quality control"
}

# Run main function
main "$@"
EOF

chmod +x mcp-orchestrator.sh