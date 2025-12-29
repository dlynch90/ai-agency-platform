# Mem0.ai Integration - Complete AI Memory Layer

This document describes the comprehensive Mem0.ai integration with GPU acceleration, 20+ MCP tools, and PyTorch/Pydantic AI support.

## 🎯 Overview

Mem0.ai is the memory layer for AI applications, enabling continuous learning from user interactions. This integration provides:

- **GPU-Accelerated Memory Operations**: PyTorch-based processing with CUDA/MPS support
- **20+ MCP Tool Integration**: Comprehensive AI and data tool orchestration
- **Multi-Modal Memory**: Text, image, and graph-based memory storage
- **Enterprise-Ready**: Multi-tenant isolation, monitoring, and performance optimization

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cursor IDE    │────│   MCP Servers   │────│   Mem0.ai API   │
│                 │    │  (20+ tools)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  GPU Acceleration│
                    │   PyTorch Models │
                    └─────────────────┘
```

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone and setup
git clone <repo>
cd ai-agency-platform

# Run the complete setup script
chmod +x scripts/setup-mem0-integration.sh
./scripts/setup-mem0-integration.sh
```

### 2. Configure API Keys

Edit `.env.mem0` with your API keys:

```bash
# Required API Keys
MEM0_API_KEY=your_mem0_api_key
OPENAI_API_KEY=your_openai_key
NEO4J_PASSWORD=your_neo4j_password

# Optional but recommended
ANTHROPIC_API_KEY=your_anthropic_key
GITHUB_TOKEN=your_github_token
BRAVE_API_KEY=your_brave_search_key
```

### 3. Start Services

```bash
# Start databases
docker-compose -f docker-compose.mem0.yml up -d

# Start Mem0 MCP Server
python3 mcp-servers/mem0-server.py

# Start PyTorch Integration (in another terminal)
python3 packages/mem0-pytorch-integration/src/mem0_torch.py

# Start MCP Integration Manager (in another terminal)
python3 tools/mem0-mcp-integration.py
```

### 4. Verify Installation

```bash
# Test health endpoints
curl http://localhost:3001/health  # Mem0 MCP Server
curl http://localhost:3002/torch/stats  # PyTorch Integration
curl http://localhost:3003/system/stats  # MCP Integration Manager

# Run tests
python3 -m pytest testing/mem0-integration-tests.py -v
```

## 🔧 Core Components

### 1. Mem0 MCP Server (`mcp-servers/mem0-server.py`)

**Features:**
- REST API for memory operations
- MCP protocol support
- GPU-accelerated processing
- Multi-tenant memory isolation

**Endpoints:**
- `POST /memory/add` - Add memories
- `POST /memory/search` - Search memories
- `PUT /memory/update` - Update memories
- `DELETE /memory/delete` - Delete memories
- `GET /memory/stats` - System statistics

### 2. PyTorch Integration (`packages/mem0-pytorch-integration/`)

**Features:**
- PyTorch-based memory embeddings
- GPU acceleration with CUDA/MPS
- Pydantic AI validation
- Attention-based memory models

**Key Classes:**
- `MemoryEmbedding`: PyTorch model for memory processing
- `Mem0TorchIntegration`: Main integration class
- `PydanticMemoryRequest`: Validated memory requests

### 3. MCP Integration Manager (`tools/mem0-mcp-integration.py`)

**Features:**
- 20+ MCP tool orchestration
- Parallel tool execution
- Memory operation orchestration
- System monitoring and statistics

**Supported Tools:**
- **Vector Databases**: Qdrant, ChromaDB, Pinecone, Weaviate
- **Graph Databases**: Neo4j, Nebula
- **AI Models**: Ollama, HuggingFace, OpenAI, Anthropic
- **Search Tools**: Brave, Tavily, Exa, Firecrawl
- **Development**: GitHub, Linear, Slack, Notion

## 🎨 Usage Examples

### Basic Memory Operations

```python
import aiohttp
import asyncio

async def memory_demo():
    async with aiohttp.ClientSession() as session:
        # Add memory
        memory_data = {
            "messages": [
                {"role": "user", "content": "I love pizza"},
                {"role": "assistant", "content": "You mentioned loving pizza before!"}
            ],
            "user_id": "user123",
            "metadata": {"topic": "food"}
        }

        async with session.post('http://localhost:3001/memory/add', json=memory_data) as resp:
            result = await resp.json()
            print(f"Memory added: {result['memory_id']}")

        # Search memory
        search_data = {
            "query": "favorite foods",
            "user_id": "user123"
        }

        async with session.post('http://localhost:3001/memory/search', json=search_data) as resp:
            results = await resp.json()
            print(f"Found {len(results['results'])} memories")
```

### PyTorch Memory Processing

```python
from packages.mem0_pytorch_integration.src.mem0_torch import Mem0TorchIntegration

# Initialize with GPU
integration = Mem0TorchIntegration(device="cuda:0")

# Process memory with PyTorch
memory_request = {
    "content": "Advanced PyTorch memory processing example",
    "user_id": "researcher",
    "importance": 0.9
}

result = await integration.add_memory_torch(memory_request)
print(f"GPU processed: {result['torch_stats']}")
```

### MCP Tool Orchestration

