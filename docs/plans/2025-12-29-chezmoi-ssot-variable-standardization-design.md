# Chezmoi SSOT Variable Standardization Design

Date: 2025-12-29

## Status

Proposed

## Context

The codebase has variable fragmentation across three layers:
- **Template variables** (`{{.paths.developer}}`) resolved at `chezmoi apply`
- **Shell variables** (`$DEVELOPER_DIR`) resolved at runtime
- **Environment files** (`.env`, `env-template.sh`) loaded inconsistently

Current state:
- 60 shell files with variables (inconsistent naming)
- 9 files with chezmoi templates (underutilized)
- 60 config files with hardcoded `localhost:port`
- 4 scripts with hardcoded `/Users/daniellynch/Developer`
- `.chezmoidata.toml` has drift from reality (pyenv enabled, but mise is active)

## Decision

Implement **Chezmoi-First Variable Architecture** with zero custom code.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CHEZMOI-FIRST VARIABLE ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐                                                    │
│  │ .chezmoidata.toml   │ ◄─── SINGLE SOURCE OF TRUTH                       │
│  └──────────┬──────────┘                                                    │
│             │ chezmoi apply                                                 │
│             ▼                                                               │
│  ┌─────────────────────┐      ┌─────────────────────┐                      │
│  │ dot_zshrc.tmpl      │ ──►  │ ~/.zshrc            │                      │
│  │ {{.paths.workspace}}│      │ export CHEZMOI_*    │                      │
│  └─────────────────────┘      └──────────┬──────────┘                      │
│                                          │ shell startup                    │
│                                          ▼                                  │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │  $CHEZMOI_WORKSPACE, $CHEZMOI_QDRANT_URL, etc.                  │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1. SSOT Schema (.chezmoidata.toml)

```toml
[identity]
name = "Daniel Lynch"
email = "daniel@example.com"

[paths]
home = "{{ .chezmoi.homeDir }}"
workspace = "{{ .chezmoi.homeDir }}/Developer"
config = "{{ .chezmoi.homeDir }}/.config"
data = "{{ .chezmoi.homeDir }}/.local/share"
cache = "{{ .chezmoi.homeDir }}/.cache"
bin = "{{ .chezmoi.homeDir }}/.local/bin"
mcp_servers = "{{ .chezmoi.homeDir }}/Developer/mcp-servers"
scripts = "{{ .chezmoi.homeDir }}/Developer/scripts"

[services.mem0]
host = "localhost"
port = 3001

[services.qdrant]
host = "localhost"
port = 6333

[services.neo4j]
host = "localhost"
bolt_port = 7687

[services.redis]
host = "localhost"
port = 6379

[services.ollama]
host = "localhost"
port = 11434

[services.postgres]
host = "localhost"
port = 5432

[tools]
  [tools.version_manager]
  active = "mise"

  [tools.mise]
  enabled = true

  [tools.pyenv]
  enabled = false

  [tools.nvm]
  enabled = false

[features]
onepassword = true
starship = true
mise = true
delta = true
```

### 2. Variable Export Mechanism (dot_zshrc.tmpl)

```zsh
# CHEZMOI EXPORTS - Auto-generated from .chezmoidata.toml
export CHEZMOI_HOME="{{ .paths.home }}"
export CHEZMOI_WORKSPACE="{{ .paths.workspace }}"
export CHEZMOI_CONFIG="{{ .paths.config }}"
export CHEZMOI_MCP_SERVERS="{{ .paths.mcp_servers }}"

export CHEZMOI_MEM0_URL="http://{{ .services.mem0.host }}:{{ .services.mem0.port }}"
export CHEZMOI_QDRANT_URL="http://{{ .services.qdrant.host }}:{{ .services.qdrant.port }}"
export CHEZMOI_NEO4J_BOLT="bolt://{{ .services.neo4j.host }}:{{ .services.neo4j.bolt_port }}"
export CHEZMOI_REDIS_URL="redis://{{ .services.redis.host }}:{{ .services.redis.port }}"
export CHEZMOI_OLLAMA_URL="http://{{ .services.ollama.host }}:{{ .services.ollama.port }}"
```

### 3. Discovery Pipeline (10 Parallel Agents)

| Agent | Tool | Target |
|-------|------|--------|
| PATH_HUNTER | `rg '/Users/daniellynch'` | Hardcoded absolute paths |
| PORT_SCANNER | `rg 'localhost:[0-9]+'` | Hardcoded service URLs |
| ENV_AUDITOR | `rg 'export [A-Z]'` | Environment variable patterns |
| DOCKER_ANALYZER | `fd docker-compose` + `rg 'ports:'` | Docker port mappings |
| CONFIG_PARSER | `fd -e toml -e yaml` + `jq/yq` | Config file values |
| SCRIPT_ANALYZER | `ast-grep` + `shellcheck` | Shell script patterns |
| TEMPLATE_AUDITOR | `fd -e tmpl` + `rg '\{\{.*\}\}'` | Chezmoi template usage |
| SECRETS_DETECTOR | `gitleaks` + `rg 'op://'` | 1Password refs and secrets |
| IMPORT_MAPPER | `rg 'source \|^\.'` | Shell sourcing chains |
| CHEZMOI_VALIDATOR | `chezmoi verify` + `chezmoi diff` | Template validation |

