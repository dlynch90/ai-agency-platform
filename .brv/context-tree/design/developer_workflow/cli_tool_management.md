## Vendor CLI Tools SSOT - No Custom Scripts

### Tool Management Stack
- **mise** - Tool version management (NOT custom scripts)
- **chezmoi** - Dotfile SSOT
- **1password-cli** - Secrets management
- **atuin** - Shell history
- **uv** - Python package management
- **direnv** - Environment management

### Directory Structure
- `~/.config/mise/config.toml` - Tool versions SSOT
- `~/.config/chezmoi/` - Dotfile templates
- `~/Developer/` - Turborepo monorepo (SSOT for code)
- `~/.claude/` - Claude Code config only (no custom scripts)

### Commands (NO CUSTOM SCRIPTS):
```bash
mise install <tool>       # Install any tool
mise use python@3.12      # Set Python version
uv pip install <pkg>      # Install Python packages
chezmoi apply             # Sync dotfiles from SSOT
chezmoi diff              # Review pending changes
op read "op://vault/item" # Read secrets
atuin search <term>       # Search shell history
```

### FORBIDDEN
- No custom .py scripts in home directory
- No custom .sh scripts in home directory
- No virtual environments (use mise + uv)
- No vendor-templates/ directories
- No generated reports in home directory