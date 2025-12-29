#!/usr/bin/env python3
"""
MCP Server Initialization Script
Sets up and configures 20+ MCP servers for the FEA environment
"""

import os
import sys
import subprocess
import json
import time
from pathlib import Path
import requests

class MCPServerManager:
    """Manager for MCP server initialization and configuration"""

    def __init__(self, config_path="mcp-config.toml"):
        self.config_path = Path(config_path)
        self.project_root = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}")
        self.mcp_config_dir = self.project_root / ".mcp"
        self.mcp_cache_dir = Path.home() / ".cache" / "mcp"

        # Create necessary directories
        self.mcp_config_dir.mkdir(exist_ok=True)
        self.mcp_cache_dir.mkdir(parents=True, exist_ok=True)

    def check_dependencies(self):
        """Check if required dependencies are available"""
        print("🔍 Checking MCP server dependencies...")

        # #region agent log H3
        import json
        import time
        dep_check_results = {}
        # #endregion

        required_commands = [
            "node", "npm", "npx",
            "python", "pip",
            "docker", "docker-compose"
        ]

        missing = []
        for cmd in required_commands:
            exists = self._command_exists(cmd)
            dep_check_results[cmd] = exists
            if not exists:
                missing.append(cmd)

        # #region agent log H3
        with open('${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug.log', 'a') as f:
            f.write(json.dumps({
                "id": f"log_{int(time.time()*1000)}_{'h3_dep_' + str(hash(str(time.time())))[:8]}",
                "timestamp": int(time.time()*1000),
                "location": "init_mcp_servers.py:check_dependencies",
                "message": "Dependency check results",
                "data": {"dep_check_results": dep_check_results, "missing": missing},
                "sessionId": "debug-fea-startup",
                "runId": "run-1",
                "hypothesisId": "H3"
            }) + '\n')
        # #endregion

        if missing:
            print(f"⚠️ Missing dependencies: {', '.join(missing)}")
            print("Installing missing dependencies...")
            self._install_missing_dependencies(missing)
        else:
            print("✅ All core dependencies available")

    def _command_exists(self, command):
        """Check if a command exists on the system"""
        try:
            subprocess.run([command, "--version"],
                         capture_output=True, check=True, timeout=5)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            return False

    def _install_missing_dependencies(self, missing):
        """Install missing dependencies"""
        if "node" in missing or "npm" in missing:
            print("📦 Installing Node.js...")
            # Assume pixi will handle this
            print("Node.js should be installed via Pixi")

        if "python" in missing or "pip" in missing:
            print("🐍 Installing Python...")
            # Assume pixi will handle this
            print("Python should be installed via Pixi")

        if "docker" in missing:
            print("🐳 Installing Docker...")
            # This might require manual installation
            print("Please install Docker manually")

    def setup_database_services(self):
        """Set up required database services"""
        print("🗄️ Setting up database services...")

        services = {
            "neo4j": {"port": 7687, "web_port": 7474},
            "qdrant": {"port": 6333, "web_port": 6333},
            "redis": {"port": 6379},
            "postgres": {"port": 5432}
        }

        for service, config in services.items():
            if self._check_service_running(service, config["port"]):
                print(f"✅ {service} is running on port {config['port']}")
            else:
                print(f"⚠️ {service} not running, attempting to start...")
                self._start_service(service)

    def _check_service_running(self, service, port):
        """Check if a service is running on a given port"""
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            return result == 0
        except:
            return False

    def _start_service(self, service):
        """Attempt to start a service using docker-compose"""
        compose_file = self.project_root / f"docker-compose.{service}.yml"
        if compose_file.exists():
            try:
                subprocess.run(["docker-compose", "-f", str(compose_file), "up", "-d"],
                             check=True, timeout=30)
                print(f"✅ Started {service} via docker-compose")
            except subprocess.CalledProcessError:
                print(f"❌ Failed to start {service}")
        else:
            print(f"⚠️ No docker-compose file found for {service}")

    def install_mcp_packages(self):
        """Install required MCP server packages"""
        print("📦 Installing MCP server packages...")

        mcp_packages = [
            "@modelcontextprotocol/server-sequential-thinking",
            "@modelcontextprotocol/server-filesystem",
            "@modelcontextprotocol/server-git",
            "@modelcontextprotocol/server-brave-search",
            "@modelcontextprotocol/server-github",
            "@modelcontextprotocol/server-sqlite",
            "@modelcontextprotocol/server-slack",
            "@modelcontextprotocol/server-google-drive",
            "@modelcontextprotocol/server-postgres",
            "@modelcontextprotocol/server-redis",
            "@modelcontextprotocol/server-neo4j",
            "@modelcontextprotocol/server-elasticsearch",
            "@modelcontextprotocol/server-kubernetes",
            "@modelcontextprotocol/server-docker",
            "@modelcontextprotocol/server-aws",
            "@modelcontextprotocol/server-openai",
            "@modelcontextprotocol/server-anthropic",
            "@modelcontextprotocol/server-tavily",
            "@modelcontextprotocol/server-exa",
            "@modelcontextprotocol/server-firecrawl",
            "@modelcontextprotocol/server-deepwiki",
            "@modelcontextprotocol/server-ollama",
            "@modelcontextprotocol/server-playwright",
            "@modelcontextprotocol/server-puppeteer",
            "@modelcontextprotocol/server-task-master",
            "@modelcontextprotocol/server-qdrant",
            "@modelcontextprotocol/server-chroma",
            "@modelcontextprotocol/server-weaviate",
            "@modelcontextprotocol/server-langchain",
            "@modelcontextprotocol/server-llamaindex",
            "@modelcontextprotocol/server-huggingface",
            "@modelcontextprotocol/server-replicate",
            "@modelcontextprotocol/server-modal",
            "@modelcontextprotocol/server-vercel",
            "@modelcontextprotocol/server-netlify",
            "@modelcontextprotocol/server-railway",
            "@modelcontextprotocol/server-planetscale",
            "@modelcontextprotocol/server-supabase",
            "@modelcontextprotocol/server-clerk"
        ]

        # Install packages in batches to avoid timeout
        batch_size = 5
        for i in range(0, len(mcp_packages), batch_size):
            batch = mcp_packages[i:i+batch_size]
            print(f"Installing batch {i//batch_size + 1}: {batch}")
            try:
                subprocess.run(["npm", "install", "-g"] + batch,
                             check=True, timeout=120)
                print(f"✅ Installed batch {i//batch_size + 1}")
            except subprocess.CalledProcessError as e:
                print(f"❌ Failed to install batch {i//batch_size + 1}: {e}")

    def configure_environment(self):
        """Configure environment variables for MCP servers"""
        print("⚙️ Configuring environment variables...")

        env_file = self.project_root / ".env.mcp"
        if not env_file.exists():
            env_template = """# MCP Server Environment Variables
# Add your API keys and secrets here

# Search APIs
BRAVE_API_KEY=your_brave_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
EXA_API_KEY=your_exa_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
DEEPWIKI_API_KEY=your_deepwiki_api_key_here

# Development Platforms
GITHUB_TOKEN=your_github_token_here
GITLAB_TOKEN=your_gitlab_token_here

# Cloud Services
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# AI/ML Services
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
HUGGINGFACE_TOKEN=your_huggingface_token_here
REPLICATE_API_TOKEN=your_replicate_token_here
LANGCHAIN_API_KEY=your_langchain_api_key_here
LLAMAINDEX_API_KEY=your_llamaindex_api_key_here

# Communication
SLACK_BOT_TOKEN=your_slack_bot_token_here

# Databases
NEO4J_PASSWORD=your_neo4j_password_here

# Deployment
VERCEL_TOKEN=your_vercel_token_here
NETLIFY_AUTH_TOKEN=your_netlify_auth_token_here
RAILWAY_TOKEN=your_railway_token_here
PLANETSCALE_TOKEN=your_planetscale_token_here
MODAL_TOKEN_ID=your_modal_token_id_here
MODAL_TOKEN_SECRET=your_modal_token_secret_here

# Backend Services
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
"""
            env_file.write_text(env_template)
            print("✅ Created .env.mcp template file")
            print("⚠️ Please fill in your API keys and secrets in .env.mcp")
        else:
            print("✅ .env.mcp file already exists")

    def create_mcp_client_config(self):
        """Create MCP client configuration for Cursor/VSCode"""
        print("🔧 Creating MCP client configuration...")

        # Create Cursor MCP config
        cursor_config = {
            "mcpServers": {
                "sequential-thinking": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
                },
                "filesystem": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-filesystem", str(self.project_root)]
                },
                "git": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-git", "--repository", str(self.project_root)]
                },
                "ollama": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-ollama"]
                },
                "task-master": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-task-master"]
                }
            }
        }

        config_file = self.mcp_config_dir / "cursor-mcp-config.json"
        config_file.write_text(json.dumps(cursor_config, indent=2))
        print("✅ Created Cursor MCP configuration")

    def test_mcp_servers(self):
        """Test basic MCP server connectivity"""
        print("🧪 Testing MCP server connectivity...")

        test_commands = [
            (["npx", "@modelcontextprotocol/server-sequential-thinking", "--help"], "Sequential Thinking"),
            (["npx", "@modelcontextprotocol/server-ollama", "--help"], "Ollama"),
            (["npx", "@modelcontextprotocol/server-filesystem", "--help"], "Filesystem"),
        ]

        for cmd, name in test_commands:
            try:
                result = subprocess.run(cmd, capture_output=True, timeout=10)
                if result.returncode == 0:
                    print(f"✅ {name} MCP server test passed")
                else:
                    print(f"⚠️ {name} MCP server test failed: {result.stderr.decode()}")
            except subprocess.TimeoutExpired:
                print(f"⚠️ {name} MCP server test timed out")
            except FileNotFoundError:
                print(f"❌ {name} MCP server not found")

    def create_startup_script(self):
        """Create script to start essential MCP servers"""
        print("🚀 Creating MCP server startup script...")

        startup_script = """#!/bin/bash
# MCP Server Startup Script
# This script starts essential MCP servers for the FEA environment

echo "Starting MCP servers..."

# Load environment variables
if [ -f ".env.mcp" ]; then
    export $(grep -v '^#' .env.mcp | xargs)
fi

# Function to start MCP server in background
start_mcp_server() {
    local name=$1
    shift
    echo "Starting $name MCP server..."
    nohup "$@" > "logs/mcp_$name.log" 2>&1 &
    echo $! > "pids/mcp_$name.pid"
}

# Create log and pid directories
mkdir -p logs pids

# Start essential servers
start_mcp_server sequential-thinking npx -y @modelcontextprotocol/server-sequential-thinking
start_mcp_server filesystem npx -y @modelcontextprotocol/server-filesystem ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}
start_mcp_server git npx -y @modelcontextprotocol/server-git --repository ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}
start_mcp_server ollama npx -y @modelcontextprotocol/server-ollama
start_mcp_server task-master npx -y @modelcontextprotocol/server-task-master

echo "MCP servers started. Check logs/ for output and pids/ for process IDs."
echo "Use 'kill $(cat pids/mcp_*.pid)' to stop all servers."
"""

        script_file = self.project_root / "scripts" / "start_mcp_servers.sh"
        script_file.write_text(startup_script)
        script_file.chmod(0o755)
        print("✅ Created MCP server startup script")

    def run_initialization(self):
        """Run complete MCP server initialization"""
        print("🎯 Starting MCP Server Initialization")
        print("=" * 50)

        steps = [
            self.check_dependencies,
            self.setup_database_services,
            self.install_mcp_packages,
            self.configure_environment,
            self.create_mcp_client_config,
            self.test_mcp_servers,
            self.create_startup_script
        ]

        for i, step in enumerate(steps, 1):
            print(f"\nStep {i}/{len(steps)}: {step.__name__}")
            try:
                step()
            except Exception as e:
                print(f"❌ Error in {step.__name__}: {e}")
                continue

        print("\n" + "=" * 50)
        print("✅ MCP Server Initialization Complete")
        print("\nNext steps:")
        print("1. Fill in API keys in .env.mcp")
        print("2. Run './scripts/start_mcp_servers.sh' to start servers")
        print("3. Configure Cursor/VSCode to use the MCP configuration")

if __name__ == "__main__":
    manager = MCPServerManager()
    manager.run_initialization()