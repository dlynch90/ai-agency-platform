## Atuin + zsh + mise + chezmoi + 1Password hardening (macOS)

### 1Password CLI: service-account vs user-mode (biometrics)
- If `OP_SERVICE_ACCOUNT_TOKEN` is set, `op` runs as a **SERVICE_ACCOUNT**; some item write operations can fail due to permissions.
- To force **user-mode** (desktop app integration + biometrics), unset service-account and connect env vars:
```bash
env -u OP_SERVICE_ACCOUNT_TOKEN -u OP_CONNECT_HOST -u OP_CONNECT_TOKEN op whoami
env -u OP_SERVICE_ACCOUNT_TOKEN -u OP_CONNECT_HOST -u OP_CONNECT_TOKEN op signin
```
- Recommended fallback pattern: attempt a user-mode command; if not signed in, run `op signin` and retry.

### Atuin daemon (launchd) macOS failure mode
- Atuin daemon can crash-loop with `Address already in use (os error 48)` when a stale unix socket exists at `~/.local/share/atuin/atuin.sock`.
- Fix: stop LaunchAgent, remove stale socket, then restart (launchctl bootout/bootstrap/kickstart). Consider adding `ThrottleInterval` in the plist to avoid restart storms.

### Mise + zsh: avoiding double-activation warnings
- `mise doctor` warns if mise activation env leaks while shims are also on PATH.
- If `ZDOTDIR` is set externally, zsh can bypass `~/.zshenv` and read `$ZDOTDIR/.zshenv` instead; mitigation must live in `$ZDOTDIR/.zshenv`.
- Clear mise activation env vars early:
```zsh
unset __MISE_SESSION __MISE_ORIG_PATH __MISE_DIFF __MISE_ZSH_PRECMD_RUN
```

### Atuin + zsh-autosuggestions integration
- Atuin docs: Atuin automatically adds itself as a zsh-autosuggestions strategy when shell integration loads.
- Validation signals:
  - `ZSH_AUTOSUGGEST_STRATEGY` includes `atuin` (often `atuin history`)
  - `_zsh_autosuggest_strategy_atuin` function exists.

### Atuin zsh completions (oh-my-zsh custom completions)
- Generate completions into oh-my-zsh custom completions dir:
```bash
atuin gen-completions --shell zsh --out-dir ~/.config/zsh/ohmyzsh/custom/completions
```
- Note: piping `atuin gen-completions` into a truncating consumer (e.g. `| head`) can trigger a BrokenPipe panic; redirect to a file or use `--out-dir`.

### Atuin non-interactive exports
- `atuin history list` can error when `ATUIN_SESSION` isn’t set (common in CI/cron). Safe pattern:
```bash
ATUIN_SESSION=$(atuin uuid) atuin history list --format "{time}\t{command}" --reverse
```

### 1Password service accounts best practice
- Prefer passing vault and item IDs (vs names/titles) to reduce API calls and avoid ambiguity in `op item get/edit`.