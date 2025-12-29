Updates to standardize toolchain PATH/shims:

- Updated `~/.profile` to build a mise-first PATH for login shells (shims -> pnpm -> user bin -> go/cargo -> Homebrew) using a `path_prepend` helper and exporting `PNPM_HOME`.
- Updated `~/.bashrc` to source `~/.profile` instead of hardcoding `/usr/local/bin:/usr/bin:/bin`, so bash inherits mise-first ordering.
- Added `unset MISE_SHELL` alongside `unset MISE_ENV_FILE` in both `~/.zshenv` and `~/.config/zsh/.zshenv` to avoid stale activation markers when using shims-only mode.
- Added pinned duplicates to `~/.config/mise/config.toml` to keep brew/mise overlap tools managed by mise:
```
ast-grep = "0.40.3"
bottom = "0.10.2"
buf = "1.61.0"
colima = "0.9.1"
dust = "1.2.3"
grpcurl = "1.9.3"
hyperfine = "1.19.0"
k6 = "1.4.2"
lefthook = "2.0.12"
tokei = "12.1.2"
```
- Aligned repo node pin by changing `/Users/daniellynch/Projects/desktop/.tool-versions` to `nodejs 24.12.0` (matching global mise node version).