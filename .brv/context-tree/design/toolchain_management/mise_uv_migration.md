Standardized toolchain toward mise+uv in /Users/daniellynch/Developer:

Config changes
- `/Users/daniellynch/Developer/.mise.toml` and `/Users/daniellynch/Developer/mise.toml`: added Node CLI tools via npm backend and moved pipx globals into mise:
  - npm tools: `@commitlint/cli`, `@infisical/cli`, `esbuild`, `firebase-tools`, `graphql-code-generator`, `grpc-tools`, `husky`, `netlify-cli`, `newrelic`, `nx`, `pino`, `pino-pretty`, `trpc-cli`, `turbo`, `typescript`, `vercel`, `webpack-bundle-analyzer`.
  - pipx tools: `acryl-datahub` and `fastapi`.
- `/Users/daniellynch/.config/mise/config.toml`: pinned many previously `latest` tools to explicit versions; updated tasks to use `uv` and `mise` instead of `pip`/`npm`; added `tool_alias` for `pip`/`pip3` -> `uv`; added `[env]` for `UV_CACHE_DIR` and `MISE_DISABLE_TOOLS`.
- Created `/Users/daniellynch/Developer/requirements.txt` via uv export to satisfy `MISE_PYTHON_DEFAULT_PACKAGES_FILE`.

Commands executed
```
cd /Users/daniellynch/Developer && mise install
pipx uninstall acryl-datahub
pipx uninstall fastapi
pipx uninstall dotdrop
npm -g rm @infisical/cli graphql-code-generator grpc-tools newrelic nx pino pino-pretty trpc-cli turbo typescript webpack-bundle-analyzer @clerk/clerk-sdk-node
pnpm remove -g @commitlint/cli @commitlint/config-conventional @modelcontextprotocol/sdk esbuild firebase-tools husky netlify-cli vercel
brew uninstall ast-grep bottom buf colima dust grpcurl hyperfine k6 lefthook tokei yarn
uv export --format requirements-txt --no-hashes > requirements.txt
```

Notes
- `brew uninstall` refused to remove `ripgrep` and `sqlite` due to dependencies (ansible, aws-sam-cli, codex, composer, php, python@3.13/3.14).
- `mise install` emitted npm deprecation warnings (e.g., `uuid@3.4.0`, `request@2.88.0`, `fsevents@1.2.13`, `node-domexception@1.0.0`) from vendor package dependency trees.