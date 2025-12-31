Audit context for Atuin on this machine:
- Active zsh config uses ZDOTDIR at `~/.config/zsh` (verified with `echo ${ZDOTDIR:-$HOME}`), and `~/.config/zsh/.zshrc` is minimal and does not include `atuin init` (shell plugin not wired).
- Atuin CLI version observed: `atuin 18.3.0`.
- Atuin client config lives at `~/.config/atuin/config.toml`; `history_filter` is explicitly populated, `[sync] records = true`, `[daemon]` exists but `enabled` is commented out (disabled), and no `[dotfiles]` section is present.
- Atuin local data is present at `~/.local/share/atuin/` (history.db, records.db, session, key, last_sync_time, atuin.sock).
- Atuin Desktop is installed (`/Applications/Atuin.app`), and local Desktop data exists at `~/Library/Application Support/sh.atuin.app/` (runbooks/exec_log/etc DBs).

Commands used:
```bash
atuin --version
rg -n "^(sync_address|sync_frequency|auto_sync|secrets_filter|history_filter|cwd_filter|workspaces|store_failed|dotfiles|\[sync\]|\[daemon\]|\[dotfiles\])" ~/.config/atuin/config.toml
sed -n '90,140p' ~/.config/atuin/config.toml
sed -n '230,300p' ~/.config/atuin/config.toml
ls -la ~/.local/share/atuin
ls -la "$HOME/Library/Application Support/sh.atuin.app" | head
cat ~/.config/zsh/.zshrc
```