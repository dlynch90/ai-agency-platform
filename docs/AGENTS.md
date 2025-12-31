# AI Agency Platform (Monorepo) — Agent Notes

## Scope
- This file applies to the entire repo unless overridden by a nested `AGENTS.md`.

## Module Map
- `apps/`: runnable apps (e.g. `apps/graphql-federation-app`, `apps/github-repo-browser`)
- `packages/`: shared libraries (e.g. `packages/database`, `packages/types`, `packages/db`)
- `services/`: deployable services/templates (e.g. `services/graphql-api`, `services/nextjs-app`)
- `tools/`: internal tooling + automation (e.g. `tools/health-analyzer`, `tools/vendor-orchestrator`)
- `configs/`: repo SSOT configuration (`configs/vendor-tool-manager.json`, `configs/promptfoo/**`)
- `tests/`: root-level meta tests (vendor compliance, integration smoke)
- `scripts/`: repo debugging/validation runners (treat as utilities; not all are typechecked)

## TDD Pipeline
- Pipeline definition (documentation): `pipelines/tdd.pipeline.xml`
- Local TDD loop runner: `pnpm tdd:loop --until-pass -n 3`
- Vendor compliance tests: `pnpm test:vendor-compliance`
- Integration smoke tests: `pnpm test:integration:root`

## Vendor Validation
- Tool validation report: `pnpm validate:tools` → `vendor-tool-validation-report.json`
- MCP config validation report: `pnpm validate:mcp` → `mcp-server-validation-report.json`

<codex><skills>
1) agents-md — maintain scoped agent guidance (this file + nested `AGENTS.md` where needed)
2) ai-agency-repo-setup — pnpm/Turbo workflows (`pnpm install`, `pnpm dev`, `pnpm build`)
3) ai-agency-testing — run/triage unit/integration/e2e (`pnpm test:*`)
4) ai-agency-debugging — use `scripts/*debug*` and `scripts/validation-runner.js`
5) ai-agency-performance — use `pnpm turbo run <task> --summarize` and filtered runs
6) ai-agency-mcp-integration — validate MCP configs + server connectivity
7) bug-triage — reproduce → isolate → minimal fix → verify
8) coding-guidelines-verify — verify changed-file scopes vs nearest `AGENTS.md`
9) docs-sync — keep docs/runbooks in sync with behavior changes
10) regex-builder — craft/verify repo-wide search patterns safely
</codex><skills>

