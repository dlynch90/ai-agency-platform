## macOS CPU/Memory Optimization Runbook - 2025-12-18

### Root Causes Identified:
1. **Runaway ripgrep (rg) processes** - Cursor extension searching entire filesystem with `--no-ignore` flag consuming 130%+ CPU each
2. **Recursive find commands** - MCP servers triggering unbounded `find /Users` scans
3. **Memory leaks** - Tailwind extension (7.8GB), Verdent app renderer
4. **Process storms** - Multiple IDEs (Cursor, Zed, Verdent) competing for resources

### Immediate Fixes Applied:
```bash
# Kill runaway ripgrep processes
pkill -9 -f "rg --files --hidden.*--no-ignore"

# Kill recursive find processes
pkill -9 -f "find /Users/daniellynch"

# Close resource-heavy apps
osascript -e 'quit app "Verdent"'
osascript -e 'quit app "Zed"'
```

### Results:
- Load Average: 85 → 23 (73% reduction)
- CPU Idle: 0% → 55%
- Memory Free: 15GB → 27GB (80% improvement)
- Threads: 5752 → 4295

### Vendor Tools Installed:
- `btm` (bottom) - process monitor via mise
- `procs` - modern ps replacement via Homebrew
- `monit` - process watchdog service
- `htop`/`glances` - interactive monitors

### Process Watchdog Commands:
```bash
# Start monit watchdog
brew services start monit

# Check top processes
procs --sortd cpu | head -20

# View system overview
btm
```

### Prevention:
1. Limit Cursor file watchers to specific directories
2. Use `.cursorignore` to exclude large directories
3. Monitor MCP server processes for runaway scans
4. Configure monit for automatic process management