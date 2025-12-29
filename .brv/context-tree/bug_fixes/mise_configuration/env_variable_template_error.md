Codex CLI MCP handshake failures traced to `mise` template errors when `npx` (mise shim) runs under a minimal env that lacks `XDG_DATA_HOME`. The error is `failed to parse template: '{{ env.XDG_DATA_HOME }}/cargo'`, causing MCP servers to exit immediately.

Fix: avoid `env.XDG_DATA_HOME` in active mise config; use `env.HOME` paths so shims work even with minimal env.
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
Validation: `env -i HOME="$HOME" PATH="..." npx --version` succeeds without mise errors.

Separate: `atuin` error on codex launch is due to missing daemon; start with `atuin daemon` or disable its shell hook if undesired.