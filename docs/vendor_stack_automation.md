User selected vendor stack constraints for /Users/daniellynch/Developer: Datadog + Prisma Cloud + Supabase (incl Auth) + Node.js/Next.js + Turborepo + Lefthook. New plan emphasizes eliminating ad-hoc custom tooling code/scripts (.sh/.py) by replacing with vendor capabilities + official templates/boilerplates, standardizing task orchestration (turbo + Taskfile/just/make wrappers), enforcing anti-sprawl via GitHub rulesets + CI checks + lefthook, and auditing/isolating an existing dedicated AI/ML Python environment for reproducible scale-up/tear-down.

Key plan decisions captured:
- Prefer vendor ML/analytics (Datadog Watchdog/anomaly detection + Prisma risk scoring) for "global evaluation with machine learning" to avoid bespoke ML code.
- Use Supabase as control-plane datastore for audit artifacts (optional) and Auth for app; Next.js integrates via official Supabase templates.
- Use Turborepo as single build graph: `turbo run build|lint|typecheck|test|check` with remote caching; treat warnings as errors gradually.
- Replace scattered scripts with centralized, vendor/template-derived automation: GitHub Actions + lefthook; no standalone repo `.sh`/`.py` utilities.
- Provide a 20-step gap analysis checklist spanning observability, security/compliance, build hygiene, portability, DR/rollback, performance, integrations, and docs; include scale-up/tear-down and rebuild-from-scratch validation.

MCP utilization target: plan references using >=20 MCP servers (filesystem/git/github/octocode/docker/kubernetes/postgres/redis/supabase via postgres tool if applicable/notion/linear/memory/byterover/time + web intelligence tools firecrawl/tavily/exa/jina/fetch/brave-search/context7) for global evaluation and automation workflows.