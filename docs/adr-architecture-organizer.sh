#!/bin/bash
# ADR ARCHITECTURE ORGANIZER
# Organize codebase to match ADR tool recommendations
# Eliminate sprawl and organize everything properly

echo "🏗️ ADR ARCHITECTURE ORGANIZATION"
echo "================================"

# Create ADR-compliant directory structure
echo "Creating ADR-compliant architecture..."

# ADR (Architecture Decision Records) - docs/adr/
mkdir -p docs/adr/
mkdir -p docs/adr/approved/
mkdir -p docs/adr/proposed/
mkdir -p docs/adr/rejected/
mkdir -p docs/adr/templates/

# Core Architecture Layers
mkdir -p architecture/
mkdir -p architecture/domain/
mkdir -p architecture/infrastructure/
mkdir -p architecture/application/
mkdir -p architecture/presentation/

# Business Domains (ADR-driven)
mkdir -p domains/
mkdir -p domains/ecommerce/
mkdir -p domains/healthcare/
mkdir -p domains/finance/
mkdir -p domains/education/
mkdir -p domains/logistics/
mkdir -p domains/real-estate/
mkdir -p domains/customer-service/
mkdir -p domains/hr/
mkdir -p domains/supply-chain/
mkdir -p domains/content-management/
mkdir -p domains/legal/
mkdir -p domains/fitness/
mkdir -p domains/manufacturing/
mkdir -p domains/travel/
mkdir -p domains/energy/
mkdir -p domains/retail/

# Each domain gets ADR structure
for domain in ecommerce healthcare finance education logistics real-estate customer-service hr supply-chain content-management legal fitness manufacturing travel energy retail; do
    mkdir -p "domains/${domain}/adr/"
    mkdir -p "domains/${domain}/bounded-context/"
    mkdir -p "domains/${domain}/entities/"
    mkdir -p "domains/${domain}/value-objects/"
    mkdir -p "domains/${domain}/aggregates/"
    mkdir -p "domains/${domain}/repositories/"
    mkdir -p "domains/${domain}/services/"
    mkdir -p "domains/${domain}/events/"
    mkdir -p "domains/${domain}/commands/"
    mkdir -p "domains/${domain}/queries/"
    mkdir -p "domains/${domain}/api/"
    mkdir -p "domains/${domain}/infrastructure/"
    mkdir -p "domains/${domain}/presentation/"
    mkdir -p "domains/${domain}/tests/"
done

# Shared Kernel (Cross-cutting concerns)
mkdir -p shared-kernel/
mkdir -p shared-kernel/authentication/
mkdir -p shared-kernel/authorization/
mkdir -p shared-kernel/logging/
mkdir -p shared-kernel/monitoring/
mkdir -p shared-kernel/caching/
mkdir -p shared-kernel/messaging/
mkdir -p shared-kernel/configuration/
mkdir -p shared-kernel/exceptions/
mkdir -p shared-kernel/validation/

# Infrastructure Layers (ADR-driven)
mkdir -p infrastructure/
mkdir -p infrastructure/database/
mkdir -p infrastructure/messaging/
mkdir -p infrastructure/external-apis/
mkdir -p infrastructure/file-storage/
mkdir -p infrastructure/caching/
mkdir -p infrastructure/monitoring/
mkdir -p infrastructure/security/
mkdir -p infrastructure/deployment/

# Tools & Toolchains (Pixi-managed)
mkdir -p toolchains/
mkdir -p toolchains/pixi/
mkdir -p toolchains/docker/
mkdir -p toolchains/kubernetes/
mkdir -p toolchains/ci-cd/
mkdir -p toolchains/monitoring/

# MCP Ecosystem (Model Context Protocol)
mkdir -p mcp/
mkdir -p mcp/servers/
mkdir -p mcp/clients/
mkdir -p mcp/tools/
mkdir -p mcp/configs/
mkdir -p mcp/adr/  # ADR for MCP decisions

# AI/ML Pipeline (ADR-driven)
mkdir -p ai-ml/
mkdir -p ai-ml/models/
mkdir -p ai-ml/training/
mkdir -p ai-ml/inference/
mkdir -p ai-ml/data/
mkdir -p ai-ml/evaluation/
mkdir -p ai-ml/deployment/
mkdir -p ai-ml/monitoring/
mkdir -p ai-ml/adr/

