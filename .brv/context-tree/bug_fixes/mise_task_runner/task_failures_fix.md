Debugged mise task failures and recursion. Fixes applied in `/Users/daniellynch/Developer/mise.toml`:

1) **mise panic** traced to macOS system proxy lookup in `system-configuration` when building reqwest client during version resolution. Workaround applied by disabling versions host in repo config:
```toml
[settings]
  use_versions_host=false
  use_versions_host_track=false
```

2) **Task scripts** changed to POSIX `sh` (removed `bash -lc`), fixed quoting and here-string issues that broke `awk` parsing. Updated tasks:
- `secrets.validate.*`
- `secrets.audit.oprefs`
- `secrets.opconnect.*`
- `ssot.audit`, `ssot.enforce`, `ssot.cleanup.envfiles`

3) **Recursive task execution**: `ssot.*.all` tasks previously called `mise run ssot.*`, which led to massive recursive output. Replaced with inline logic per repo using `fd` + `rg` + `sed` + `mv`, avoiding nested `mise run` calls.

Verified: `mise run secrets.audit.oprefs` now succeeds (41 unique refs) after these fixes.