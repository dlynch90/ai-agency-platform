# Architecture Overview

## ADR-Driven Architecture

This codebase follows Architecture Decision Records (ADR) methodology for all architectural decisions.

### Directory Structure

```
├── docs/adr/                    # Architecture Decision Records
│   ├── approved/               # Accepted ADRs
│   ├── proposed/              # Proposed ADRs
│   ├── rejected/              # Rejected ADRs
│   └── templates/             # ADR templates
├── domains/                    # Business domains
│   ├── ecommerce/             # E-commerce bounded context
│   ├── healthcare/            # Healthcare bounded context
│   └── ...                    # Other domains
├── shared-kernel/             # Cross-cutting concerns
├── infrastructure/            # Infrastructure layer
├── toolchains/                # Development toolchains
├── mcp/                       # Model Context Protocol
├── ai-ml/                     # AI/ML pipelines
├── events/                    # Event-driven architecture
├── api-gateway/               # API gateway & federation
├── testing/                   # Testing strategies
├── deployment/                # Deployment configurations
└── vendors/                   # Approved vendor integrations
```

### Key Architectural Decisions

#### ADR 001: Unified Toolchain Management
- **Decision**: Use Pixi as unified package/runtime/tool manager
- **Rationale**: Single source of truth, consistent environments
- **Impact**: All tools managed through pixi-unified-toolchain.toml

#### ADR 002: Domain-Driven Design
- **Decision**: Organize by business domains with clear boundaries
- **Rationale**: Separation of concerns, independent evolution
- **Impact**: Each domain has its own ADR, entities, services

#### ADR 003: Event-Driven Architecture
- **Decision**: Use events for inter-domain communication
- **Rationale**: Loose coupling, scalability
- **Impact**: Commands, events, queries in separate directories

#### ADR 004: MCP Integration
- **Decision**: Use Model Context Protocol for AI assistance
- **Rationale**: Standardized AI tool integration
- **Impact**: MCP servers for development assistance

### Technology Stack (ADR-Approved)

- **Package Manager**: Pixi (ADR 001)
- **Languages**: Python, TypeScript, GraphQL
- **Databases**: PostgreSQL, Neo4j, Redis
- **APIs**: GraphQL Federation, REST
- **AI/ML**: HuggingFace Transformers, LangChain
- **Infrastructure**: Docker, Kubernetes, Helm
- **Monitoring**: Prometheus, Grafana
- **Security**: Clerk, Supabase Auth

### Development Workflow

1. **ADR First**: All architectural changes start with ADR
2. **Domain Focus**: Changes scoped to specific business domains
3. **Test First**: All changes include comprehensive tests
4. **Review Required**: All changes reviewed against ADR compliance
5. **CI/CD**: Automated testing and deployment via ADR-approved pipelines

### Quality Gates

- **ADR Compliance**: All changes must align with accepted ADRs
- **Test Coverage**: 80%+ coverage for all domains
- **Performance**: Meet ADR-defined performance requirements
- **Security**: Pass ADR-approved security scans
- **Documentation**: All decisions documented in ADRs
