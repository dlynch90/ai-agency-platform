Zed (macOS) config tuning:
- Zed user settings live at `~/.config/zed/settings.json`.
- Installed Zed extensions can define LSPs via `~/Library/Application Support/Zed/extensions/installed/*/extension.toml`; context servers are declared under `[context_servers.<key>]`.
- The `jj-lsp` extension defines a `jj_lsp` language server attached to ~250+ languages; to avoid huge overhead, disable it per-language in `settings.json` with `"language_servers": ["!jj_lsp", "..."]`.
- To enable/disable LSPs per language in Zed, use `languages.<Language>.language_servers` and prefix entries with `!` to disable; `...` keeps the remaining defaults.
- Added missing installed context servers to `settings.json` (kept disabled by default for performance): `bun-docs-mcp`, `mcp-server-context7`, `mcp-server-sequential-thinking`.

Performance-oriented LSP profile used:
- For JS/TS/TSX/JSX/Astro/Svelte/Vue/HTML/CSS/JSON/JSONC/YAML/Shell/Python/Rust/Go: keep defaults (`...`) but explicitly disable noisy/unused servers like `deno`, `graphql`, `live-server`, `deputy`, `ast-grep` (except Python), `typos`, and `autocorrect`, while leaving `biome` enabled by removing `!biome`.

Biome config gotcha and fix:
- Biome 2.x uses `files.includes` with (a) normal negated globs `!…` and (b) scanner-level *force-ignore* globs prefixed with `!!…` (recommended for output/vendor folders).
- When Biome was scanning large vendor/output trees it could crash with an `HTML_BOGUS` cast error; switching output/vendor ignores to `!!**/<dir>` prevented the scan and avoided the crash.
- Example force-ignore patterns used: `"!!**/vendor"`, `"!!**/node_modules"`, `"!!**/dist"`, plus other generated/cache dirs and internal dot-directories.

ast-grep in repo:
- Root config `sgconfig.yml` points to `.ast-grep/rules` and can be validated via `sg scan -c sgconfig.yml -r <rule> .` (no testDir present => no `sg test` run).