Config registry SSOT can be persisted via config-singleton:
```
uv run python - <<"PY"
import sys
sys.path.insert(0, '/Users/daniellynch/Developer/packages/config-singleton')
from src.registry import get_registry
registry = get_registry()
registry.save()
print(registry.status())
PY
```
This writes `~/.config/registry/configs.json` with MCP/LiteLLM/Mise SSOT entries. Use when you need to register configs in the SSOT registry.