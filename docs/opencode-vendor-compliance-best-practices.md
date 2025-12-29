# OpenCode Vendor Compliance Best Practices

This guide establishes best practices for using OpenCode within your vendor-compliant development workflow, ensuring no custom code violations while maximizing productivity.

## Core Principles

### 1. Zero Custom Code Enforcement
- ✅ **Use OpenCode agents** instead of custom scripts
- ✅ **Leverage MCP servers** for all specialized operations
- ✅ **Follow vendor API patterns** from Anthropic, Google, OpenAI
- ❌ **Never create custom implementations**

### 2. Vendor Solution Priority
**Always use vendor solutions in this order:**
1. **OpenCode agents** (primary interface)
2. **MCP servers** (specialized operations)
3. **Vendor APIs** (external integrations)
4. **Vendor CLI tools** (infrastructure operations)

## Workflow Patterns

### Planning Phase (Sequential Thinking → Task Master)

```bash
# ❌ Wrong: Custom planning script
# ./custom-planning.sh "design api"

# ✅ Correct: Vendor solution
opencode run "Design a REST API for user management" --agent plan
# → Task Master creates structured tasks
```

### Research Phase (Web MCP → Memory MCP)

```bash
# ❌ Wrong: Custom web scraping
# python custom_scraper.py

# ✅ Correct: Vendor MCP servers
opencode run "Research modern API authentication patterns" --agent explore
# → Tavily/Exa/Brave MCP + Memory MCP storage
```

### Implementation Phase (CodeGen MCP → GitHub MCP)

```bash
# ❌ Wrong: Custom code generation
# node custom-generator.js

# ✅ Correct: Vendor codegen
opencode run "Generate TypeScript interfaces for user API" --agent build
# → CodeGen MCP creates code + GitHub MCP tracks changes
```

### Review Phase (CodeGraph MCP → Neo4j MCP)

```bash
# ❌ Wrong: Custom analysis tools
# ./custom-analyzer.sh

# ✅ Correct: Vendor analysis
opencode run "Analyze code dependencies and architecture" --agent compaction
# → CodeGraph + Neo4j create knowledge graph
```

## Agent Usage Guidelines

### Plan Agent (Strategic Planning)
**Use for**: Architecture design, feature planning, complex workflows
**MCP Integration**: Sequential Thinking, Task Master
**Best Practices**:
- Break complex features into manageable tasks
- Define clear acceptance criteria
- Establish architectural boundaries

### Explore Agent (Research & Discovery)
**Use for**: Requirements gathering, technology research, information retrieval
**MCP Integration**: Tavily, Exa, Brave, Memory
**Best Practices**:
- Research before implementation decisions
- Store findings in knowledge base
- Cross-reference multiple sources

### Build Agent (Code Generation)
**Use for**: Component creation, API development, boilerplate generation
**MCP Integration**: CodeGen, GitHub
**Best Practices**:
- Generate from established patterns
- Use vendor templates and boilerplates
- Ensure generated code follows standards

### Compaction Agent (Code Analysis)
**Use for**: Refactoring, optimization, security review, architecture validation
**MCP Integration**: CodeGraph, Neo4j, GitHub
**Best Practices**:
- Regular code quality assessments
- Identify architectural improvements
- Validate against best practices

### Summary Agent (Documentation)
**Use for**: Progress tracking, knowledge capture, decision documentation
**MCP Integration**: Memory, Neo4j, Task Master
**Best Practices**:
- Document architectural decisions
- Track implementation progress
- Build institutional knowledge

## Compliance Enforcement

### File Type Restrictions
**Permitted in vendor workflow:**
- ✅ OpenCode session files (`docs/sessions/`)
- ✅ MCP-generated content
- ✅ Vendor API responses
- ✅ Documentation from agents

**Prohibited (custom code violations):**
- ❌ Custom `.sh` scripts
- ❌ Custom `.py` utilities
- ❌ Custom `.js` tools
- ❌ Custom analysis scripts
- ❌ Custom build tools

### Directory Structure Compliance

```
✅ Approved Structure:
docs/
├── sessions/           # OpenCode session management
├── plans/             # Task Master generated plans
└── lessons-learned/   # Agent-generated insights

❌ Prohibited Custom Structure:
scripts/
├── custom-analyzer.py    # Custom code violation
├── build-helper.sh       # Custom code violation
└── planning-tool.js      # Custom code violation
```

## Quality Assurance Patterns

### Testing Integration
```bash
# ❌ Wrong: Custom test generation
# ./generate-tests.sh

# ✅ Correct: Vendor-integrated testing
opencode run "Generate comprehensive tests for user API" --agent build
opencode run "Analyze test coverage and quality" --agent compaction
```

### Code Review Process
```bash
# ❌ Wrong: Custom review tools
# ./code-review.py

# ✅ Correct: Vendor review process
opencode run "Perform comprehensive code review for security and best practices" --agent compaction
opencode run "Generate PR description and checklist" --agent summary
```

### Performance Optimization
```bash
# ❌ Wrong: Custom profiling tools
# python custom_profiler.py

# ✅ Correct: Vendor analysis
opencode run "Analyze performance bottlenecks in the application" --agent compaction
opencode run "Suggest optimization strategies based on vendor best practices" --agent explore
```

