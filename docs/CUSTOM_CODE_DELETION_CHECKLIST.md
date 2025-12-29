# Custom Code Files to Delete (Replace with Vendor Tools)

## CRITICAL - Delete Immediately

### Custom Wrappers (Use vendor tools directly)
- [ ] `/Users/daniellynch/Developer/auth/cli/authenticated-cli-wrapper.sh` → Use 1Password CLI directly
- [ ] `/Users/daniellynch/Developer/scripts/1password-setup/1password-auth-helper.sh` → Use @1password/sdk
- [ ] `/Users/daniellynch/Developer/bin/gibson` → Use Ollama CLI or @langchain/ollama
- [ ] `/Users/daniellynch/Developer/validate-mcp-servers.js` → Use @modelcontextprotocol/sdk
- [ ] `/Users/daniellynch/Developer/validate-mcp-servers-fixed.js` → Duplicate, delete
- [ ] `/Users/daniellynch/Developer/validate-vendor-tools.js` → Use pnpm scripts

### Custom Database Managers (Use Prisma)
- [ ] `/Users/daniellynch/Developer/database/infrastructure/postgres/pg-pool.config.ts` → Use Prisma
- [ ] `/Users/daniellynch/Developer/database/infrastructure/redis/redis-cache.config.ts` → Use ioredis directly
- [ ] `/Users/daniellynch/Developer/database/infrastructure/neo4j/neo4j-graph.config.ts` → Use neo4j-driver directly

### Duplicate/Backup Files (Delete)
- [ ] All `*.backup` and `*.backup.backup` files in `/infra/scripts/`
- [ ] All `*.backup` files in `/scripts/`
- [ ] `/Users/daniellynch/Developer/temp/` directory contents

## HIGH PRIORITY - Migrate to npm scripts

### Shell Scripts (268 files identified)
- Migrate to package.json scripts or npm-run-all
- Priority files:
  - `/scripts/start-mcp-ecosystem.sh` → `pnpm mcp:start`
  - `/scripts/install-vendor-tools.sh` → `pnpm install`
  - `/scripts/validate-code.sh` → `pnpm validate`

### Python Utilities (203 files identified)
- Migrate to click/typer CLI framework
- Priority files:
  - `/tools/python/validate_installations.py` → Use pixi tasks
  - `/scripts/fea-integration-pipeline.py` → Use proper CLI

## MEDIUM PRIORITY - Consolidate

### Duplicate Configurations
- [ ] `/configs/package.json` → Delete (duplicate of root)
- [ ] Multiple `.prettierrc` files → Keep only root
- [ ] Multiple `docker-compose.yml` in domains → Use extends

### Duplicate Directories
- [ ] `/infra/` → Merge into `/infrastructure/`
- [ ] `/database/infrastructure/` → Merge into `/infrastructure/database/`

## Governance Commands

```bash
# Count remaining custom code violations
find . -name "*.sh" -not -path "./node_modules/*" | wc -l

# Find hardcoded paths
grep -r "/Users/" --include="*.ts" --include="*.py" | grep -v node_modules

# Find custom wrappers
grep -r "class.*Wrapper\|function.*wrapper" --include="*.ts" --include="*.js"

# Run vendor compliance check
pnpm validate:vendor
```

## Enforcement

After cleanup:
1. Update lefthook to block new custom code
2. Add ESLint rules to detect patterns
3. Enable CI/CD vendor compliance gate
4. Document approved vendor alternatives in .cursorrules
