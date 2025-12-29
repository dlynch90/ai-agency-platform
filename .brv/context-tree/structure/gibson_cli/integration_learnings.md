## Gibson CLI v0.8.12 Integration Learnings

### Root Causes Identified

**1. Exit Code 1 on Help Commands**
- Gibson CLI returns exit code 1 for help/usage output (expected behavior, not an error)
- Detection: Check if output contains "Usage:", "Commands:", "Options:" patterns
- Pattern name: `gibson-cli-help-exit-code-1`

**2. GIBSONAI_PROJECT Configuration**
- Must be set in mise.toml [env], NOT shell export (mise shims don't inherit shell env)
- Requires project entry in `~/.gibsonai/config` file (JSON format)
- Project name (e.g., "MCP Catalog") NOT UUID should be used
- Pattern name: `gibsonai-project-env-mise-config`

**3. Empty Config File Crash**
- `~/.gibsonai/config` must exist and contain project entries
- Empty `{}` file causes KeyError when GIBSONAI_PROJECT is set
- Pattern name: `gibson-cli-empty-config-keyerror`

**4. PATH Conflicts**
- uv-installed gibson at `/Users/.local/bin/gibson` conflicts with mise shim
- Solution: `uv tool uninstall gibson-cli` to remove conflicting installation
- mise shim should be at `/Users/.local/share/mise/shims/gibson`

### Config File Structure Required

```json
{
  "ProjectName": {
    "id": "uuid-here",
    "api": {"key": "api-key"},
    "code": {
      "custom": {"model": {"class": null, "path": null}},
      "frameworks": {...},
      "language": "python"
    },
    "datastore": {"type": "...", "uri": "..."},
    "dev": {...},
    "meta": {"project": {"description": "..."}, "version": "..."},
    "modeler": {"version": "..."}
  }
}
```

### Setup Workflow

1. Install via mise: `mise use -g pipx:gibson-cli@0.8.12`
2. Authenticate: `gibson auth login`
3. Create project: `gibson new project` (interactive)
4. Set mise env: Add `GIBSONAI_PROJECT = "project-name"` to `.mise.toml [env]`
5. Verify: `gibson list entities`

### Files Created

- Rule: `~/.config/claude/rules/008-error-pattern-recognition.md`
- Service: `/Users/daniellynch/Developer/vendor-catalog/src/services/error-patterns.ts`
- MongoDB client: `/Users/daniellynch/Developer/vendor-catalog/src/lib/mongodb.ts`

### Key Insight

Gibson CLI's Configuration class crashes immediately if GIBSONAI_PROJECT is set but the project doesn't exist in the local config file. The config file must be populated by running `gibson new project` first.