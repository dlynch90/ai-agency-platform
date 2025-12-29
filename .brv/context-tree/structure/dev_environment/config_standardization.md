Standardized zsh init to avoid double mise activation by removing explicit `mise activate` blocks from chezmoi sources and reapplying:

```
chezmoi apply ~/.zshrc ~/.config/zsh/.zprofile
chezmoi apply ~/.config/zsh/.zshrc ~/.config/zsh/.zprofile
```

Edits were made in:
- `~/.local/share/chezmoi/dot_config/private_zsh/private_dot_zshrc` (remove `eval "$(mise activate zsh --shims --no-hook-env)"`)
- `~/.local/share/chezmoi/dot_config/private_zsh/private_dot_zprofile` (remove login-shell `mise activate` block)

Result: shims are injected via `~/.zshenv`, avoiding double activation warnings.

Removed pnpm global duplicates to reduce toolchain sprawl:
```
pnpm remove -g gitleaks tldr lefthook
```

Noted MCP config drift: `~/.config/mcp/mcp-ssot.json` differs from `~/Developer/mcp.json`; the latter includes schema, pinned MCP server versions, extra filesystem scopes, and `op run` wrapping.