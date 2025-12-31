In obot, the repo’s tool analyzers under `tools/` use Go build tags and can conflict if multiple `main()` files are built together. To make them composable:

- Convert `tools/debug-framework.go` into a library-only file (remove `main()` and remove CLI-only imports like `flag`).
- Add a separate CLI entrypoint `tools/debug-framework-cli.go` guarded by `//go:build tools && toolcli`.
- Ensure type names in tool-only packages don’t collide when compiled together (e.g., rename the debug framework’s `Location` struct to `DebugLocation`).

Working commands:

```bash
# Full 20-step baseline (must include dependent tool-only source files)
cd /Users/daniellynch/Projects/obot
go run -tags tools \
  ./tools/20-step-gap-analysis.go \
  ./tools/provenance-tracker.go \
  ./tools/ast-grep-rules.go \
  ./tools/debug-framework.go \
  -dir . -execute-all -report -progress ./.cursor/gap-analysis-progress.json

# AST-grep baseline report + JSON export
go run -tags 'tools toolcli' ./tools/ast-grep-rules-cli.go ./tools/ast-grep-rules.go \
  -dir . -include '**/*.go' -exclude '**/*_test.go,**/vendor/**,**/node_modules/**,**/.cursor/**,**/docs/**,**/ui/**' \
  -output ./evaluation/metrics/ast-grep-report.md

go run -tags 'tools toolcli' ./tools/ast-grep-rules-cli.go ./tools/ast-grep-rules.go \
  -dir . -include '**/*.go' -exclude '**/*_test.go,**/vendor/**,**/node_modules/**,**/.cursor/**,**/docs/**,**/ui/**' \
  -json

# Debug framework baseline report + JSON export
go run -tags 'tools toolcli' ./tools/debug-framework-cli.go ./tools/debug-framework.go \
  -dir . -output ./evaluation/metrics/debug-report.md

go run -tags 'tools toolcli' ./tools/debug-framework-cli.go ./tools/debug-framework.go \
  -dir . -json
```

DB standardization step implemented:
- Reuse the existing pooled Postgres connection from `storage.Start(...)` by plumbing it into `pkg/services/config.go` as `PostgresSQLDB`.
- Update `pkg/api/router/router.go` to construct the admin DB handler with `services.PostgresSQLDB`.
- Update `pkg/api/handlers/database.go` so `NewDatabaseHandler` accepts `*sql.DB` and harden identifier usage using vendor quoting: `pgx.Identifier(...).Sanitize()` for table/column names.
