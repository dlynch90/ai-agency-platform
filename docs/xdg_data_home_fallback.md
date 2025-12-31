Fixed MCP startup failures caused by `mise` template errors when `XDG_DATA_HOME` was missing (e.g., Codex spawns `npx` with a minimal env). Updated active mise config to avoid `env.XDG_DATA_HOME` in templated paths by using `env.HOME` instead.

Key changes:
```
# ~/.config/mise/config.toml
CARGO_HOME = "{{ env.HOME }}/.local/share/cargo"
GOPATH     = "{{ env.HOME }}/.local/share/go"
RUSTUP_HOME= "{{ env.HOME }}/.local/share/rustup"
_.path     = ["{{ env.HOME }}/.local/bin", "{{ env.HOME }}/.local/share/mise/shims"]
```
```
# ~/.config/mise/conf.d/atoms/base.toml
_.path = ["{{ env.HOME }}/.local/bin", "{{ env.HOME }}/.local/share/mise/shims"]
```
```
# ~/.config/mise/conf.d/atoms/go.toml
GOPATH = "{{ env.HOME }}/.local/share/go"
```
```
# ~/.config/mise/conf.d/atoms/rust.toml
CARGO_HOME = "{{ env.HOME }}/.local/share/cargo"
RUSTUP_HOME = "{{ env.HOME }}/.local/share/rustup"
```
Validation: `env -i HOME="$HOME" PATH="$PATH" npx --version` now succeeds, indicating MCP servers launched from a minimal env won’t crash before handshake.