Removed additional custom scripts outside governance in `/Users/daniellynch/Developer` to align with vendor-only policy:

Deleted custom scripts:
- `validate_services.py`
- `_Audit/ml-environment/main.py`
- `_Audit/ml-environment/classify_files.py`
- `_Audit/ml-environment/pyproject.toml`
- `_Audit/ml-environment/README.md`
- `archive/scripts/deduplication_audit.py`
- `archive/scripts/debug_audit.py`
- `archive/scripts/system_diagnostics.py`
- `archive/scripts/install-mcp-servers.sh`
- `docs/archive/root-migration-20251218/custom-scripts/deduplication_audit.py`
- `docs/archive/root-migration-20251218/custom-scripts/system_diagnostics.py`
- `docs/shell-remediation/patterns/detect-antipatterns.sh`
- `scripts/janitor.sh`
- `test-python/main.py`

Notes:
- These files had no code references (only historical mention in `docs/reports/reality_check_report.json` for `validate_services.py`).
- Directories now empty: `_Audit/ml-environment/`, `archive/scripts/`, `docs/archive/root-migration-20251218/custom-scripts/`, `docs/shell-remediation/patterns/` (left in place).