# GPA + FEA Debug Evaluation

- Timestamp: `2025-12-30T17:57:23Z`
- Repo root: `/Users/daniellynch/Developer`

## Multi-Level Decomposition (Planes → Checks)

| Plane | Score | Evidence |
|---|---:|---|
| System Foundation | 8/8 (100.0%) | `finite-element-gap-analysis.sh` · weight 0.14 |
| Language Runtimes | 8/8 (100.0%) | `finite-element-gap-analysis.sh` · weight 0.14 |
| Database Layer | 4/5 (80.0%) | `finite-element-gap-analysis.sh` · weight 0.14 |
| MCP Ecosystem | 4/8 (50.0%) | `finite-element-gap-analysis.sh` · weight 0.14 |
| Network Layer | 4/5 (80.0%) | `finite-element-gap-analysis.sh` · weight 0.10 |
| Development Tools | 7/8 (87.5%) | `finite-element-gap-analysis.sh` · weight 0.10 |
| Repo Validation | 21/26 (80.8%) | `validation-report.json` · weight 0.12 |
| Vendor Tools | 17/19 (89.5%) | `vendor-tool-validation-report.json` · weight 0.12 |

**Overall GPA score:** `83.4/100`

## FEA Failures (by plane)

### Database Layer
- Testing Neo4j Client... ❌ FAIL

### MCP Ecosystem
- Testing MCP-ollama... ❌ FAIL
- Testing MCP-anthropic... ❌ FAIL
- Testing MCP-neo4j... ❌ FAIL
- Testing MCP-task-master... ❌ FAIL

### Network Layer
- Testing API Testing... ❌ FAIL

### Development Tools
- Testing Security... ❌ FAIL

## Numerical Model (ODE projection)

- Model: `dx/dt = churn + coupling(x) - remediation(effort)` (Euler discretization)
- Params: `days=30.0`, `dt=0.25`, `churn/day=0.01`, `remediation/day=0.08`, `target_gap=0.05`
- Estimated time until all planes ≤ target gap: `not reached` (with current parameters)

| Plane | Initial Gap |
|---|---:|
| System Foundation | 0.000 |
| Language Runtimes | 0.000 |
| Database Layer | 0.200 |
| MCP Ecosystem | 0.500 |
| Network Layer | 0.200 |
| Development Tools | 0.125 |
| Repo Validation | 0.192 |
| Vendor Tools | 0.105 |