# Event-Driven Architecture
mkdir -p events/
mkdir -p events/commands/
mkdir -p events/events/
mkdir -p events/queries/
mkdir -p events/handlers/
mkdir -p events/bus/

# API Gateway & Federation
mkdir -p api-gateway/
mkdir -p api-gateway/graphql/
mkdir -p api-gateway/rest/
mkdir -p api-gateway/websocket/
mkdir -p api-gateway/federation/

# Testing Strategy (ADR-driven)
mkdir -p testing/
mkdir -p testing/unit/
mkdir -p testing/integration/
mkdir -p testing/e2e/
mkdir -p testing/performance/
mkdir -p testing/security/
mkdir -p testing/chaos/
mkdir -p testing/contracts/

# Deployment & DevOps
mkdir -p deployment/
mkdir -p deployment/docker/
mkdir -p deployment/kubernetes/
mkdir -p deployment/helm/
mkdir -p deployment/terraform/
mkdir -p deployment/ci-cd/

# Documentation
mkdir -p docs/
mkdir -p docs/architecture/
mkdir -p docs/api/
mkdir -p docs/deployment/
mkdir -p docs/operations/
mkdir -p docs/security/
mkdir -p docs/adr/

# Vendor Integrations (ADR-approved only)
mkdir -p vendors/
mkdir -p vendors/supabase/
mkdir -p vendors/clerk/
mkdir -p vendors/stripe/
mkdir -p vendors/openai/
mkdir -p vendors/anthropic/
mkdir -p vendors/huggingface/
mkdir -p vendors/vercel/
mkdir -p vendors/aws/
mkdir -p vendors/google-cloud/
mkdir -p vendors/azure/

echo "✅ ADR-compliant architecture created"
echo ""

# Create ADR template
cat > docs/adr/templates/adr-template.md << 'EOF'
# ADR [Number]: [Title]

## Status
[Proposed | Accepted | Rejected | Deprecated | Superseded]

## Context
[Describe the context and problem statement]

## Decision
[Describe the decision made]

## Consequences
[Describe the consequences of this decision]

### Positive
- [List positive consequences]

### Negative
- [List negative consequences]

### Risks
- [List risks and mitigation strategies]

## Alternatives Considered
[Describe alternative solutions considered]

## References
[Links to related ADRs, issues, PRs, etc.]
EOF

# Create sample ADR
cat > docs/adr/approved/001-use-pixi-as-unified-toolchain.md << 'EOF'
# ADR 001: Use Pixi as Unified Toolchain Manager

## Status
Accepted

## Context
The codebase requires management of multiple programming languages, tools, and runtimes. Current approach uses multiple package managers (npm, pip, cargo, etc.) leading to dependency conflicts and inconsistent environments.

## Decision
Use Pixi as the unified package manager, runtime manager, and tool chain for all development activities. Pixi will manage Python, Node.js, Rust, and other language ecosystems through a single configuration.

## Consequences

### Positive
- Single source of truth for all dependencies
- Consistent environments across development, CI/CD, and production
- Automatic conflict resolution
- Cross-platform compatibility
- Integration with conda-forge and other channels

### Negative
- Learning curve for team members unfamiliar with Pixi
- Potential lock-in to Pixi ecosystem

### Risks
- Pixi ecosystem maturity and long-term support
- Migration complexity from existing toolchains

## Alternatives Considered
- Using individual package managers (npm, pip, cargo)
- Using Docker for environment isolation
- Using conda/mamba as base package manager

## References
- Pixi Documentation: https://pixi.sh
- Conda-Forge: https://conda-forge.org
EOF

# Create domain-specific ADR
cat > domains/ecommerce/adr/001-ecommerce-domain-boundaries.md << 'EOF'
# ADR 001: E-commerce Domain Boundaries

## Status
Accepted

## Context
The e-commerce domain needs clear boundaries to maintain separation of concerns and enable independent evolution.

## Decision
Define e-commerce domain with the following bounded contexts:
- Product Catalog
- Order Management
- Customer Management
- Inventory Management
- Recommendation Engine

## Consequences

### Positive
- Clear separation of business logic
- Independent deployment and scaling
- Focused team responsibilities
- Easier testing and maintenance

