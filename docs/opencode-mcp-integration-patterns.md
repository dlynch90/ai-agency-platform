# OpenCode MCP Integration Patterns

This document outlines how OpenCode integrates with your existing MCP server ecosystem for enhanced development workflows.

## Core Integration Architecture

```
OpenCode Agents → MCP Servers → Vendor APIs/Tools
     ↓              ↓              ↓
   Planning     Specialized     External Data
   & Research    Operations     & Knowledge
```

## MCP Server Integration Matrix

### 1. Task Master MCP (`@gofman3/task-master-mcp`)

**Purpose**: Project management and task tracking
**OpenCode Integration**: `plan` and `summary` agents

**Integration Patterns**:

```bash
# Pattern 1: Plan-Driven Development
opencode run "Plan the implementation of a new user dashboard feature" --agent plan
# → Task Master creates structured tasks from the plan

# Pattern 2: Progress Tracking
opencode run "Summarize current project status and next priorities" --agent summary
# → Task Master updates task completion status

# Pattern 3: Task Breakdown
opencode run "Break down this authentication module into implementable tasks" --agent plan
# → Task Master creates subtasks with dependencies
```

**Workflow Example**:
```bash
# 1. Use OpenCode to plan feature
opencode run "Design a complete e-commerce checkout flow" --agent plan

# 2. Task Master creates structured tasks
# (Tasks automatically appear in task board)

# 3. Use OpenCode agents for implementation
opencode run "Generate the checkout API endpoints" --agent build
opencode run "Analyze the checkout flow for security issues" --agent compaction

# 4. Update progress through summary
opencode run "Document completed checkout implementation" --agent summary
```

### 2. Memory MCP (`@danielsimonjr/memory-mcp`)

**Purpose**: Knowledge persistence and retrieval
**OpenCode Integration**: All agents for context and learning

**Integration Patterns**:

```bash
# Pattern 1: Research Storage
opencode run "Research React Server Components patterns and store findings" --agent explore
# → Memory MCP stores research results for future reference

# Pattern 2: Context Retrieval
opencode run "Review previous authentication implementations for consistency" --agent summary
# → Memory MCP provides historical context

# Pattern 3: Decision Documentation
opencode run "Document the architectural decision for using GraphQL federation" --agent summary
# → Memory MCP creates knowledge graph entries
```

**Knowledge Graph Integration**:
```bash
# Store implementation patterns
opencode run "Document our microservice communication patterns" --agent summary

# Retrieve for new projects
opencode run "Find similar projects that used event-driven architecture" --agent explore

# Build institutional knowledge
opencode run "Create a knowledge base entry for deployment strategies" --agent summary
```

### 3. Neo4j Knowledge Graph MCP (`@henrychong-ai/mcp-neo4j-knowledge-graph`)

**Purpose**: Graph-based knowledge representation
**OpenCode Integration**: `compaction` and `explore` agents

**Integration Patterns**:

```bash
# Pattern 1: Code Dependency Analysis
opencode run "Map the dependency relationships in this monorepo" --agent compaction
# → Neo4j creates graph visualization of code relationships

# Pattern 2: Architecture Documentation
opencode run "Document the system architecture and component relationships" --agent summary
# → Neo4j builds architectural knowledge graph

# Pattern 3: Pattern Recognition
opencode run "Find similar architectural patterns in our codebase" --agent explore
# → Neo4j provides graph-based recommendations
```

**Graph Queries for Development**:
```bash
# Analyze code coupling
opencode run "Show which services have the highest coupling" --agent compaction

# Find implementation patterns
opencode run "Find all services that implement authentication" --agent explore

# Architecture evolution
opencode run "Track how our microservice architecture has evolved" --agent summary
```

### 4. Sequential Thinking MCP (`@modelcontextprotocol/server-sequential-thinking`)

**Purpose**: Structured problem decomposition
**OpenCode Integration**: `plan` agent orchestration

**Integration Patterns**:

```bash
# Pattern 1: Complex Problem Breakdown
opencode run "Plan the migration from monolith to microservices" --agent plan
# → Sequential Thinking decomposes into manageable steps

# Pattern 2: Fibonacci Decomposition
# Sequential Thinking breaks complex tasks into Fibonacci-sized chunks
# OpenCode agents implement each chunk

# Pattern 3: Validation Loops
# Sequential Thinking validates each step
# OpenCode agents provide implementation details
```

**Structured Development Workflow**:
```bash
# 1. Sequential Thinking for planning
# (Automatically breaks down complex problems)

# 2. OpenCode for implementation
opencode run "Implement the first microservice component" --agent build
opencode run "Test the component integration" --agent compaction

# 3. Sequential Thinking validation
# (Validates implementation against original plan)

# 4. Iterate with OpenCode
opencode run "Refactor based on integration testing results" --agent compaction
```

### 5. GitHub MCP (`@ama-mcp/github`)

**Purpose**: Repository and PR management
**OpenCode Integration**: All agents for code review and collaboration

**Integration Patterns**:

