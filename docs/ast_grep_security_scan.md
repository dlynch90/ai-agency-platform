In `obot`, we integrated real ast-grep (sg) scanning using a vendor ruleset instead of the repo’s legacy regex-based “AST-grep” analyzer.

Key implementation:
- Added root `sgconfig.yml`:
```yaml
---
ruleDirs:
  - ./.ast-grep/rules
```
- Vendored Go security rules from `coderabbitai/ast-grep-essentials` into `.ast-grep/rules/go/security/*`.
- Ran authoritative scan and wrote results to `evaluation/metrics/sg-scan.json`:
```bash
sg scan -c sgconfig.yml --json=pretty --include-metadata . > evaluation/metrics/sg-scan.json
sg scan --inspect summary -c sgconfig.yml .
```
Observed summary:
- `effectiveRuleCount=11`, `scannedFileCount=528`, `matches=0`.

Documentation update:
- `evaluation/metrics/ast-grep-report.md` now clearly distinguishes vendor `sg` scan results from the legacy regex-based report produced by `tools/ast-grep-rules.go`.

Actionable takeaway:
- The legacy `tools/ast-grep-rules.go` produces high false positives because it uses line-regex heuristics; for security and linting gaps, prefer `sg scan` with vendor rule packs and SARIF/JSON outputs.