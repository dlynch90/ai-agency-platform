Claude Flow Swarm Initialization Configuration:

```json
{
  "swarmId": "cf-swarm-init-2025-12-16",
  "objective": "init",
  "strategy": "auto",
  "mode": "centralized",
  "maxAgents": 5,
  "timeout": "60 minutes",
  "parallelExecution": true,
  "agents": {
    "coordinator": {"type": "queen-coordinator", "status": "spawned"},
    "researcher": {"type": "researcher", "status": "spawned"},
    "architect": {"type": "system-architect", "status": "spawned"}
  },
  "taskHierarchy": {
    "root": "Swarm Initialization",
    "phases": ["S-Specification", "P-Pseudocode", "A-Architecture", "R-Refinement", "C-Completion"]
  }
}
```

Key patterns for Claude Flow swarms:
- Use Task tool for agent spawning (not MCP tools alone)
- Spawn all agents in parallel when possible
- Use TodoWrite for batch task tracking
- Store coordination state in memory for agent sharing
