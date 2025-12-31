In `obot`, `.gitignore` was adjusted to implement a clear Cursor policy: ignore local Cursor artifacts while keeping `.cursor/rules/**` committable.

Key patterns used:
```gitignore
# Cursor (ignore local artifacts; keep rules committable)
/.cursor/**
!/.cursor/
/.cursor/debug.log
!/.cursor/rules/
!/.cursor/rules/**
```

Additional `.gitignore` hygiene improvements:
- Anchor root-only ignores:
```gitignore
/bin/
/vendor/
```
- Ignore the large local test binary:
```gitignore
/obot-test
```

Verification technique (provenance for why a file is ignored):
```bash
git check-ignore -v <path>
```

Documentation update: `DEVELOPMENT.md` includes a vendor-based guardrail suggestion (script-free) using `pre-commit` and `detect-secrets` via `uv`:
```bash
uv tool install pre-commit
uv tool install detect-secrets
pre-commit sample-config > .pre-commit-config.yaml
pre-commit install
pre-commit run --all-files
```
This keeps ignore drift under control while preventing secret leakage.