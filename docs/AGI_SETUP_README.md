# AGI Development Environment Setup

This environment provides a comprehensive AGI-powered development setup with polyglot programming support, MCP server integration, and automated orchestration.

## Quick Start

1. **Load environment variables:**
   ```bash
   # Edit .env file with your API keys
   nano .env
   ```

2. **Start the AGI environment:**
   ```bash
   just agi-start
   ```

3. **Run AGI tasks:**
   ```bash
   just agi-task "Design a microservices architecture for FEA analysis"
   ```

## Available Commands

### Environment Management
- `just setup-dev` - Setup all development environments
- `just dev-fea` - FEA development
- `just dev-java` - Java enterprise development
- `just dev-node` - Node.js development
- `just dev-ros2` - ROS2 robotics development

### AGI Automation
- `just agi-start` - Start AGI environment
- `just agi-stop` - Stop AGI environment
- `just agi-status` - Check AGI status
- `just agi-task "task description"` - Run AGI task

### Environment Switching
- `./scripts/env-select.sh fea` - Switch to FEA environment
- `./scripts/env-select.sh java` - Switch to Java environment
- `./scripts/env-select.sh nodejs` - Switch to Node.js environment

### Validation & Testing
- `just validate-all` - Comprehensive system validation
- `just quality` - Run all linters and tests
- `./scripts/test-api-connectivity.sh` - Test API connectivity

## MCP Servers

The environment includes 10 essential MCP servers:

1. **sequential-thinking** - Structured analysis
2. **filesystem** - File operations
3. **git** - Version control
4. **github** - Code exploration
5. **sqlite** - Local data analysis
6. **ollama** - Local AI models
7. **anthropic** - Claude integration
8. **postgres** - Database operations
9. **neo4j** - Graph database
10. **task-master** - Project management

## API Endpoints

- **GraphQL API**: Unified data access at `/graphql`
- **AGI Orchestrator**: Task automation at `scripts/agi/agi-orchestrator.py`
- **Environment API**: Environment management via REST endpoints

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MCP Servers   │◄──►│ AGI Orchestrator│◄──►│   Development   │
│                 │    │                 │    │   Environments  │
│ • Sequential    │    │ • Task Analysis │    │                 │
│ • File System   │    │ • Agent Coord.  │    │ • Python/FEA    │
│ • Git/GitHub    │    │ • Result Synth. │    │ • Java/Spring   │
│ • AI Models     │    │                 │    │ • Node.js/React │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  GraphQL API   │
                    │                 │
                    │ • Unified Data  │
                    │ • Real-time     │
                    │ • Schema-driven│
                    └─────────────────┘
```

## Configuration

### Environment Variables
Edit `.env` file with your API keys and service URLs.

### Tool Versions
Managed by `.mise.toml` - modify for different tool versions.

### MCP Servers
Configured in `mcp-config.toml` - add or modify servers as needed.

## Troubleshooting

1. **MCP servers not working**: Check `.env` file has correct API keys
2. **Environment switching fails**: Run `mise trust .mise.toml`
3. **AGI orchestrator not responding**: Check Python dependencies
4. **API connectivity issues**: Run `./scripts/test-api-connectivity.sh`

## Development Workflow

1. **Setup**: `just agi-start`
2. **Develop**: Use environment-specific commands (`just dev-*`)
3. **Test**: `just quality`
4. **Deploy**: Use infrastructure tools via MCP servers
5. **Monitor**: `just agi-status`

## Scaling to Full AGI

The environment is designed to scale to full AGI automation through:

- **Multi-agent orchestration** via AGI orchestrator
- **MCP server federation** for distributed computing
- **GraphQL federation** for unified data access
- **Event-driven architecture** for real-time coordination
- **Machine learning pipelines** for continuous optimization

Start small, scale up as needed!
