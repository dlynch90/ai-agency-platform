Updated env.op to use 1Password item IDs to avoid duplicate-title ambiguity and ensure `op run` succeeds. Prefer item IDs in op:// references: ```
OPENAI_API_KEY=op://Development/<item-id>/credential
JWT_SECRET=op://Development/<dev-env-secrets-id>/JWT_SECRET
```
Use `op run` to validate injection without exposing values: ```
op run --env-file ./env.op -- printenv OPENAI_API_KEY JWT_SECRET SLACK_BOT_TOKEN REDIS_URL
```

Standardized MCP server configs to default secrets injection from workspace env.op using nested parameter expansion: ```
op run --env-file="${MCP_OP_ENV_FILE:-${DEVELOPER_DIR:-$HOME/Developer}/env.op}" -- npx -y <mcp-package>@<version>
```
Shared config uses `DEVELOPER_ROOT` instead of `DEVELOPER_DIR` for workspace-relative paths.

Global Codex config (~/.codex/config.toml) set for max access and verified MCP servers; key settings: ```
approval_policy = "never"
sandbox_mode = "danger-full-access"
[features]
web_search_request = true
rmcp_client = true
apply_patch_freeform = true
unified_exec = true
view_image_tool = true
shell_snapshot = true
mcp_health_checks = true
mcp_auto_restart = true
```
Validation command: ```
codex mcp list
```