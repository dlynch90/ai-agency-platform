## Turborepo Modernization Architecture - 2025-12-18

### Gap Analysis Complete: 20-Step Migration Plan

**Key Findings:**
- 69 custom Python files (most are Skill_Seekers tests - KEEP)
- 17 custom TypeScript files (most should be replaced with vendor)
- 50+ loose files at user root (all need migration to Developer/)
- 5 scattered venvs (consolidate to Developer/.venv)
- Turborepo structure EXISTS with turbo.json + pnpm-workspace.yaml

**Vendor Stack for LLM Orchestration:**
```toml
# pyproject.toml dependency groups
ai = ["anthropic", "openai", "langchain-core", "litellm"]
orchestration = ["langgraph", "langgraph-checkpoint", "langsmith", "instructor", "pydantic-ai"]
ml = ["transformers", "sentence-transformers", "huggingface-hub"]
ui = ["streamlit", "plotly", "altair"]
evaluation = ["ragas", "deepeval", "mlflow"]
```

**Architecture Pattern:**
```
Developer/ (Turborepo)
├── apps/dashboard/ (Streamlit UI)
├── packages/llm-router/ (LiteLLM wrapper)
├── packages/llm-evaluation/ (Multi-model eval)
├── packages/agent-orchestration/ (LangGraph + Claude)
└── vendor-solutions/ (Reference implementations)
```

**UI Command:**
```bash
cd ~/Developer/apps/dashboard && uv run streamlit run src/app.py
```