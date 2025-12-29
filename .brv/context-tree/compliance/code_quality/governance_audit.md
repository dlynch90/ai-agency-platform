Significant env audit + governance updates for /Users/daniellynch/Developer:

- ast-grep scan failed because `.ast-grep/utils` directory was missing; fixed by creating the folder so `sg scan` can run. Commands:
```
mkdir -p .ast-grep/utils
sg scan -c sgconfig.yml --filter no-hardcoded-abs-path
```

- Pre-commit still appears in `uv.lock` as a transitive dependency of `instructor`. Evidence block:
```
[[package]]
name = "instructor"
...
dependencies = [
  { name = "pre-commit" },
  ...
]
```
This means full removal of pre-commit requires replacing/removing `instructor` or adjusting dependency groups.

- Added SSOT vendor matrix entity for hooks and linked it into the code quality pipeline. Files:
  - `shared/registry/entities/active/vendor-functionality-matrix.json`
  - `shared/registry/entities/active/code-quality-pipeline.json` (added dependency + `metadata.hooks.ssot_reference`)

- Updated Lefthook template to avoid repo-local .sh scripts in hook examples:
  - `shared/templates/lefthook-project.yml` now shows Task-based commands instead of `./scripts/*.sh`.

- Lefthook governance doc updated to cite SSOT vendor matrix and explicitly forbid repo-local .sh usage in hooks/tasks:
  - `shared/docs/LEFTHOOK-GOVERNANCE.md`

- Hardcoded absolute path findings from ast-grep are limited to vendor configs under `shared/vendor-configs/google-ai/**` (no repo-local hits).