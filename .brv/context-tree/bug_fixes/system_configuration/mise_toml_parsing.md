Key system audit fixes and patterns:

- `mise` global config needs quoted tool keys when using a colon (e.g. pipx tools). Example:
```
"pipx:litellm" = "1.80.10"
```
Unquoted `pipx:litellm` caused TOML parse errors.

- Switched login-shell init to shims-only (avoid double-activation). In `~/.profile`, removed `eval "$(mise activate bash)"` and instead prepend shims + user bin to PATH.

- LiteLLM proxy required extra dependencies; base `pipx:litellm` install is insufficient. Fix by installing extras into the pipx venv using `uv`:
```
uv pip install --python ~/.local/share/mise/installs/pipx-litellm/1.80.10/litellm/bin/python backoff
uv pip install --python ~/.local/share/mise/installs/pipx-litellm/1.80.10/litellm/bin/python "litellm[proxy]"
```
This installs `backoff`, `fastapi`, `uvicorn`, etc., enabling `litellm` proxy.

- `litellm` CLI fails when `DEBUG=WARN` is set (expects boolean). Run proxy with `DEBUG` unset or set to `false`:
```
env -u DEBUG litellm --config config.yaml --host 127.0.0.1 --port 4007
```

- Minimal LiteLLM config for Ollama proxy testing:
```
model_list:
  - model_name: ollama-llama3.2
    litellm_params:
      model: ollama/llama3.2:3b
```
Use `model: "ollama-llama3.2"` in `/v1/chat/completions` requests.