## Cost Management

### API Usage Optimization
```bash
# Use local processing when possible
opencode run "Analyze code locally without external APIs" --agent compaction
# → Uses CodeGraph MCP instead of web searches

# Batch related queries
opencode run "Research authentication patterns, session management, and security best practices" --agent explore
# → Single session reduces API calls

# Cache research results
opencode run "Retrieve previous authentication research from knowledge base" --agent summary
# → Uses Memory MCP cache
```

### Resource Allocation
- **High-complexity tasks**: Use premium models (Claude Opus, GPT-5)
- **Standard development**: Use efficient models (Claude Haiku, Gemini Flash)
- **Research tasks**: Use web-integrated models
- **Local analysis**: Use Ollama MCP for offline processing

## Error Handling & Recovery

### MCP Server Failures
```bash
# Graceful degradation
opencode run "Continue development work using available local tools" --agent build
# → Falls back to CodeGen MCP if web servers unavailable

# Alternative server selection
opencode run "Research using available search providers" --agent explore
# → Automatically tries different MCP servers
```

### API Limit Handling
```bash
# Monitor usage
opencode stats
# → Shows token usage and costs

# Switch to local processing
opencode run "Analyze code using local tools only" --agent compaction
# → Uses CodeGraph without external APIs
```

## Security & Compliance

### Data Handling
- **Never store sensitive data** in session files
- **Use vendor encryption** for sensitive operations
- **Follow vendor security patterns** from agent recommendations

### Audit Trail
- **All decisions documented** through summary agent
- **Session exports maintained** in `docs/sessions/`
- **Vendor compliance verified** through agent analysis

## Performance Optimization

### Workflow Efficiency
```bash
# Parallel processing where possible
opencode run "Research API patterns" --agent explore &
opencode run "Design database schema" --agent plan &
wait

# Session continuation for iterative work
opencode --continue
# → Maintains context across sessions

# Batch operations
opencode run "Generate API, tests, and documentation" --agent build
```

### Caching Strategy
- **MCP server responses** cached automatically
- **Research results** stored in Memory MCP
- **Code patterns** saved in Neo4j graphs
- **Session state** persisted for continuity

## Team Collaboration

### Knowledge Sharing
```bash
# Document decisions
opencode run "Document the architectural decision and rationale" --agent summary

# Share research findings
opencode run "Create knowledge base entry for this research" --agent summary

# Export session for review
./opencode-session-manager.sh export session_id
```

### Code Review Integration
```bash
# Automated PR analysis
opencode pr 123 "Review authentication implementation"

# Generate review feedback
opencode run "Provide detailed code review comments" --agent compaction

# Document review decisions
opencode run "Summarize review findings and decisions" --agent summary
```

## Continuous Improvement

### Feedback Loop
```bash
# Analyze workflow effectiveness
opencode run "Analyze development workflow efficiency and bottlenecks" --agent compaction

# Identify improvement opportunities
opencode run "Suggest workflow optimizations based on usage patterns" --agent explore

# Implement improvements
opencode run "Update development processes based on analysis" --agent plan
```

### Metrics Tracking
- **Session completion rates** via session manager
- **Task completion** via Task Master integration
- **Knowledge base growth** via Memory MCP
- **Code quality metrics** via CodeGraph analysis

## Emergency Procedures

### System Recovery
```bash
# If MCP servers unavailable
opencode run "Continue with local tools and cached knowledge" --agent build

# If OpenCode unavailable
# Use MCP servers directly through launcher
./mcp-launcher.sh codegen
```

### Data Recovery
```bash
# Export all sessions
./opencode-session-manager.sh export $(./opencode-session-manager.sh list | grep active | awk '{print $1}')

# Backup knowledge base
# Memory MCP and Neo4j handle their own persistence
```

## Compliance Validation

### Regular Audits
```bash
# Check for custom code violations
opencode run "Audit codebase for vendor compliance violations" --agent compaction

# Validate workflow adherence
opencode run "Review development process compliance" --agent summary

# Update compliance documentation
opencode run "Document current compliance status and improvements" --agent summary
```

### Automated Checks
- **Pre-commit hooks** validate file types
- **MCP server tests** ensure integration health
- **Session audits** verify proper usage patterns
- **Cost monitoring** prevents budget overruns

---

## Quick Reference

### ✅ DO Use:
- OpenCode agents for all tasks
- MCP servers for specialized operations
- Vendor APIs and integrations
- Session management tools
- Documentation generation

### ❌ DON'T Use:
- Custom scripts or utilities
- Manual file creation (except docs)
- Non-vendor tools or libraries
- Hardcoded configurations
- Console.log debugging

### 🚀 Best Starting Commands:
```bash
# New feature development
opencode run "Plan and implement user authentication" --agent plan

# Research task
opencode run "Research modern frontend architecture patterns" --agent explore

# Code generation
opencode run "Generate a complete React component library" --agent build

# Code analysis
opencode run "Analyze codebase for performance improvements" --agent compaction
```

This ensures maximum productivity while maintaining 100% vendor compliance and avoiding any custom code violations.