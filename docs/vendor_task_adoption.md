Continued vendor-only cleanup by removing local template directories and replacing script/template references with vendor tasks in docs.

Deleted local templates:
- `_Governance/golden-template/`
- `_Governance/node-ts-template/`
- `_Governance/templates/`
- `packages/templates/ai-agent/`
- `packages/templates/uv-python/`
- `packages/templates/github-workflows/`

Docs updated to remove local template/script references and point to vendor tasks:
- `docs/hive-mind-coordination/CODEBASE-HEALING-PLAN.md`: removed _Governance template references; vendor-only templates.
- `docs/SHELL-OPTIMIZATION-QUICKSTART.md`: removed local scripts/templates; replaced with vendor setup guidance and vendor monitoring.
- `docs/SERVICE-STARTUP-AND-OPTIMIZATION-PLAN.md`: removed custom start/health scripts; use `mise run infra.*` tasks.
- `REPOSITORY-AUDIT-REPORT.md`: updated template guidance to vendor-only.
- `QUICK_START.md`: replaced script references with `mise run repo.check`/pnpm tasks.
- `docs/reports/MASTER_SUMMARY.txt`: replaced script references with vendor tasks.
- `VENDOR_SOLUTIONS_ANALYSIS.md`: marked removal of custom scripts as complete.
- `_Context/GAP_ANALYSIS_20_STEPS.md`: removed `_Audit/` and `_Governance/` from structure.

Key vendor task replacements:
- `mise run repo.check` for repo health checks
- `mise run infra.start-all`, `mise run infra.health-check`, `mise run infra.logs`, `mise run infra.stop-all` for service management