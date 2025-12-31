Removed Homebrew duplicates to enforce mise-only tool resolution:

```
brew uninstall hadolint restic sd terraform-docs
```

Added mise orchestration tasks in `~/.config/mise/config.toml`:
- `audit-toolchain` (reports brew∩mise duplicates and resolves key binaries)
- `watch-toolchain` (watchexec triggers audit on config changes)

Task verification:
```
mise tasks --json | jq -r '.[] | select(.name == "audit-toolchain" or .name == "watch-toolchain") | "\(.name)\t\(.source)"'
```