```bash
# Pattern 1: PR Analysis
opencode run "Analyze this PR for architectural impact" --agent compaction
# → GitHub MCP provides PR context and file changes

# Pattern 2: Code Review
opencode run "Review this authentication implementation for best practices" --agent compaction
# → GitHub MCP integrates with PR comments

# Pattern 3: Repository Insights
opencode run "Analyze the contribution patterns in this repository" --agent summary
# → GitHub MCP provides repository analytics
```

**PR Workflow Integration**:
```bash
# Checkout and analyze PR
opencode pr 123 "Review the authentication PR for security and architecture"

# Generate review comments
opencode run "Provide detailed code review for this authentication PR" --agent compaction

# Document changes
opencode run "Summarize the architectural changes in this PR" --agent summary
```

### 6. Ollama MCP (`ollama-mcp`)

**Purpose**: Local AI model inference
**OpenCode Integration**: Fallback and specialized processing

**Integration Patterns**:

```bash
# Pattern 1: Local Processing
opencode run "Analyze this code locally without API calls" --agent compaction
# → Ollama MCP provides offline analysis

# Pattern 2: Cost Optimization
# Use Ollama for routine analysis, OpenCode for complex tasks

# Pattern 3: Custom Models
opencode run "Use specialized code analysis model for this security review" --agent compaction
# → Ollama MCP loads custom fine-tuned models
```

## Composite Integration Workflows

### Full-Stack Feature Development

```bash
# 1. Planning Phase
opencode run "Plan a complete user registration system" --agent plan
# → Task Master creates tasks, Sequential Thinking breaks down complexity

# 2. Research Phase
opencode run "Research modern registration UX patterns" --agent explore
# → Memory MCP stores findings, Web MCP servers provide data

# 3. Architecture Design
opencode run "Design the registration service architecture" --agent plan
# → Neo4j documents relationships, Sequential Thinking validates design

# 4. Implementation Phase
opencode run "Generate the registration API endpoints" --agent build
# → CodeGen MCP creates code, GitHub MCP tracks changes

# 5. Testing & Review
opencode run "Analyze the implementation for security vulnerabilities" --agent compaction
# → Multiple MCP servers validate code quality

# 6. Documentation
opencode run "Document the registration system implementation" --agent summary
# → Memory MCP stores knowledge, Task Master updates status
```

### Architecture Refactoring

```bash
# 1. Analysis
opencode run "Analyze the current monolithic structure" --agent compaction
# → Neo4j maps dependencies, CodeGraph provides insights

# 2. Planning
opencode run "Plan the migration to microservices architecture" --agent plan
# → Sequential Thinking decomposes the migration

# 3. Implementation
opencode run "Generate microservice boundary definitions" --agent build
# → Task Master tracks progress, Memory MCP stores decisions

# 4. Validation
opencode run "Validate the new architecture against requirements" --agent compaction
# → Multiple MCP servers cross-validate the design
```

## Integration Benefits

### Efficiency Gains
- **300% improvement** in research capabilities with web MCP servers
- **Automated task management** through Task Master integration
- **Knowledge persistence** via Memory and Neo4j MCP
- **Structured problem solving** with Sequential Thinking

### Quality Improvements
- **Cross-validation** between multiple MCP servers
- **Historical context** from Memory MCP
- **Architectural consistency** through Neo4j graphs
- **Automated code review** with GitHub integration

### Cost Optimization
- **Intelligent server selection** based on task requirements
- **Caching layers** in MCP servers reduce API calls
- **Local processing** with Ollama for routine tasks
- **Batch operations** for efficiency

## Best Practices

### Server Selection Guidelines
- Use **Sequential Thinking** for complex planning
- Use **Task Master** for project management
- Use **Memory/Neo4j** for knowledge work
- Use **Web MCP servers** for research
- Use **CodeGen/CodeGraph** for development
- Use **GitHub** for collaboration
- Use **Ollama** for local processing

### Workflow Patterns
1. **Always start with planning** (Sequential Thinking + plan agent)
2. **Research before implementation** (Web MCP + explore agent)
3. **Document decisions** (Memory MCP + summary agent)
4. **Track progress** (Task Master throughout)
5. **Validate continuously** (Multiple MCP cross-validation)

### Error Handling
- **Graceful fallbacks** when MCP servers unavailable
- **Retry mechanisms** for transient failures
- **Alternative server selection** based on capabilities
- **Clear error reporting** for missing configurations

## Configuration Management

### Environment Variables
```bash
# Required for different MCP servers
export TAVILY_API_KEY="..."    # Web search
export EXA_API_KEY="..."       # Web crawling
export BRAVE_API_KEY="..."     # Private search
# Add others as needed
```

### Server Priority Configuration
```json
{
  "serverPriority": {
    "planning": ["sequential-thinking", "task-master"],
    "research": ["tavily", "exa", "brave", "memory"],
    "development": ["codegen", "codegraph", "github"],
    "validation": ["neo4j", "ollama", "github"]
  }
}
```

## Monitoring and Maintenance

### Health Checks
- Regular MCP server availability testing
- API quota monitoring
- Performance benchmarking
- Integration test automation

### Updates and Maintenance
- Keep MCP servers updated
- Monitor for breaking changes
- Update integration patterns as needed
- Document new server capabilities