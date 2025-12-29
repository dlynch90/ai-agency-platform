Removed legacy governance Python scripts and tests; replaced governance tasks with vendor-only shell logic in `/Users/daniellynch/Developer/mise.toml`.

Key task changes:
- `validate.dirs` now parses `shared/configs/governance/dirs.toml` via `awk` and checks required/optional dirs.
- `validate.schemas` now parses `shared/configs/governance/schemas.toml` via `awk` and validates JSON schema/instances with `jq` (optional `check-jsonschema` if installed).
- `validate.symlinks` uses `find . -xtype l`.
- `audit.binaries` uses `fd` + `file` + `rg` to list executables.
- `audit.reality` runs `mise doctor` + `docker ps`.
- `governance.fix.headers` is now a no-op; `governance.fix` no longer calls it.

Removed files:
- `/Users/daniellynch/Developer/packages/governance/scripts/audit_ports.py`
- `/Users/daniellynch/Developer/packages/governance/scripts/fix_headers.py`
- `/Users/daniellynch/Developer/packages/governance/scripts/ssot.py`
- `/Users/daniellynch/Developer/packages/governance/scripts/validate_dirs.py`
- `/Users/daniellynch/Developer/packages/governance/scripts/validate_schemas.py`
- `/Users/daniellynch/Developer/packages/governance/scripts/validate_secrets.py`
- `/Users/daniellynch/Developer/packages/governance/scripts/validate_symlinks.py`
- `/Users/daniellynch/Developer/tests/unit/test_governance_validate_dirs.py`
- `/Users/daniellynch/Developer/tests/unit/test_governance_validate_schemas.py`
- `/Users/daniellynch/Developer/tests/unit/test_governance_ssot.py`
- `/Users/daniellynch/Developer/tests/unit/test_governance_audit_ports.py`

Docs updated:
- `/Users/daniellynch/Developer/shared/configs/governance/dirs.toml`
- `/Users/daniellynch/Developer/shared/configs/governance/schemas.toml`
- `/Users/daniellynch/Developer/docs/GAP_ANALYSIS_SECRETS_MCP_V3.md`

Note: `mise run validate.schemas` triggered a `node@22.12.0` install and emitted warnings about node not found in mise tool registry, but completed validation.