Zed LSP crash-loop debugging (macOS) and repairs:

How to diagnose:
- Zed logs at `~/Library/Logs/Zed/Zed.log` include exact server startup commands and stderr. Quick summary pattern: `Failed to start language server "<name>"` and `MODULE_NOT_FOUND` / `ERR_MODULE_NOT_FOUND`.
- Zed runs bundled Node for many Node-based language servers: `~/Library/Application Support/Zed/node/node-v24.11.0-darwin-arm64/bin/node`.

Corruption pattern:
- Node-based language servers under `~/Library/Application Support/Zed/languages/<server>` and some extension LSPs under `~/Library/Application Support/Zed/extensions/work/<ext>` are small wrapper projects with a `package.json` like `{ "dependencies": { ... } }` and a `node_modules/` tree.
- LSP failures like:
  - `yaml-language-server`: `Cannot find module './resolve-block-map.js'` from `node_modules/yaml/dist/...`
  - `markdownlint`: `ERR_MODULE_NOT_FOUND` missing `micromark-core-commonmark/lib/block-quote.js`
  - `tailwindcss-language-server`: missing/corrupted `.bin` or corrupted package payload
  indicate incomplete/corrupted npm install under those Zed-managed directories.

Fix (works without relying on Zed’s npm cache):
- Reinstall the wrapper dependency in-place using system npm (safe because Zed only consumes JS from `node_modules`):
  - YAML:
    - `cd ~/Library/Application\ Support/Zed/languages/yaml-language-server && rm -rf node_modules && npm install --no-audit --fund=false --omit=dev`
    - Verify `node_modules/yaml/dist/compose/resolve-block-map.js` exists.
  - Markdownlint:
    - `cd ~/Library/Application\ Support/Zed/extensions/work/markdownlint && rm -rf node_modules && npm install --no-audit --fund=false --omit=dev`
    - Verify `node_modules/micromark-core-commonmark/lib/block-quote.js` exists.
  - Tailwind:
    - `cd ~/Library/Application\ Support/Zed/languages/tailwindcss-language-server && rm -rf node_modules && npm install --no-audit --fund=false --omit=dev`
    - Smoke: `node <zed-node> node_modules/.bin/tailwindcss-language-server --stdio` should emit valid `Content-Length:` framed LSP notifications (not crash).

Closed-loop validation:
- A minimal LSP handshake (initialize/shutdown) can be scripted by writing `Content-Length: ...\r\n\r\n{json}` to stdin and reading framed responses from stdout; used to confirm `yaml-language-server` initializes successfully after reinstall.

Settings hardening to stop repeated crash loops:
- Disable expensive/unwanted servers per language in `~/.config/zed/settings.json`:
  - YAML: add `!ast-grep` (ast-grep extension advertises Yaml and may get started unexpectedly).
  - Python: add `!ruff` to avoid `textDocument/diagnostic` timeouts; also add `!ast-grep` if not needed.
  - Markdown: disable `!markdownlint` and `!marksman` when using other Markdown servers to avoid redundant LSPs.
  - TOML: optionally disable `!tombi` if tombi is unstable in-editor.