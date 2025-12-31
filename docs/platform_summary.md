## Obot Platform Architecture Summary

**Technology Stack:**
- Backend: Go 1.25.5 with Kubernetes controller-runtime
- Frontend: Svelte 5.45.6 + SvelteKit 2.49.2
- Database: PostgreSQL with GORM + pgvector
- MCP SDK: github.com/modelcontextprotocol/go-sdk v0.2.0
- Observability: OpenTelemetry

**Key Architecture Patterns:**
- 429 Go source files, 60+ Kubernetes CRDs
- Dual storage: K8s CRDs + PostgreSQL gateway
- 750+ REST API routes (no versioning)
- Controller-runtime reconciliation loops

**Critical Issues Identified:**
1. Debug instrumentation left in production code (server.go, +page.svelte)
2. Services struct is God Object with 40+ dependencies
3. No API versioning strategy
4. Panic usage in PostStart initialization
5. No transaction boundaries between K8s and PostgreSQL stores
6. 22 test files for 429 source files (5% coverage)

**ADRs Proposed:**
- ADR-001: Introduce Service Layer (DDD)
- ADR-002: Implement API Versioning
- ADR-003: Add OPA for Authorization
- ADR-004: Saga Pattern for Cross-Store Ops
- ADR-005: XState for Frontend State
- ADR-006: MCP Resilience Patterns

**MCP Package Location:** /Users/daniellynch/Projects/obot/pkg/mcp/
- Files: backend.go, client.go, docker.go, kubernetes.go, loader.go, runner.go, tools.go, types.go