### 4. Transformation Strategy (3 Tiers)

**Tier 1: ast-grep** (semantic, for shell scripts)
- Install community rules: `git clone https://github.com/coderabbitai/ast-grep-essentials ~/.config/ast-grep/rules`

**Tier 2: Regex** (via Serena `replace_content` or `sed`)
- Replacement mapping: `/Users/daniellynch/Developer` → `${CHEZMOI_WORKSPACE}`

**Tier 3: Serena MCP** (for Python/TypeScript code)
- Use `find_symbol` + `replace_symbol_body` for code files

### 5. Enforcement (Zero Custom Code)

**gitleaks config** (`~/Developer/.gitleaks.toml`):
```toml
title = "Chezmoi Variable Enforcement"

[[rules]]
id = "hardcoded-home-path"
description = "Hardcoded /Users/ or /home/ path - use $CHEZMOI_* variables"
regex = '''(/Users/[a-zA-Z0-9_-]+/|/home/[a-zA-Z0-9_-]+/)'''
tags = ["portability", "chezmoi"]

[[rules]]
id = "hardcoded-localhost-port"
description = "Hardcoded localhost:port - use $CHEZMOI_*_URL variables"
regex = '''localhost:(6333|7687|6379|11434|3001|5432)'''
tags = ["portability", "chezmoi"]
```

**lefthook addition** (add to existing `~/Developer/lefthook.yml`):
```yaml
gitleaks:
  run: gitleaks protect --staged --config .gitleaks.toml --verbose

chezmoi-validate:
  run: chezmoi verify && chezmoi execute-template < /dev/null
```

### 6. LLM Jury Evaluation

Use existing infrastructure:
- **LiteLLM config**: `ai-ml/config/litellm-config.yaml` (35+ models configured)
- **Model group**: `code` (claude-sonnet-4, deepseek-coder-v2, qwen2.5-coder, codellama, gpt-4o)
- **Existing evaluator**: `scripts/ollama-llm-judge-evaluator.js` (10-iteration, GPA scoring)

Add chezmoi-specific criteria to existing evaluator:
- `portability`: Works across different home directories
- `consistency`: Follows CHEZMOI_* naming convention

## CLI Tools Required (20)

| # | Tool | Purpose | Status |
|---|------|---------|--------|
| 1 | `fd` | Fast file discovery | ✅ Installed |
| 2 | `rg` (ripgrep) | Pattern searching | ✅ Installed |
| 3 | `ast-grep` | AST-based shell analysis | ✅ v0.40.3 |
| 4 | `jq` | JSON parsing | ✅ Installed |
| 5 | `yq` | YAML parsing | Check |
| 6 | `toml` (cargo) | TOML parsing | Install |
| 7 | `chezmoi` | Template operations | ✅ Installed |
| 8 | `shellcheck` | Shell script analysis | ✅ Installed |
| 9 | `gitleaks` | Secret/path detection | ✅ Installed |
| 10 | `trufflehog` | Secret scanning | ✅ Installed |
| 11 | `lefthook` | Git hooks | ✅ Configured |
| 12 | `git` | Version control | ✅ Installed |
| 13 | `ollama` | Local LLM | ✅ Installed |
| 14 | `litellm` | LLM gateway | ✅ Configured |
| 15 | `direnv` | Environment management | Check |
| 16 | `envsubst` | Variable substitution | ✅ (gettext) |
| 17 | `sed` | Stream editing | ✅ Built-in |
| 18 | `awk` | Text processing | ✅ Built-in |
| 19 | `xargs` | Parallel execution | ✅ Built-in |
| 20 | `diff` | Change detection | ✅ Built-in |

## Consequences

### Easier
- Single source of truth for all configuration values
- Portable across machines (no hardcoded `/Users/username`)
- Pre-commit prevents drift automatically
- Clear naming convention (`CHEZMOI_*`)

### Harder
- Must run `chezmoi apply` after changing `.chezmoidata.toml`
- Scripts must use `$CHEZMOI_*` instead of hardcoded values
- Docker Compose files need environment variable substitution

### Risks
- Breaking existing scripts during migration (mitigate: backup + dry-run)
- Learning curve for team members (mitigate: documentation)

## Implementation Order

1. Update `.chezmoidata.toml` with comprehensive schema
2. Update `dot_zshrc.tmpl` with export block
3. Run `chezmoi apply` to generate new `.zshrc`
4. Create `.gitleaks.toml` config
5. Add gitleaks hook to `lefthook.yml`
6. Run 10 parallel discovery agents
7. Transform files using 3-tier strategy
8. Validate with LLM jury using existing `code` model group
9. Commit and push

## References

- [gitleaks](https://github.com/gitleaks/gitleaks) - Custom regex rules for path detection
- [ast-grep-essentials](https://github.com/coderabbitai/ast-grep-essentials) - Community rules
- [chezmoi templating](https://www.chezmoi.io/user-guide/templating/) - Built-in validation
- [pre-commit framework](https://pre-commit.com/) - Hook management
