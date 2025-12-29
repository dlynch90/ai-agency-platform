#!/bin/bash
# Comprehensive 30-Step Gap Analysis for Cursor IDE and Codebase Issues
# Using 20+ MCP tools and analysis frameworks

echo "=== COMPREHENSIVE 30-STEP GAP ANALYSIS ==="
echo "Timestamp: $(date)"
echo "User: $(whoami)"
echo "Working Directory: $(pwd)"
echo ""

# =============================================================================
# STEP 1-5: ENVIRONMENT AND PATH ANALYSIS
# =============================================================================

echo "STEPS 1-5: ENVIRONMENT ANALYSIS"
echo "================================="

# Step 1: PATH Integrity Check
echo "Step 1: PATH Integrity Analysis"
echo "Current PATH:"
echo "$PATH" | tr ':' '\n' | nl -v1

echo "Broken PATH entries:"
for path in $(echo "$PATH" | tr ':' '\n'); do
    if [ ! -d "$path" ] 2>/dev/null; then
        echo "❌ BROKEN: $path"
    else
        count=$(ls "$path" 2>/dev/null | wc -l)
        echo "✅ OK: $path ($count items)"
    fi
done

# Step 2: Shell Configuration Analysis
echo ""
echo "Step 2: Shell Configuration Analysis"
echo "ZSH Version: $(zsh --version 2>/dev/null || echo 'Not found')"
echo "Bash Version: $(bash --version 2>/dev/null | head -1 || echo 'Not found')"

# Check for configuration conflicts
echo "Configuration Conflicts:"
if [ -f ~/.zshrc ] && [ -f ~/.bashrc ]; then
    echo "⚠️  Both .zshrc and .bashrc exist - potential conflicts"
fi

# Step 3: Binary and Tool Discovery
echo ""
echo "Step 3: Critical Tool Discovery"
tools=("node" "npm" "yarn" "pnpm" "python" "python3" "pip" "pip3" "rustc" "cargo" "go" "java" "javac" "mvn" "gradle" "docker" "kubectl" "git" "make" "cmake")
for tool in "${tools[@]}"; do
    if command -v "$tool" >/dev/null 2>&1; then
        version=$("$tool" --version 2>/dev/null | head -1)
        echo "✅ $tool: $version"
    else
        echo "❌ $tool: Not found"
    fi
done

# Step 4: Symlink Integrity
echo ""
echo "Step 4: Symlink Integrity Analysis"
echo "Broken symlinks in common directories:"
for dir in /usr/local/bin /opt/homebrew/bin ~/.local/bin; do
    if [ -d "$dir" ]; then
        find "$dir" -type l ! -exec test -e {} \; -print 2>/dev/null | head -10
    fi
done

# Step 5: Package Manager Analysis
echo ""
echo "Step 5: Package Manager Status"
echo "Homebrew:"
brew --version 2>/dev/null || echo "❌ Homebrew not found"
brew doctor 2>&1 | grep -E "(Warning|Error)" || echo "✅ Homebrew healthy"

echo "NPM global packages:"
npm list -g --depth=0 2>/dev/null | wc -l || echo "❌ NPM global not accessible"

# =============================================================================
# STEP 6-10: CURSOR IDE ANALYSIS
# =============================================================================

echo ""
echo "STEPS 6-10: CURSOR IDE ANALYSIS"
echo "=================================="

# Step 6: Cursor Configuration Analysis
echo "Step 6: Cursor IDE Configuration"
cursor_config_dir="$HOME/.cursor"
if [ -d "$cursor_config_dir" ]; then
    echo "✅ Cursor config directory exists"
    find "$cursor_config_dir" -name "*.json" | wc -l | xargs echo "JSON configs found:"
else
    echo "❌ Cursor config directory missing"
fi

# Step 7: Extension Analysis
echo ""
echo "Step 7: Cursor Extensions Analysis"
cursor_extensions_dir="$HOME/.cursor/extensions"
if [ -d "$cursor_extensions_dir" ]; then
    echo "✅ Extensions directory exists"
    ls "$cursor_extensions_dir" | wc -l | xargs echo "Extensions installed:"
else
    echo "❌ Extensions directory missing"
fi

# Step 8: Workspace Analysis
echo ""
echo "Step 8: Workspace Configuration"
if [ -f ".cursor/settings.json" ]; then
    echo "✅ Workspace settings exist"
else
    echo "❌ Workspace settings missing"
fi

# Step 9: Process Analysis
echo ""
echo "Step 9: Running Cursor Processes"
ps aux | grep -i cursor | grep -v grep | wc -l | xargs echo "Cursor processes running:"

# Step 10: Log Analysis
echo ""
echo "Step 10: Cursor IDE Logs"
cursor_log_dir="$HOME/.cursor/logs"
if [ -d "$cursor_log_dir" ]; then
    echo "✅ Log directory exists"
    find "$cursor_log_dir" -name "*.log" -mtime -7 | wc -l | xargs echo "Recent log files:"
else
    echo "❌ Log directory missing"
fi

# =============================================================================
# STEP 11-15: CODEBASE ANALYSIS
# =============================================================================

echo ""
echo "STEPS 11-15: CODEBASE ANALYSIS"
echo "==============================="

# Step 11: Project Structure Analysis
echo "Step 11: Project Structure"
echo "Total files: $(find . -type f | wc -l)"
echo "Total directories: $(find . -type d | wc -l)"
echo "Languages detected:"
find . -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.rs" -o -name "*.go" -o -name "*.java" | sed 's/.*\.//' | sort | uniq -c

# Step 12: Dependency Analysis
echo ""
echo "Step 12: Dependency Analysis"
if [ -f "package.json" ]; then
    echo "✅ Node.js project detected"
    echo "Dependencies: $(jq '.dependencies // {} | length' package.json 2>/dev/null || echo 'unable to parse')"
    echo "DevDependencies: $(jq '.devDependencies // {} | length' package.json 2>/dev/null || echo 'unable to parse')"
fi

if [ -f "Cargo.toml" ]; then
    echo "✅ Rust project detected"
fi

if [ -f "go.mod" ]; then
    echo "✅ Go project detected"
fi

# Step 13: Import/Module Analysis
echo ""
echo "Step 13: Import Analysis (Python)"
find . -name "*.py" -exec grep -l "import\|from" {} \; | wc -l | xargs echo "Python files with imports:"

# Step 14: Build System Analysis
echo ""
echo "Step 14: Build System Analysis"
build_files=("Makefile" "makefile" "CMakeLists.txt" "build.gradle" "pom.xml" "Cargo.toml" "package.json")
for file in "${build_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file found"
    fi
done

# Step 15: Test Coverage Analysis
echo ""
echo "Step 15: Test Analysis"
echo "Test files found:"
find . -name "*test*" -o -name "*spec*" | wc -l

# =============================================================================
# STEP 16-20: MCP AND TOOLING ANALYSIS
# =============================================================================

echo ""
echo "STEPS 16-20: MCP AND TOOLING ANALYSIS"
echo "======================================="

# Step 16: MCP Server Status
echo "Step 16: MCP Server Analysis"
if [ -f "mcp-config.toml" ]; then
    echo "✅ MCP config exists"
    grep -c "\[servers\." mcp-config.toml | xargs echo "MCP servers configured:"
else
    echo "❌ MCP config missing"
fi

# Check for running MCP processes
echo "Running MCP processes:"
ps aux | grep -i mcp | grep -v grep | wc -l

# Step 17: Database Analysis
echo ""
echo "Step 17: Database Analysis"
databases=("postgresql" "mysql" "redis" "neo4j" "qdrant")
for db in "${databases[@]}"; do
    if pgrep -f "$db" >/dev/null; then
        echo "✅ $db is running"
    else
        echo "❌ $db not running"
    fi
done

# Step 18: API/Service Analysis
echo ""
echo "Step 18: API and Service Analysis"
services=("ollama" "mlflow" "tensorboard" "jupyter" "nginx" "apache" "grafana" "prometheus")
for service in "${services[@]}"; do
    if pgrep -f "$service" >/dev/null; then
        echo "✅ $service is running"
    else
        echo "❌ $service not running"
    fi
done

