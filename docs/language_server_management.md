Zed: mute noisy LSPs per language by using `languages` -> `language_servers` with `!` to disable and `...` to keep the rest. Example:
```
"languages": {
  "JSON": { "language_servers": ["!biome", "!design-tokens-language-server", "!jj_lsp", "..."] },
  "CSS": { "language_servers": ["!biome", "!design-tokens-language-server", "!jj_lsp", "..."] },
  "TypeScript": { "language_servers": ["!biome", "!jj_lsp", "..."] }
}
```
This silences jj_lsp/design-tokens/biome without disabling other servers.

Mise: fix LSP shim errors when Zed runs in non-project dirs by setting global tool versions in `~/.config/mise/config.toml`:
```
[tools]
python = "3.12.8"
biome = "2.3.10"
```
This prevents `mise ERROR No version is set for shim: biome` and helps tools like Serena find Python.