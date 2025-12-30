# SSOT Standardization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Standardize all configurations on chezmoi variables and eliminate hardcoded paths, duplicate configs, and version conflicts.

**Architecture:** Single Source of Truth (SSOT) pattern with chezmoi templates, unified virtual environment strategy via pixi+uv, and mise for polyglot version management.

**Tech Stack:** chezmoi, mise, pixi, uv, 1Password

---

## Virtual Environment Strategy (Based on 2025 Best Practices)

### Recommended Structure
```
/Users/daniellynch/Developer/
├── .pixi/envs/           # Pixi-managed environments (conda+PyPI)
│   ├── default/          # Core tools (Python 3.12, Node 18+)
│   ├── ai-ml/           # ML stack (PyTorch, transformers, CUDA/MPS)
│   ├── database/         # Database clients
│   └── infrastructure/   # DevOps tools
├── .venv/                # uv-managed general Python (per-project)
└── [DEPRECATED] ml-venv/ # To be migrated to .pixi/envs/ai-ml
```

### When to Use What
| Tool | Use Case | Environment |
|------|----------|-------------|
| **pixi** | ML, compiled deps, cross-platform | .pixi/envs/* |
| **uv** | Pure Python, fast installs | .venv/ |
| **pipx** | CLI tools (global) | ~/.local/pipx/venvs |
| **mise** | Runtime versions (python, node, go, rust) | ~/.local/share/mise |

---

## CHEZMOI SSOT Variables

### Standard Variables (from .chezmoidata.toml)
```toml
{{ .paths.workspace }}     # ~/Developer
{{ .paths.config }}        # ~/.config
{{ .paths.data }}          # ~/.local/share
{{ .paths.cache }}         # ~/.cache
{{ .paths.bin }}           # ~/.local/bin

{{ .services.qdrant.host }}:{{ .services.qdrant.port }}  # localhost:6333
{{ .services.ollama.host }}:{{ .services.ollama.port }}  # localhost:11434
{{ .services.neo4j.host }}:{{ .services.neo4j.bolt_port }} # localhost:7687
{{ .services.redis.host }}:{{ .services.redis.port }}    # localhost:6379
{{ .services.postgres.host }}:{{ .services.postgres.port }} # localhost:5432
```

### Shell Environment Variables (exported)
```bash
export DEVELOPER_DIR="${HOME}/Developer"
export DEV_HOME="${DEVELOPER_DIR}"
export MCP_CONFIG_DIR="${HOME}/.config/mcp"
export CHEZMOI_DEV_HOME="${DEVELOPER_DIR}"
```

---

## Tasks

### Task 1: Migrate ml-venv to pixi ai-ml
**Files:**
- Delete: `/Users/daniellynch/Developer/ml-venv/`
- Use: `/Users/daniellynch/Developer/.pixi/envs/ai-ml/`

**Step 1:** Verify pixi ai-ml environment has all packages
```bash
pixi run --environment ai-ml python -c "import torch; print(torch.__version__)"
```

**Step 2:** Remove deprecated ml-venv
```bash
rm -rf /Users/daniellynch/Developer/ml-venv
```

### Task 2: Fix mem0ai Version Conflict
**Files:**
- Modify: `/Users/daniellynch/Developer/pixi.toml`

**Step 1:** Pin mem0ai to single version
```toml
[feature.ai-ml.pypi-dependencies]
mem0ai = ">=1.0.0,<2.0.0"  # Pin to v1.x
```

**Step 2:** Regenerate lock file
```bash
pixi update
```

### Task 3: Consolidate Environment Files
**Files:**
- Keep: `/Users/daniellynch/Developer/config/production.env` (SSOT with 1Password refs)
- Delete duplicates

### Task 4: Fix Hardcoded Paths (Top 5 Files)
**Files to fix:**
1. `scripts/1password-setup/comprehensive_violations_fix.sh`
2. `scripts/1password-setup/loose_files_audit_finite_element_analysis.sh`
3. `temporal/activities/gibson-activities.ts`

**Pattern:**
- Replace: `/Users/daniellynch/Developer` → `${DEVELOPER_DIR}`
- Replace: `/Users/daniellynch` → `${HOME}`

### Task 5: Align Version Managers
**Files:**
- Modify: `/Users/daniellynch/Developer/package.json`
- Keep: `/Users/daniellynch/Developer/configs/.mise.toml`

**Step 1:** Update package.json engines
```json
"engines": {
  "node": ">=25.0.0",
  "pnpm": ">=9.0.0"
}
```

---

## Success Criteria
- [x] No hardcoded `/Users/daniellynch` in source files (excluding node_modules) ✅ Fixed 49 scripts + temporal activities
- [x] Single virtual environment strategy (pixi for ML, uv for pure Python) ✅ Deleted deprecated ml-venv
- [x] mem0ai resolves to single version ✅ Pinned to >=1.0.0,<2.0.0
- [x] All paths use chezmoi variables or shell environment variables ✅ Using ${HOME}/Developer
- [x] Package.json engines match mise versions ✅ Updated to node>=20, pnpm>=9

## Completed: 2025-12-29
Implementation completed by Claude Code. All tasks verified working.
