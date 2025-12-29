#!/bin/bash
# Mem0.ai Integration Setup Script
# Complete installation and configuration of mem0.ai with GPU acceleration and MCP tools

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."

    # Check Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3.11+ is required"
        exit 1
    fi

    PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    if python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)'; then
        log_success "Python $PYTHON_VERSION detected"
    else
        log_error "Python 3.11+ required, found $PYTHON_VERSION"
        exit 1
    fi

    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | sed 's/v//')
        log_success "Node.js $NODE_VERSION detected"
    else
        log_warning "Node.js not found - MCP tools may not work"
    fi

    # Check GPU
    if python3 -c 'import torch; print(torch.cuda.is_available())' 2>/dev/null | grep -q True; then
        GPU_NAME=$(python3 -c 'import torch; print(torch.cuda.get_device_name(0))' 2>/dev/null)
        log_success "GPU detected: $GPU_NAME"
    else
        log_warning "GPU not detected - CPU-only mode"
    fi
}

# Setup Python environment
setup_python_env() {
    log_info "Setting up Python environment..."

    # Create virtual environment if it doesn't exist
    if [ ! -d "venv311" ]; then
        log_info "Creating Python virtual environment..."
        python3 -m venv venv311
    fi

    # Activate virtual environment
    source venv311/bin/activate

    # Upgrade pip
    pip install --upgrade pip

    # Install core dependencies
    log_info "Installing core dependencies..."
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
    pip install mem0ai sentence-transformers transformers pydantic fastapi uvicorn

    # Install vector databases
    log_info "Installing vector database clients..."
    pip install qdrant-client chromadb pinecone-client weaviate-client

    # Install graph databases
    pip install neo4j

    # Install search and content tools
    pip install redis opensearch-py

    # Install development tools
    pip install pytest pytest-asyncio black isort mypy ruff

    log_success "Python environment setup complete"
}

# Setup Node.js environment
setup_nodejs_env() {
    log_info "Setting up Node.js environment..."

    if ! command -v npm &> /dev/null; then
        log_warning "npm not found - skipping Node.js setup"
        return
    fi

    # Install MCP servers
    log_info "Installing MCP servers..."
    npm install -g @playwright/mcp @modelcontextprotocol/server-filesystem \
                  @modelcontextprotocol/server-sequential-thinking \
                  brave-search tavily-mcp exa-mcp-server firecrawl-mcp \
                  @ama-mcp/github slack-mcp @notionhq/notion-mcp-server \
                  docker-mcp-server kubernetes-mcp-server mcp-server-sqlite

    log_success "Node.js environment setup complete"
}

# Setup configuration files
setup_config() {
    log_info "Setting up configuration files..."

    # Create environment file
    if [ ! -f ".env.mem0" ]; then
        cat > .env.mem0 << EOF
# Mem0.ai Configuration
MEM0_API_KEY=your_mem0_api_key_here
MEM0_BASE_URL=https://api.mem0.ai

# Vector Databases
QDRANT_URL=http://localhost:6333
CHROMA_HOST=localhost
CHROMA_PORT=8000
PINECONE_API_KEY=your_pinecone_key_here

# Graph Databases
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password_here

# AI Services
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
OLLAMA_BASE_URL=http://localhost:11434

# Search Services
BRAVE_API_KEY=your_brave_key_here
TAVILY_API_KEY=your_tavily_key_here
EXA_API_KEY=your_exa_key_here
FIRECRAWL_API_KEY=your_firecrawl_key_here

# Development Services
GITHUB_TOKEN=your_github_token_here
SLACK_BOT_TOKEN=your_slack_token_here
NOTION_TOKEN=your_notion_token_here

# GPU Configuration
PYTORCH_DEVICE=cuda:0
CUDA_VISIBLE_DEVICES=0

# Server Configuration
HOST=0.0.0.0
MEM0_MCP_PORT=3001
PYTORCH_INTEGRATION_PORT=3002
MCP_INTEGRATION_PORT=3003
EOF
        log_success "Created .env.mem0 configuration file"
        log_warning "Please edit .env.mem0 with your actual API keys"
    fi

    # Create docker-compose for databases
    if [ ! -f "docker-compose.mem0.yml" ]; then
        cat > docker-compose.mem0.yml << EOF
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage

  chroma:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma

  neo4j:
    image: neo4j:latest
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      NEO4J_AUTH: neo4j/your_password_here
    volumes:
      - neo4j_data:/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  opensearch:
    image: opensearchproject/opensearch:latest
    ports:
      - "9200:9200"
      - "9600:9600"
    environment:
      discovery.type: single-node
      plugins.security.disabled: true
    volumes:
      - opensearch_data:/usr/share/opensearch/data

volumes:
  qdrant_data:
  chroma_data:
  neo4j_data:
  redis_data:
  opensearch_data:
EOF
        log_success "Created docker-compose.mem0.yml"
    fi
}

# Setup MCP configuration
setup_mcp_config() {
    log_info "Setting up MCP configuration..."

    # Generate MCP configuration
    node configs/mcp-server-registry.cjs --format=claude > .mcp.json

    # Add mem0 specific configuration
    cat >> .mcp.json << EOF

  "mem0": {
    "command": "python3",
    "args": ["mcp-servers/mem0-server.py"],
    "env": {
      "MEM0_API_KEY": "\${MEM0_API_KEY}",
      "QDRANT_URL": "\${QDRANT_URL}",
      "NEO4J_URI": "\${NEO4J_URI}",
      "NEO4J_PASSWORD": "\${NEO4J_PASSWORD}",
      "PYTORCH_DEVICE": "\${PYTORCH_DEVICE}"
    }
  }
}
EOF

    log_success "MCP configuration updated"
}

# Start databases
start_databases() {
    log_info "Starting required databases..."

    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.mem0.yml up -d
        log_success "Databases started with docker-compose"
    else
        log_warning "docker-compose not found - please start databases manually"
        log_info "Run: docker-compose -f docker-compose.mem0.yml up -d"
    fi
}

# Test installation
test_installation() {
    log_info "Testing installation..."

    # Activate virtual environment
    source venv311/bin/activate

    # Test Python imports
    python3 -c "
import torch
import mem0
from sentence_transformers import SentenceTransformer
import qdrant_client
import chromadb
print('✅ All Python dependencies installed successfully')
print(f'🖥️  Device: {torch.device(\"cuda:0\" if torch.cuda.is_available() else \"cpu\")}')
if torch.cuda.is_available():
    print(f'🖥️  GPU: {torch.cuda.get_device_name(0)}')
"

    # Test Node.js if available
    if command -v node &> /dev/null; then
        node -e "console.log('✅ Node.js available')"
    fi

    log_success "Installation test completed"
}

# Main setup function
main() {
    echo "🚀 Mem0.ai Integration Setup"
    echo "============================"

    check_requirements
    setup_python_env
    setup_nodejs_env
    setup_config
    setup_mcp_config
    start_databases
    test_installation

    echo ""
    log_success "🎉 Mem0.ai integration setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env.mem0 with your API keys"
    echo "2. Start the services:"
    echo "   - MCP Server: python3 mcp-servers/mem0-server.py"
    echo "   - PyTorch Integration: python3 packages/mem0-pytorch-integration/src/mem0_torch.py"
    echo "   - MCP Integration Manager: python3 tools/mem0-mcp-integration.py"
    echo "3. Test with: curl http://localhost:3001/health"
}

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi