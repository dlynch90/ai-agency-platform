# CODEBASE ORGANIZATION STANDARDS

## Core Principles

### Zero Loose Files
❌ **PROHIBITED**: Files in root directory (except allowed exceptions)
✅ **REQUIRED**: All files organized in appropriate directories

### Vendor-Only Solutions
❌ **PROHIBITED**: Custom implementations, scripts, or infrastructure code
✅ **REQUIRED**: Use only vendor tools, libraries, and CLI commands

### Single Source of Truth (SSOT)
❌ **PROHIBITED**: Multiple config files of same type, conflicting configurations
✅ **REQUIRED**: One canonical configuration per concern

## Directory Structure

### Required Directories

| Directory | Purpose | File Types |
|-----------|---------|------------|
| `docs/` | Documentation | `.md`, `.txt` |
| `scripts/` | Build automation | `.sh`, `.cjs`, `.js`, `.py` |
| `testing/` | Tests and suites | `.test.js`, `.spec.ts`, etc. |
| `infra/` | Infrastructure | `docker-compose.yml`, `k8s/`, `terraform/` |
| `data/` | Datasets and models | `.csv`, `.json`, `.pkl`, ML models |
| `api/` | API definitions | OpenAPI specs, GraphQL schemas |
| `federation/` | GraphQL federation | Federation configs |
| `graphql/` | GraphQL schemas | `.graphql` files |
| `database/` | DB schemas/migrations | SQL, migrations, schemas |

### Config Directories

| Directory | Purpose |
|-----------|---------|
| `configs/` | Application configurations |
| `configs/linting/` | ESLint, Prettier configs |
| `configs/ci/` | CI/CD configurations |
| `configs/docker/` | Docker configurations |

## File Organization Rules

### By File Type

| File Type | Directory | Exception |
|-----------|-----------|-----------|
| `.md` | `docs/` | README.md in root |
| `.sh`, `.cjs`, `.js` | `scripts/` | None |
| `.test.*`, `.spec.*` | `testing/` | None |
| `docker-compose.yml` | `infra/docker/` | None |
| `.sql`, migrations | `database/` | None |
| `.toml`, `.json`, `.yaml` | `configs/` | `pixi.toml`, `package.json` in root |

### Root Directory - Allowed Files Only

```
pixi.toml           # Package management
pixi.lock           # Lock file
package.json        # Node.js dependencies
package-lock.json   # NPM lock file
README.md           # Project documentation
LICENSE             # License file
Makefile            # Build automation
justfile            # Task runner
Taskfile.yml        # Task runner
.gitignore          # Git ignore rules
.cursorignore       # Cursor IDE ignore
.eslintrc.js        # ESLint config (symlink)
tsconfig.json       # TypeScript config
turbo.json          # Turborepo config
pyproject.toml      # Python project config
```

## Vendor Compliance

### Prohibited Patterns

❌ Custom infrastructure scripts
❌ Manual Docker/Kubernetes commands
❌ Custom package installation scripts
❌ Hardcoded paths and values
❌ Custom business logic implementations

### Required Vendor Solutions

✅ **Package Management**: pixi, npm, pip
✅ **Container Orchestration**: docker-compose, kubernetes
✅ **CI/CD**: GitHub Actions, vendor pipelines
✅ **Infrastructure**: Terraform, vendor IaC tools
✅ **Databases**: Vendor database tools and migrations
✅ **APIs**: Vendor API gateways and tools

## Enforcement

### Pre-commit Hooks

The `organization-enforcement.sh` hook runs automatically and blocks commits that violate:

- Loose files in root directory
- Hardcoded paths and connection strings
- Custom infrastructure implementations

### ESLint Rules

Custom ESLint rules enforce:

- `no-root-files`: Prevents files in root directory
- `no-hardcoded-values`: Blocks hardcoded paths
- `require-vendor-solutions`: Warns about custom implementations

## Migration Guide

### Moving Existing Files

1. **Identify loose files**:
   ```bash
   find . -maxdepth 1 -type f -not -name '.*' | grep -v -E '\.(toml|json|md|lock)$'
   ```

2. **Move by type**:
   ```bash
   # Scripts → scripts/
   mv *.sh scripts/

   # Configs → configs/
   mv *.json configs/

   # Docs → docs/
   mv *.md docs/
   ```

3. **Replace custom implementations**:
   ```bash
   # Instead of: docker run custom commands
   # Use: docker-compose.yml or vendor tools

   # Instead of: custom shell scripts
   # Use: vendor CLI tools and configs
   ```

### Fixing Hardcoded Values

**Before**:
```javascript
const dbUrl = "localhost:5432/myapp";
const apiUrl = "http://127.0.0.1:3000";
```

**After**:
```javascript
const dbUrl = process.env.DATABASE_URL;
const apiUrl = process.env.API_URL;
```

## Quality Gates

### Automated Checks

- ✅ **Loose Files**: Pre-commit hook blocks commits
- ✅ **Hardcoded Values**: ESLint rules prevent commits
- ✅ **Vendor Compliance**: Static analysis flags violations
- ✅ **Directory Structure**: CI/CD validates organization

### Manual Reviews

- Code reviews check for organization violations
- Architecture reviews validate vendor usage
- Security reviews verify no custom implementations

## Benefits

### Developer Experience

- **Predictable Structure**: Always know where to find files
- **Reduced Cognitive Load**: Clear separation of concerns
- **Tool Integration**: Vendor tools work seamlessly
- **CI/CD Reliability**: Consistent structure for automation

### Maintenance

- **Easier Refactoring**: Clear boundaries between components
- **Vendor Updates**: Easy to update vendor solutions
- **Dependency Management**: Centralized package management
- **Documentation**: Self-documenting structure

### Compliance

- **Audit Ready**: Clear separation for compliance reviews
- **Vendor Support**: Official support for vendor tools
- **Security**: Reduced custom code surface area
- **Standards**: Industry-standard organization patterns

## Troubleshooting

### Common Issues

**"Commit blocked by organization check"**
- Run: `node scripts/organize-codebase-audit.cjs`
- Fix violations shown in output
- Retry commit

**"ESLint errors about root files"**
- Move files to appropriate directories
- Update imports if necessary
- Re-run linting

**"Hardcoded value errors"**
- Replace with environment variables
- Add to configuration files
- Update documentation

### Getting Help

1. Check `docs/organization-standards.md` (this file)
2. Run audit: `node scripts/organize-codebase-audit.cjs`
3. View examples in `docs/examples/`
4. Ask in `#devops` channel for migration help

## Examples

### Good Organization

```
project/
├── pixi.toml              # Root - allowed
├── docs/
│   ├── README.md          # Project docs
│   └── api/
│       └── endpoints.md   # API documentation
├── scripts/
│   ├── build.sh           # Build scripts
│   └── deploy.cjs         # Deployment scripts
├── configs/
│   ├── database/
│   │   └── postgres.toml  # DB configs
│   └── api/
│       └── gateway.yaml   # API configs
├── infra/
│   └── docker/
│       └── compose.yml    # Docker orchestration
└── database/
    └── migrations/        # DB migrations
```

### Bad Organization (Blocked)

```
project/
├── deploy.sh             # ❌ Loose file - move to scripts/
├── config.json           # ❌ Loose file - move to configs/
├── docker-compose.yml    # ❌ Loose file - move to infra/docker/
├── custom-script.py      # ❌ Custom script - replace with vendor tool
└── docs/
    ├── api.json          # ❌ Wrong type - move to api/ or configs/
    └── script.sh         # ❌ Wrong type - move to scripts/
```