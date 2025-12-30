# Gap Analysis & Decomposition Report
**Date:** 2025-12-29
**Status:** Post-SSOT Standardization Audit

---

## Executive Summary

After completing the SSOT standardization implementation, this gap analysis identifies remaining issues requiring attention. The analysis is decomposed into Priority Tiers (P0-P3) based on impact and urgency.

---

## Gap Categories

### 1. Hardcoded Paths (50 files remaining)

**Critical (P0):**
| File | Issue | Fix |
|------|-------|-----|
| `testing/integration/test-mcp-servers.js` | Hardcoded user path | Replace with `process.env.HOME` |
| `testing/functional-tests.js` | Hardcoded user path | Replace with `process.env.HOME` |
| `hooks/gibson-persistence.sh` | Hardcoded user path | Replace with `${HOME}` |
| `configs/mcp/mcp.json` | Hardcoded user path | Use templating or env vars |

**Documentation (P2):**
- 30+ files in `.brv/context-tree/` - Historical context, can remain
- 15+ files in `docs/` - Reports and ADRs, can remain
- `tools/python/*.py` - Already fixed in scripts/, these are duplicates

### 2. Prisma Schema Duplication (5 schemas)

**Analysis:**
| Location | Purpose | Action |
|----------|---------|--------|
| `prisma/schema.prisma` | Root (empty dir) | DELETE - orphaned |
| `database/prisma/schema.prisma` | Primary database | KEEP as SSOT |
| `database-integration/prisma/schema.prisma` | Integration tests | SYMLINK to database/ |
| `api-smoke-tests/prisma/schema.prisma` | Smoke tests | SYMLINK to database/ |
| `prisma-project/schema.prisma` | Unknown purpose | AUDIT and DELETE if unused |

### 3. Hardcoded Ports (30+ files)

**SSOT Violations:**
Services should reference chezmoidata.toml ports:
- Qdrant: 6333
- Neo4j: 7687 (bolt), 7474 (http)
- Redis: 6379
- Postgres: 5432
- Ollama: 11434

**Files to Template:**
- `packages/config/src/index.ts` - Port constants
- `database/infrastructure/redis/redis-cache.config.ts`
- `database/infrastructure/neo4j/neo4j-graph.config.ts`
- `database-integration/config.ts`

### 4. Docker Compose Proliferation (10+ files)

**Found:**
```
./infra/docker-compose.services.yml      # Core services
./infra/docker-compose.development.yml   # Dev override
./infra/docker-compose.production.yml    # Prod override
./infra/docker/docker-compose.proxy.yml  # Proxy config
./temporal/docker-compose.yml            # Temporal services
./polyglot-integration/docker-compose.yml # Polyglot services
./domains/use-cases/*/docker-compose.yml  # 6+ domain-specific
```

**Recommendation:** Consolidate to:
- `infra/docker-compose.base.yml` - Shared services
- `infra/docker-compose.override.yml` - Local dev
- Domain-specific files can extend base

### 5. Package.json Sprawl (45 files)

**Analysis:**
- Root: `ai-agency-platform` v1.0.0
- Workspace packages in `packages/`, `apps/`
- Domain use-cases with separate package.json
- Legacy/orphan package.json files

**Action:** Audit for orphaned packages not in pnpm-workspace.yaml

### 6. TypeScript Configuration (3 files)

**Status:** Acceptable - base + project-specific overrides

---

## Decomposition: Priority Tasks

### P0 - Critical (Fix Immediately)

```
[ ] Fix 4 critical hardcoded path files
    - testing/integration/test-mcp-servers.js
    - testing/functional-tests.js
    - hooks/gibson-persistence.sh
    - configs/mcp/mcp.json

[ ] Delete orphaned prisma/ directory (empty)
```

### P1 - High (Fix This Week)

```
[ ] Consolidate Prisma schemas
    - Designate database/prisma/schema.prisma as SSOT
    - Create symlinks from other locations
    - Delete prisma-project/ if unused

[ ] Create port configuration SSOT
    - packages/config/src/ports.ts with env var fallbacks
    - Update all hardcoded port references

[ ] Fix remaining tools/python/*.py hardcoded paths
```

### P2 - Medium (Fix This Month)

```
[ ] Consolidate Docker Compose files
    - Create base compose with shared services
    - Domain composes extend base

[ ] Audit 45 package.json files
    - Identify orphaned packages
    - Ensure all in pnpm-workspace.yaml

[ ] Template configs/mcp/*.json with chezmoi
```

### P3 - Low (Backlog)

```
[ ] Update .brv/context-tree documentation
    - Historical paths acceptable but could be templated

[ ] Review domain use-cases for standardization
    - Each has own docker-compose, package.json
    - Consider monorepo workspace pattern
```

---

## Metrics

| Category | Before SSOT | After SSOT | Remaining |
|----------|-------------|------------|-----------|
| Hardcoded paths (scripts) | 49 | 0 | 0 |
| Hardcoded paths (total) | 100+ | 50 | 4 critical |
| Virtual environments | 2 (ml-venv, pixi) | 1 (pixi) | 0 |
| mem0ai versions | 2 | 1 | 0 |
| Prisma schemas | 5+ | 5 | Need consolidation |
| Docker Compose files | 10+ | 10+ | Need consolidation |

---

## Next Actions

1. **Immediate:** Fix 4 critical hardcoded path files
2. **Today:** Delete orphaned prisma/ directory
3. **This Week:** Consolidate Prisma schemas to single SSOT
4. **This Week:** Create centralized port configuration
5. **Ongoing:** Template remaining config files with chezmoi

---

## Technical Debt Score

| Area | Score (1-10) | Notes |
|------|--------------|-------|
| Path SSOT | 8/10 | Scripts fixed, docs/tools remain |
| Version Management | 9/10 | mise + pixi unified |
| Secrets Management | 9/10 | 1Password refs throughout |
| Schema SSOT | 4/10 | Multiple Prisma schemas |
| Config SSOT | 6/10 | Ports still hardcoded |
| Docker SSOT | 5/10 | Proliferation of compose files |

**Overall:** 6.8/10 - Significant improvement, consolidation needed

