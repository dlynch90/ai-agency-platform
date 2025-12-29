## Claude-Flow v2.7.47 Comprehensive Evaluation Report (2025-12-16)

### Installation Status
- **Installed via**: mise shims at /Users/daniellynch/.local/share/mise/shims/claude-flow
- **Version**: v2.7.47 (verified via `npx claude-flow@alpha --version`)
- **Startup Time**: 3.894s ± 0.097s (slow due to npx overhead)

### BUGS FOUND
1. **Path Resolution Bug**: `mkdir '/.claude-flow'` tries to create at root instead of home dir
2. **SPARC Config Path Bug**: Looking for `//.claude/sparc-modes.json` (double slash)
3. **Metrics Init Bug**: ENOENT error on first run

### MCP Tools Tested (20+)
Working: github, context7, firecrawl, exa-search, tavily, brave-search, desktop-commander, memory, filesystem, mongodb (needs connection), byterover, sequential-thinking

### CLI Tools Verified
- ast-grep v0.40.3, fd v10.3.0, tokei v13.0.0, op v2.32.0, mise v2025.12.7, gibson v0.8.12, hyperfine

### GitHub Analysis (from ruvnet)
- claude-flow: 10.7k stars, 1.4k forks
- agentic-flow: 276 stars (ReasoningBank backend)
- flow-nexus: 63 stars (cloud platform)

### Structural DOF: 25,715 (statically indeterminate system)