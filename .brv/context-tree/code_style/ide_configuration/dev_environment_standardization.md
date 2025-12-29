Implemented cross-IDE standardization for dr-sosa dev environment:

- Enforced **mise shims-first** by removing `eval "$(mise activate zsh ...)"` from `~/.config/zsh/.zshrc` (shell already prepends `~/.local/share/mise/shims` in `~/.zshenv`).
- Standardized IDE user settings across **VS Code / Windsurf / Cursor / Antigravity**:
  - `ruff.nativeServer: "on"`
  - `[python]` formatter set to `charliermarsh.ruff` with code actions on save:
    - `source.fixAll.ruff: "explicit"`
    - `source.organizeImports.ruff: "explicit"`
  - JS/TS/JSON formatting set to **Biome** with `biome.requireConfiguration: true`
  - Disabled ESLint formatting (`eslint.format.enable: false`) and added ESLint scoping:
    - `eslint.validate: ["javascript","javascriptreact","typescript","typescriptreact"]`
    - `eslint.workingDirectories: [{"mode":"auto"}]`
  - Removed hardcoded `ruff.path` from Cursor/Windsurf to let mise shims control resolution.

Debug fixes:
- Quarantined malformed VS Code folder that broke `code --list-extensions`:
```sh
mv /Users/daniellynch/.vscode/extensions/sonarsource.sonarlint_ondemand-analyzers \
   /Users/daniellynch/.vscode/extensions/sonarsource.sonarlint_ondemand-analyzers.BAK
```
- Installed Pylance into Windsurf and Cursor by using VS Code CLI with explicit extension dirs (Windsurf marketplace couldn’t find Pylance):
```sh
code --install-extension ms-python.vscode-pylance --force --extensions-dir /Users/daniellynch/.windsurf/extensions
code --install-extension ms-python.vscode-pylance --force --extensions-dir /Users/daniellynch/.config/cursor/extensions
```

Key debugging insight:
- Windsurf logs showed Exa integration errors: `metadata.api_key` empty, likely because Windsurf’s internal Exa language server isn’t receiving `EXA_API_KEY` (mcp_config uses `op://` secrets). Recommended to ensure `op` auth/env injection for Windsurf or disable Exa integration if using Exa MCP server instead.