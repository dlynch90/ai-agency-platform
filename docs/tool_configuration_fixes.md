Stored key setup patterns and fixes:

- Gemini CLI install via mise npm tool:
```
mise use "npm:@google/gemini-cli@0.21.3"
```
- Promptfoo must be installed via npm (pipx install failed). Fix with:
```
mise unuse "pipx:promptfoo@latest"
mise uninstall "pipx:promptfoo@0.1.0"
mise use "npm:promptfoo@latest"
```
- Node version bump to satisfy promptfoo engine requirements:
```
mise use node@22.13.1
```
- LiteLLM Gemini models added with GEMINI_API_KEY and cloud-only filtering:
```
yq -i 'del(.model_list[] | select(.litellm_params.model | test("^ollama/")))' config/litellm/config.yaml
yq -i '.model_list += [{"model_name":"gemini-1.5-pro-latest","litellm_params":{"model":"gemini/gemini-1.5-pro-latest","api_key":"os.environ/GEMINI_API_KEY"}},{"model_name":"gemini-1.5-flash-latest","litellm_params":{"model":"gemini/gemini-1.5-flash-latest","api_key":"os.environ/GEMINI_API_KEY"}}]' config/litellm/config.yaml
ln -sf ~/Developer/config/litellm/config.yaml ~/.config/litellm/config.yaml
```
- MCP SSOT and Gemini settings symlink pattern:
```
mkdir -p ~/.config/mcp && cp mcp.json ~/.config/mcp/ssot.json
ln -sf ~/.config/mcp/ssot.json ~/.mcp.json
ln -sf ~/.config/mcp/ssot.json ~/Developer/.mcp.json
ln -sf ~/.config/mcp/ssot.json ~/.cursor/mcp.json
jq -n --slurpfile mcp ~/.config/mcp/ssot.json '{general:{preferredEditor:"zed",vimMode:false,previewFeatures:false,disableAutoUpdate:false},allowMCPServers:($mcp[0].mcpServers|keys),mcpServers:$mcp[0].mcpServers}' > ~/.gemini/settings.json
ln -sf ~/.gemini/settings.json ~/Developer/.gemini/settings.json
```
- Optuna CLI SQLite path fix for absolute paths (error: unable to open database file):
```
optuna create-study --study-name promptfoo_tdd_eval --storage sqlite:////Users/daniellynch/Developer/reports/optuna/optuna.db
```
- Promptfoo cloud-only eval config (LLM judge/jury) saved at promptfoo.yaml with llm-rubric asserts.
