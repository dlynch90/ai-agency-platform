Removed `packages/governance-cli` (custom Python CLI) and updated docs to reflect vendor-only governance tasks. Deleted legacy governance scripts/tests that referenced them. Files removed:
- `/Users/daniellynch/Developer/packages/governance-cli`
- `/Users/daniellynch/Developer/packages/governance/scripts/*.py`
- `/Users/daniellynch/Developer/tests/unit/test_governance_validate_dirs.py`
- `/Users/daniellynch/Developer/tests/unit/test_governance_validate_schemas.py`
- `/Users/daniellynch/Developer/tests/unit/test_governance_ssot.py`
- `/Users/daniellynch/Developer/tests/unit/test_governance_audit_ports.py`

Docs updated:
- `/Users/daniellynch/Developer/GAP_ANALYSIS_MODERNIZATION_V2.md` (removed governance-cli from package structure)
- `/Users/daniellynch/Developer/docs/GAP_ANALYSIS_20.md` (gap resolved note)

Governance validation now purely in `mise.toml` via POSIX shell (no Python wrappers).