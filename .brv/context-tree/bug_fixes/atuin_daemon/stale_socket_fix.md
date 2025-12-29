Atuin daemon on macOS can fail with `Address already in use (os error 48)` if a stale unix socket exists at `~/.local/share/atuin/atuin.sock`. In this setup, Atuin is managed by Homebrew LaunchAgent (`~/Library/LaunchAgents/homebrew.mxcl.atuin.plist`) running `/opt/homebrew/opt/atuin/bin/atuin daemon` and logging to `/opt/homebrew/var/log/atuin.log`. Fix sequence:

```
# move stale socket (avoid rm)
mv ~/.local/share/atuin/atuin.sock ~/.local/share/atuin/atuin.sock.stale.$(date +%s)

# kickstart the brew LaunchAgent (needs elevated sandbox permissions in Codex)
launchctl kickstart -k gui/$(id -u)/homebrew.mxcl.atuin
```

Validation:
```
lsof -U | rg atuin.sock
ps aux | rg atuin
```
Expected: `atuin daemon` running and new socket recreated.