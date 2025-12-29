Started Ollama server via mise task:
```
mise run ollama.start-server
```
This runs `ollama serve` listening on `127.0.0.1:11434` and reports Metal GPU availability. Models present (from `/api/tags`): `qwen2.5-coder:7b`, `gpt-oss:20b-cloud`, `gpt-oss:120b-cloud`.

LiteLLM health after starting Ollama still showed unhealthy endpoints due to missing/unsupported models (e.g., `ollama/deepseek-v3`) plus non-Ollama providers without keys. Use `curl http://localhost:4000/health` with `jq` to list unhealthy models.