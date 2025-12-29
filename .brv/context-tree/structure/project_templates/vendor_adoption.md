Removed remaining custom templates/hooks and replaced with vendor-template references (no local post-gen scripts).

Deletions:
- `_Audit/ml-environment/` (entire dir; leftover `.python-version`/`.cache`)
- `archive/scripts/` (entire dir)
- `docs/archive/root-migration-20251218/` (entire dir)
- `docs/shell-remediation/patterns/` (entire dir)
- `scripts/` (entire dir)
- `test-python/` (entire dir)
- `_Governance/python-ai-template/` (entire dir)
- `apps/api/hooks/post_gen_project.py`
- `apps/api/.copier/update_dotenv.py`

Config/docs updates for vendor templates:
- `apps/api/copier.yml`: removed `_tasks` hook block that executed `.copier/update_dotenv.py`.
- `apps/api/README.md`: removed `--trust` from Copier commands; note now states no post-creation scripts and to use vendor tooling (e.g., 1Password CLI) for secrets.
- `docs/TECHNICAL-DEBT-AUDIT-2025-12-17.md`: removed python-ai-template venv references and cleanup command; vendor source note now mentions `uv init` for vendor-owned templates.
- `docs/hive-mind-coordination/CODEBASE-HEALING-PLAN.md`: removed python-ai-template lefthook template references; added vendor template source note (Lefthook official examples).