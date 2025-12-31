## Complete Modernization Architecture - 2025-12-18

### 1Password Secrets Injection
```bash
# Template at config/env.op.template
op run --env-file=config/env.op.template -- <command>

# Via Taskfile
task secrets:run -- python app.py
```

### LiteLLM Multi-Provider Configuration
```yaml
# config/litellm/config.yaml
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: anthropic/claude-sonnet-4-20250514
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
  - model_name: llama-3.3-70b
    litellm_params:
      model: groq/llama-3.3-70b-versatile
```

### MCP Servers for Cursor IDE
Config at `config/cursor-mcp.json` with 16 servers:
- filesystem, github, postgres, brave-search, fetch
- memory, sequential-thinking, octocode, byterover-mcp
- cursor-ide-browser, exa, slack, linear, notion, docker, kubernetes

### Taskfile Commands
```bash
task init          # Full initialization
task llm:proxy     # Start LiteLLM
task ui:start      # Start Streamlit
task health:all    # Health checks
task validate:all  # Full validation
task secrets:run   # Run with 1Password secrets
```

### Custom Code Archived
- 8 Python scripts → docs/archive/custom-code-*/python/
- 8 TypeScript files → docs/archive/custom-code-*/typescript/
- All replaced with vendor tools via Taskfile