```python
# Orchestrate memory operation across multiple tools
orchestration_request = {
    "operation": "add_memory",
    "params": {
        "content": "Cross-tool memory orchestration",
        "user_id": "multi_tool_user"
    }
}

async with aiohttp.ClientSession() as session:
    async with session.post('http://localhost:3003/memory/orchestrate', json=orchestration_request) as resp:
        result = await resp.json()
        print(f"Orchestrated across {result['successful_tools']} tools")
```

## 🔍 MCP Tool Capabilities

### Vector Search & Storage
- **Qdrant**: High-performance vector search with filtering
- **ChromaDB**: Open-source embedding database
- **Pinecone**: Managed vector database
- **Weaviate**: GraphQL-powered vector search

### Graph Memory
- **Neo4j**: Relationship-aware memory storage
- **Nebula**: Distributed graph database

### AI & ML
- **Ollama**: Local LLM inference
- **OpenAI/Anthropic**: Cloud LLM APIs
- **HuggingFace**: Model hub integration

### Content & Search
- **Brave Search**: Privacy-focused web search
- **Tavily**: AI-powered research search
- **Exa/Firecrawl**: Web content extraction

### Development Tools
- **GitHub**: Repository and issue management
- **Linear**: Project management
- **Slack**: Team communication
- **Notion**: Document collaboration

## 📊 Performance & Monitoring

### GPU Acceleration Metrics

```python
# Get PyTorch performance stats
stats = await integration.get_torch_stats()
print(f"""
Device: {stats['device']}
GPU: {stats.get('gpu_name', 'N/A')}
Memory: {stats.get('gpu_memory_allocated', 'N/A')}
Model Parameters: {stats['model_parameters']:,}
""")
```

### MCP Tool Monitoring

```python
# Get system-wide statistics
async with aiohttp.ClientSession() as session:
    async with session.get('http://localhost:3003/system/stats') as resp:
        stats = await resp.json()
        print(f"MCP Tools: {stats['mcp_tools_count']}")
        print(f"Memory Systems: {stats['memory_systems_count']}")
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
python3 -m pytest testing/mem0-integration-tests.py -v

# Run performance benchmarks
python3 testing/mem0-integration-tests.py --benchmark

# Test specific components
python3 -m pytest testing/mem0-integration-tests.py::TestMem0Integration::test_gpu_acceleration -v
```

## 🔒 Security & Multi-Tenancy

### API Key Management

All secrets are managed through 1Password integration:

```bash
# List required secrets
op item list --vault "MCP Servers"

# Inject secrets into environment
op run --env-file .env.mem0 -- python3 mcp-servers/mem0-server.py
```

### Tenant Isolation

Memory operations are automatically scoped by tenant:

```python
# Each user/app gets isolated memory space
memory_config = {
    "user_id": "tenant_123",
    "app_id": "my_app",
    "agent_id": "ai_assistant"
}
```

## 🚀 Production Deployment

### Docker Deployment

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  mem0-mcp:
    build: .
    environment:
      - MEM0_API_KEY=${MEM0_API_KEY}
      - PYTORCH_DEVICE=cuda:0
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### Kubernetes Deployment

```yaml
# k8s/mem0-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mem0-mcp
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: mem0-mcp
        image: mem0-ai-integration:latest
        resources:
          limits:
            nvidia.com/gpu: 1
        env:
        - name: MEM0_API_KEY
          valueFrom:
            secretKeyRef:
              name: mem0-secrets
              key: api-key
```

## 📚 Advanced Features

### Custom Memory Types

```python
# Graph memory for relationships
graph_memory = {
    "type": "graph",
    "nodes": ["user", "memory", "context"],
    "relationships": [
        {"from": "user", "to": "memory", "type": "owns"},
        {"from": "memory", "to": "context", "type": "belongs_to"}
    ]
}

# Multimodal memory
multimodal_memory = {
    "text": "Image description",
    "image_embedding": image_vector,
    "metadata": {"type": "multimodal"}
}
```

### Memory Expiration & Cleanup

```python
# Set memory expiration
expiring_memory = {
    "content": "Temporary information",
    "expiration_date": "2024-12-31",
    "cleanup_policy": "auto_delete"
}
```

### Advanced Retrieval

```python
# Criteria-based retrieval
criteria_search = {
    "query": "machine learning projects",
    "filters": {
        "importance": {"gte": 0.7},
        "created_at": {"gte": "2024-01-01"},
        "categories": ["research", "development"]
    },
    "rerank": True,
    "limit": 20
}
```

## 🤝 Contributing

1. **Code Style**: Follow Black formatting and type hints
2. **Testing**: Add tests for new features
3. **Documentation**: Update docs for API changes
4. **Performance**: Profile and optimize GPU usage

## 📄 License

This integration is part of the AI Agency Platform and follows the project's licensing terms.

## 🆘 Troubleshooting

### Common Issues

**GPU Not Detected:**
```bash
# Check CUDA installation
nvidia-smi
python3 -c "import torch; print(torch.cuda.is_available())"
```

**MCP Tools Not Connecting:**
```bash
# Check service health
curl http://localhost:3003/tools/list
# Verify API keys in .env.mem0
```

**Memory Operations Failing:**
```bash
# Check vector database status
docker-compose -f docker-compose.mem0.yml ps
# Verify Mem0 API key
curl -H "Authorization: Bearer $MEM0_API_KEY" https://api.mem0.ai/health
```

For additional support, check the logs or open an issue in the project repository.