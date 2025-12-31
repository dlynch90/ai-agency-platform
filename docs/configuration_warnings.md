## Chezmoi apply can hang due to interactive merge/diff + persistent state lock

- Symptom: `chezmoi apply` errors with `timeout obtaining persistent state lock, is another instance of chezmoi running?` or appears to hang.
- Root cause observed: a prior `chezmoi apply` was still running and had spawned GUI diff/merge processes (VS Code/Cursor) with `--diff --wait`, leaving `chezmoi` holding the persistent state lock.
- Resolution:
  1) Identify processes: `pgrep -fl chezmoi` and look for `chezmoi apply` plus editor `--diff --wait` processes.
  2) Terminate the stuck `chezmoi apply` and any `code/cursor --diff --wait` processes.
  3) For non-interactive/agent runs, run apply with flags that avoid prompts and GUI diff:

```bash
chezmoi apply --force --no-tty --use-builtin-diff --no-pager <targets...>
```

## Zsh vendorized layout (XDG + chezmoi)

- Standardized to a single authoritative ZDOTDIR plane:
  - `~/.zshenv`: minimal; sets XDG vars + `ZDOTDIR="$XDG_CONFIG_HOME/zsh"`; then sources `${ZDOTDIR}/.zshenv`.
  - `~/.zshrc`: minimal; sources `${ZDOTDIR}/.zshrc` for interactive shells.
  - `~/.zprofile`: minimal; sources `${ZDOTDIR}/.zprofile` for login shells.
  - `${ZDOTDIR}/.zshenv`: minimal “all shells” settings (history path, non-tty safeguards, optional OP service token read).
  - `${ZDOTDIR}/.zshrc`: interactive-only; uses `mise activate zsh`, completion guarded by `-t 0`, vendor integrations (starship/zoxide/direnv/op), sources `${ZDOTDIR}/aliases.zsh`, supports `.zshrc.local`.

## Mise warnings fix (tool registry identifiers)

- Symptom on zsh startup: 
  - `mise WARN Failed to resolve tool version list for glances ... glances not found in mise tool registry`
  - `mise WARN Failed to resolve tool version list for procs ... procs not found in mise tool registry`
- Fix: update `~/.config/mise/conf.d/core.toml` to use correct providers:
  - Replace `"glances" = "latest"` with `"pipx:glances" = "latest"`
  - Replace `"procs" = "latest"` with `"aqua:dalance/procs" = "latest"`