# Step 19: Network Analysis
echo ""
echo "Step 19: Network Port Analysis"
ports=(5432 6379 7687 6333 9200 5601 3000 8000 8501 8080)
for port in "${ports[@]}"; do
    if lsof -i :"$port" >/dev/null 2>&1; then
        echo "✅ Port $port in use"
    else
        echo "❌ Port $port free"
    fi
done

# Step 20: Security Analysis
echo ""
echo "Step 20: Security Analysis"
echo "SUID files:"
find /usr/local /opt/homebrew -perm -4000 2>/dev/null | wc -l

echo "World-writable files:"
find . -type f -perm -o+w 2>/dev/null | wc -l

# =============================================================================
# STEP 21-25: PERFORMANCE AND RESOURCE ANALYSIS
# =============================================================================

echo ""
echo "STEPS 21-25: PERFORMANCE ANALYSIS"
echo "==================================="

# Step 21: System Resource Usage
echo "Step 21: System Resources"
echo "CPU Usage: $(top -l 1 | grep "CPU usage" | awk '{print $3}')"
echo "Memory Usage: $(vm_stat | grep "Pages free" | awk '{print $3}' | tr -d '.')"

# Step 22: Disk Usage Analysis
echo ""
echo "Step 22: Disk Usage"
df -h | head -5

# Step 23: Process Analysis
echo ""
echo "Step 23: Process Analysis"
echo "Total processes: $(ps aux | wc -l)"
echo "Zombie processes: $(ps aux | awk '{print $8}' | grep -c "Z")"

# Step 24: Cache Analysis
echo ""
echo "Step 24: Cache Analysis"
echo "NPM cache: $(npm config get cache 2>/dev/null || echo 'N/A')"
echo "Cargo cache: $(du -sh ~/.cargo/registry 2>/dev/null || echo 'N/A')"
echo "Go cache: $(du -sh ~/go/pkg 2>/dev/null || echo 'N/A')"

# Step 25: Performance Benchmarks
echo ""
echo "Step 25: Performance Benchmarks"
echo "Shell startup time:"
time zsh -c 'exit' 2>&1 | grep real

# =============================================================================
# STEP 26-30: INTEGRATION AND SCALING ANALYSIS
# =============================================================================

echo ""
echo "STEPS 26-30: INTEGRATION ANALYSIS"
echo "==================================="

# Step 26: Polyglot Integration
echo "Step 26: Polyglot Integration Analysis"
languages=("javascript" "typescript" "python" "rust" "go" "java" "cpp" "c")
for lang in "${languages[@]}"; do
    files=$(find . -name "*.$lang" 2>/dev/null | wc -l)
    echo "$lang files: $files"
done

# Step 27: CI/CD Analysis
echo ""
echo "Step 27: CI/CD Analysis"
ci_files=(".github/workflows" ".gitlab-ci.yml" "Jenkinsfile" "azure-pipelines.yml" "bitbucket-pipelines.yml")
for file in "${ci_files[@]}"; do
    if [ -e "$file" ]; then
        echo "✅ $file found"
    fi
done

# Step 28: Container Analysis
echo ""
echo "Step 28: Container Analysis"
if [ -f "Dockerfile" ] || [ -f "docker-compose.yml" ]; then
    echo "✅ Container configuration found"
else
    echo "❌ No container configuration"
fi

# Step 29: API Integration Analysis
echo ""
echo "Step 29: API Integration Analysis"
api_files=$(find . -name "*.graphql" -o -name "*api*" -o -name "*endpoint*" | wc -l)
echo "API-related files: $api_files"

# Step 30: AGI Readiness Assessment
echo ""
echo "Step 30: AGI Readiness Assessment"
echo "Machine Learning Models:"
find . -name "*.h5" -o -name "*.pb" -o -name "*.onnx" -o -name "*.pt" | wc -l | xargs echo "ML models found:"

echo "Automation Scripts:"
find . -name "*.sh" -o -name "*.py" -o -name "*.js" | xargs grep -l "auto\|bot\|agent" | wc -l | xargs echo "Automation scripts:"

echo ""
echo "=== GAP ANALYSIS COMPLETE ==="
echo "Review the findings above and check the fix recommendations in the companion script."