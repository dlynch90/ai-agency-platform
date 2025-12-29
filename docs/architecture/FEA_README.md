# FEA Environment with Pixi

Complete Finite Element Analysis environment built with Pixi package manager, featuring 20+ MCP servers for comprehensive research and automation.

## 🚀 Quick Start

```bash
# Start the complete FEA environment
pixi run start

# Or start with interactive shell
pixi run start --interactive

# Skip services if you don't want databases running
pixi run start --skip-services
```

## 📦 What's Included

### Core FEA Libraries
- **FEniCS/DOLFIN**: Finite element library for solving PDEs
- **deal.II**: C++ finite element library
- **MFEM**: Lightweight finite element methods
- **libMesh**: C++ FEM framework

### Meshing Tools
- **Gmsh**: 3D finite element mesh generator
- **TetGen**: Tetrahedral mesh generator
- **NetGen**: Automatic mesh generator

### Visualization & Post-processing
- **PyVista**: 3D plotting and mesh analysis
- **Mayavi**: 3D scientific visualization
- **ParaView**: Scientific visualization application

### Optimization & Design
- **Pyomo**: Optimization modeling language
- **NLopt**: Nonlinear optimization library
- **OpenMDAO**: Multidisciplinary design optimization

### Materials & Physics
- **PyMatGen**: Materials analysis library
- **ASE**: Atomic simulation environment
- **Spglib**: Crystal symmetry library

### Machine Learning Integration
- **Scikit-learn**: Machine learning algorithms
- **TensorFlow/PyTorch**: Deep learning frameworks
- **XGBoost/LightGBM**: Gradient boosting

### MCP Servers (20+)
- Sequential Thinking MCP: Structured analysis
- Ollama MCP: Local AI models
- File System MCP: File operations
- Git MCP: Version control
- Brave Search MCP: Web research
- GitHub MCP: Code exploration
- Task Master MCP: Project management
- Neo4j MCP: Graph database
- Qdrant MCP: Vector search
- And 11+ more specialized servers

## 🗄️ Services

The environment includes these services (via Docker):

- **Neo4j** (port 7687): Graph database for knowledge graphs
- **Qdrant** (port 6333): Vector database for semantic search
- **Redis** (port 6379): Caching and session management
- **PostgreSQL** (port 5432): Relational database
- **Elasticsearch** (port 9200): Search and analytics
- **Ollama** (port 11434): Local AI model server
- **JupyterHub** (port 8000): Collaborative development
- **MinIO** (port 9000): Object storage
- **pgAdmin** (port 5050): Database management

## 🎯 Available Commands

```bash
# Environment Management
pixi run start              # Start complete environment
pixi run setup-all          # Setup everything at once
pixi run teardown-all       # Stop all services

# MCP Server Management
pixi run init-mcp           # Initialize MCP servers
pixi run start-mcp          # Start MCP servers
pixi run stop-mcp           # Stop MCP servers
pixi run status-mcp         # Check MCP server status

# FEA Workflows
pixi run fea                # Test FEA library loading
pixi run mesh               # Run meshing operations
pixi run solve              # Execute FEA solver
pixi run visualize          # Run visualization tools
pixi run optimize           # Run optimization algorithms

# Research & Analysis
pixi run research           # Run feasibility analysis
pixi run sequential-think   # Structured thinking analysis
pixi run ollama-analyze     # AI-powered evaluation

# Service Management
pixi run start-neo4j        # Start Neo4j database
pixi run start-qdrant       # Start Qdrant vector DB
pixi run start-redis        # Start Redis cache
pixi run start-postgres     # Start PostgreSQL
pixi run start-services     # Start all services
pixi run stop-services      # Stop all services
```

## 🔧 Environment Activation

```bash
# Activate different FEA environments
pixi shell --environment fea-basic      # Basic FEA capabilities
pixi shell --environment fea-advanced   # ML-enhanced FEA
pixi shell --environment research       # Full research environment

# Or use the convenience commands
pixi run activate-fea-basic
pixi run activate-fea-advanced
pixi run activate-research
pixi run activate-full
```

## 🔐 Configuration

1. **API Keys**: Create `.env.mcp` file with your API keys:
   ```bash
   cp .env.mcp.template .env.mcp
   # Edit .env.mcp with your actual API keys
   ```

2. **Services**: Services are configured in `docker-compose.services.yml`

3. **MCP Servers**: MCP configuration is in `mcp-config.toml`

## 📊 Monitoring & Analysis

```bash
# Run feasibility check
pixi run research

# View environment summary
cat docs/environment_summary.json

# Check service status
pixi run status-mcp
docker-compose -f docker-compose.services.yml ps
```

## 🏗️ Architecture

The environment uses a multi-layered architecture:

1. **Pixi Layer**: Package management and environment isolation
2. **FEA Core**: Scientific computing and simulation libraries
3. **MCP Layer**: 20+ model context protocol servers for automation
4. **Service Layer**: Databases and supporting services
5. **Integration Layer**: APIs and communication between components

## 🔬 FEA Capabilities

### Structural Analysis
- Linear/nonlinear static analysis
- Dynamic analysis (modal, transient)
- Buckling and stability analysis

### Thermal Analysis
- Steady-state heat transfer
- Transient thermal analysis
- Conjugate heat transfer

### Fluid Dynamics
- Incompressible/compressible flow
- Turbulent flow modeling
- Multiphase flow

### Multi-physics
- Fluid-structure interaction
- Thermo-mechanical coupling
- Electro-magnetic analysis

### Optimization
- Topology optimization
- Shape optimization
- Material optimization

## 🤖 AI/ML Integration

- **Model Training**: Use TensorFlow/PyTorch for surrogate models
- **Data Analysis**: Scikit-learn for pattern recognition
- **Optimization**: ML-enhanced design optimization
- **Research**: MCP servers for automated literature review
- **Automation**: AI-powered workflow orchestration

## 📚 Documentation

- `docs/reports/feasibility_report.json`: Environment readiness assessment
- `docs/environment_summary.json`: Current environment status
- `mcp-config.toml`: MCP server configuration
- `pixi-workspace.toml`: Advanced workspace configuration

## 🚨 Troubleshooting

### Common Issues

1. **Services not starting**: Check Docker is running
2. **MCP servers failing**: Check Node.js and npm installation
3. **Import errors**: Run `pixi install` to install dependencies
4. **Performance issues**: Check available RAM and CPU

### Logs and Debugging

```bash
# View service logs
docker-compose -f docker-compose.services.yml logs

# View MCP server logs
tail -f logs/mcp_*.log

# Check Pixi environment
pixi info

# Run diagnostics
pixi run research
```

## 🔄 Updates and Maintenance

```bash
# Update Pixi itself
pixi self-update

# Update environment dependencies
pixi update

# Update services
docker-compose -f docker-compose.services.yml pull

# Rebuild MCP servers
pixi run init-mcp
```

## 🤝 Contributing

This environment is designed to be extensible. To add new FEA capabilities:

1. Add dependencies to `pixi.toml`
2. Create analysis scripts in `scripts/`
3. Add MCP server configurations
4. Update documentation

## 📄 License

This FEA environment configuration is provided as-is for research and development purposes.

---

**Built with ❤️ using Pixi, MCP, and modern scientific computing tools**