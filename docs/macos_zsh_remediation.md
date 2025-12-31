Atuin ecosystem remediation (macOS, zsh + mise + chezmoi + launchd):

1) Atuin upgraded via mise
- Updated `/Users/daniellynch/Developer/mise.toml` tool pin from `atuin = "18.3.0"` to `atuin = "18.10.0"`.
- Installed with vendor command:
```bash
cd /Users/daniellynch/Developer && mise install atuin
```
- Verified interactive login shell resolves shim and new version:
```bash
cd /Users/daniellynch/Developer && zsh -lic 'atuin --version; which atuin; mise current atuin'
```

2) Atuin client config hardened via chezmoi (SSOT)
- Chezmoi-managed file `~/.config/atuin/config.toml` now explicitly sets:
  - `auto_sync=true`, `update_check=true`, `sync_address=https://api.atuin.sh`, `sync_frequency="10m"`
  - `workspaces=true`
  - `secrets_filter=true` and existing `history_filter=[...]`
  - `[sync] records=true`
  - `[dotfiles] enabled=true`
  - `[daemon] enabled=true`, `sync_frequency=300`, `socket_path="~/.local/share/atuin/atuin.sock"`
- Applied with:
```bash
chezmoi apply ~/.config/atuin/config.toml
```

3) zsh/oh-my-zsh integration fixed (chezmoi-managed ZDOTDIR)
- ZDOTDIR is `~/.config/zsh`. Updated `~/.config/zsh/.zshrc` (via chezmoi source) to:
  - Init mise, oh-my-zsh (minimal plugin list), direnv
  - Init 1Password shell plugins: `eval "$(op plugin init zsh 2>/dev/null)" || true`
  - Source Atuin dotfiles caches: `${XDG_DATA_HOME}/atuin/dotfiles/cache/{vars,aliases}.zsh`
  - Init starship only when `TERM!=dumb`, and init Atuin AFTER starship
- Key validation:
```bash
cd /Users/daniellynch/Developer && zsh -lic 'bindkey "^r"; bindkey "^[[A"; echo ATUIN_SESSION=${ATUIN_SESSION:+set}'
```

4) Launchd daemon failure debug + fix
- Existing `sh.atuin.daemon` LaunchAgent was crash-looping with `Address already in use (os error 48)` due to stale socket file.
- Fix procedure (vendor commands): bootout job, remove stale socket, bootstrap + kickstart.
- After upgrade, corrected plist ProgramArguments to prevent accidental extra arg (previously became `[atuin18.10, atuin18.3, daemon]`):
```bash
plutil -replace ProgramArguments -json "[\"/Users/daniellynch/.local/share/mise/installs/atuin/18.10.0/atuin-aarch64-apple-darwin/atuin\",\"daemon\"]" ~/Library/LaunchAgents/sh.atuin.daemon.plist
plutil -insert ThrottleInterval -integer 15 ~/Library/LaunchAgents/sh.atuin.daemon.plist
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/sh.atuin.daemon.plist || true
rm -f ~/.local/share/atuin/atuin.sock ~/.local/share/atuin/atuin.sock.stale.*(N) || true
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/sh.atuin.daemon.plist
launchctl kickstart -k gui/$(id -u)/sh.atuin.daemon
```
- Verified running + socket bound:
```bash
launchctl print gui/$(id -u)/sh.atuin.daemon | head
lsof -U | rg -F 'atuin.sock'
```

5) Non-interactive `atuin history list` requires `ATUIN_SESSION`
- In Atuin 18.10.0, `atuin history list` errors without shell init: `Failed to find $ATUIN_SESSION`.
- Workaround (vendor-only):
```bash
ATUIN_SESSION=$(atuin uuid) atuin history list --cmd-only --reverse | head
```
- Added mise tasks in `/Users/daniellynch/Developer/mise.toml` including:
  - `atuin:history:tsv` which sets `ATUIN_SESSION=$(atuin uuid)` for safe non-interactive exports.

6) 1Password limitation discovered
- Current `op` context is `SERVICE_ACCOUNT` (via `OP_SERVICE_ACCOUNT_TOKEN`), which cannot create items (permission error 101). Requires interactive user auth or expanded permissions to store the Atuin key in 1Password.