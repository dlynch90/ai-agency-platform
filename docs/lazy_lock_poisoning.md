During `mise run secrets.audit.oprefs` on macOS, mise crashed with:
```
Attempted to create a NULL object.
Location: ... system-configuration-0.6.1/src/dynamic_store.rs:154
... LazyLock instance has previously been poisoned
```
Workaround used: run the vendor-only validation pipeline directly via `/bin/bash` instead of `mise`.

Running `/bin/bash` via Codex harness sourced zsh shell snapshot and emitted errors:
```
setopt: command not found
export: -i/-T/-U invalid option
```
These are non-fatal but appear whenever the bash shell loads zsh snapshot files.

SSOT cleanup executed via vendor CLI moved disallowed env files into backups:
- `.env` → `.backups/ssot/envfiles/.env`
- `.env.local` → `.backups/ssot/envfiles/.env.local`
- `shared/packages/websocket-server/.env` → `.backups/ssot/envfiles/shared/packages/websocket-server/.env`