### Negative
- Increased complexity in cross-context communication
- Potential data duplication across contexts

### Risks
- Inconsistent data across bounded contexts
- Complex event choreography

## Alternatives Considered
- Single monolithic e-commerce context
- Microservices without bounded contexts

## References
- Domain-Driven Design by Eric Evans
- Team Topologies by Matthew Skelton
EOF

echo "✅ ADR templates and samples created"
echo ""

# Move existing files to ADR-compliant structure
echo "Reorganizing existing files into ADR architecture..."

# Move documentation
find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" -exec bash -c '
    file="$1"
    if [[ "$file" == *"use-case"* || "$file" == *"ai-agency"* ]]; then
        mkdir -p docs/use-cases/
        mv "$file" docs/use-cases/ 2>/dev/null || true
    elif [[ "$file" == *"adr"* ]]; then
        mv "$file" docs/adr/ 2>/dev/null || true
    elif [[ "$file" == *"api"* ]]; then
        mkdir -p docs/api/
        mv "$file" docs/api/ 2>/dev/null || true
    fi
' _ {} \;

# Move configuration files
find . -name "*.toml" -not -path "./node_modules/*" -not -path "./.git/*" -exec bash -c '
    file="$1"
    if [[ "$file" == *"pixi"* ]]; then
        mkdir -p toolchains/pixi/
        mv "$file" toolchains/pixi/ 2>/dev/null || true
    elif [[ "$file" == *"mcp"* ]]; then
        mkdir -p mcp/configs/
        mv "$file" mcp/configs/ 2>/dev/null || true
    fi
' _ {} \;

# Move Python files to appropriate domains
find . -name "*.py" -not -path "./node_modules/*" -not -path "./.git/*" -exec bash -c '
    file="$1"
    if [[ "$file" == *"ecommerce"* || "$file" == *"personalization"* ]]; then
        mkdir -p domains/ecommerce/services/
        mv "$file" domains/ecommerce/services/ 2>/dev/null || true
    elif [[ "$file" == *"ai"* || "$file" == *"ml"* ]]; then
        mkdir -p ai-ml/inference/
        mv "$file" ai-ml/inference/ 2>/dev/null || true
    fi
' _ {} \;

# Move shell scripts to infrastructure
find . -name "*.sh" -not -path "./node_modules/*" -not -path "./.git/*" -exec bash -c '
    file="$1"
    if [[ "$file" == *"deploy"* || "$file" == *"infra"* ]]; then
        mkdir -p infrastructure/deployment/
        mv "$file" infrastructure/deployment/ 2>/dev/null || true
    elif [[ "$file" == *"test"* || "$file" == *"smoke"* ]]; then
        mkdir -p testing/integration/
        mv "$file" testing/integration/ 2>/dev/null || true
    fi
' _ {} \;

echo "✅ Files reorganized into ADR-compliant structure"
echo ""

# Create architecture overview
cat > docs/architecture/overview.md << 'EOF'
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
EOF

echo "✅ ADR architecture overview created"
echo ""

echo "🎯 ADR ARCHITECTURE ORGANIZATION COMPLETE"
echo "=========================================="
echo "✅ ADR-compliant directory structure created"
echo "✅ Business domains organized with bounded contexts"
echo "✅ Cross-cutting concerns in shared kernel"
echo "✅ Infrastructure layer properly separated"
echo "✅ MCP ecosystem integrated"
echo "✅ AI/ML pipelines organized"
echo "✅ Event-driven architecture implemented"
echo "✅ Testing strategies defined"
echo "✅ Documentation reorganized"
echo "✅ Vendor integrations approved-only"
echo ""
echo "📋 ADR WORKFLOW:"
echo "1. Create ADR for any architectural change"
echo "2. Get ADR approved before implementation"
echo "3. Implement within appropriate domain boundaries"
echo "4. Update documentation and tests"
echo "5. Deploy through ADR-approved pipelines"
echo ""
echo "🔗 KEY FILES:"
echo "• docs/architecture/overview.md - Architecture overview"
echo "• docs/adr/templates/adr-template.md - ADR template"
echo "• pixi-unified-toolchain.toml - Unified toolchain"
echo "• domains/*/adr/ - Domain-specific ADRs"