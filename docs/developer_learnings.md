Learnings from Developer repo audit:

- ast-grep rule filtering uses `--filter` (rule id), and file globs use `--globs` (plural). Example:
```
sg scan -c sgconfig.yml --filter no-hardcoded-abs-path --globs '!ai-ml-central/**' --globs '!node_modules/**'
```
Context: `-r/--rule` expects a rule file path, not a rule id.

- Mise health symlink check should detect broken symlinks with `! -exec test -e`:
```
"health:symlinks" = "find ~/.config -type l ! -exec test -e {} \\; -print 2>/dev/null || true"
```
Context: macOS/BSD `find` does not support `-xtype`.

- Kong container healthcheck can use the built-in CLI instead of curl/wget:
```
healthcheck:
  test: ["CMD", "kong", "health"]
```
Context: kong image may not include curl; `kong health` succeeds inside the container.
