Obot governance + vendor quality gate hardening:

1) Vendor quality gates in Makefile
- `Makefile` now includes:
  - `lint-sg`: runs real ast-grep `sg scan -c sgconfig.yml`.
  - `setup-env`: installs golangci-lint via `go install` (replaces curl install script).
  - `setup-security-tools` + `security-go`: installs/runs `govulncheck` and `gosec` via `go install`.

2) Secret hygiene
- `.envrc.dev` removed from repo and added to `.gitignore`.

3) Security headers
- `pkg/server/server.go` wraps the handler with a `/api/`-scoped security headers middleware:
  - `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'`
  - `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy: geolocation=(), microphone=(), camera=()`
  - `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy`

4) Provenance gating (made enforceable)
- `tools/provenance-tracker.go` updated to:
  - scan all files (not only .go)
  - classify default as `first-party` origin `github.com/obot-platform/obot`
  - avoid misclassifying JSON/YAML artifacts as generated (generated markers only apply to .go)
  - treat first-party templates as compliant
- `make provenance` added and integrated into `validate-go-code`.

Example run:
```bash
make provenance
```
Outputs: `✅ Validation complete: 1363/1363 files passed` and writes `provenance-report.md`.

5) Service stack scaffolding
- `evaluation/docker-compose.yaml` extended with optional vendor services:
  - `neo4j: neo4j:5` (ports 7474/7687)
  - `qdrant: qdrant/qdrant:latest` (ports 6333/6334)
  - adds `neo4j-data` and `qdrant-data` volumes.