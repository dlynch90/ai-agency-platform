## dr-sosa Project Configuration Knowledge

### Project Structure
```
dr-sosa/
├── services/
│   ├── ai-agent/       # AI agent microservice
│   ├── hasura/         # GraphQL engine with Hasura
│   └── wp-prisma/      # WordPress Prisma ORM integration
├── web/                # WordPress frontend
│   ├── app/           # Application themes/plugins
│   └── wp/            # WordPress core
├── infra/              # Infrastructure as Code
│   ├── docker/        # Container configurations
│   ├── helm/          # Kubernetes Helm charts
│   ├── k8s/           # Kubernetes manifests
│   └── terraform/     # Infrastructure provisioning
└── config/             # Application configuration
```

### Build System
- **Monorepo**: pnpm workspaces with Turbo
- **PHP**: Composer for dependency management
- **Node**: pnpm for JavaScript/TypeScript packages
- **Build**: turbo.json for parallel builds

### Key Configuration Files
- `composer.json` - PHP dependencies (roots/wordpress, vlucas/phpdotenv)
- `pnpm-workspace.yaml` - Workspace packages definition
- `turbo.json` - Turborepo build configuration
- `mise.toml` - Tool version management
- `biome.json` - JavaScript/TypeScript linting

### Development Environment
- **DDEV**: Local WordPress development (.ddev/)
- **Docker**: Container orchestration
- **Mise**: Runtime version management

### MCP Integration Points
- ChromaDB for vector storage
- OctoCode for GitHub integration
- Desktop Commander for file operations
- ByteRover for knowledge persistence