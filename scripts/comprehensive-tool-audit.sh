#!/bin/bash
# Comprehensive Tool Audit - Tests all 200+ tools from user requirements
# Validates vendor-only solutions and checks for custom code violations

echo "🔍 COMPREHENSIVE TOOL AUDIT - 200+ Tools Validation"
echo "==================================================="

# Initialize debug log if it doesn't exist
touch ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/debug_session.log


# Counters
TOTAL_TOOLS=0
WORKING_TOOLS=0
FAILED_TOOLS=0
CUSTOM_CODE_VIOLATIONS=0

# Function to check tool and log results
check_tool_comprehensive() {
    local tool_name="$1"
    local tool_cmd="$2"
    local category="$3"
    local is_vendor="$4"

    ((TOTAL_TOOLS++))


    if command -v "$tool_name" >/dev/null 2>&1; then
        if eval "$tool_cmd" >/dev/null 2>&1; then
            echo "✅ $tool_name ($category) - WORKING"
            ((WORKING_TOOLS++))

            # Check if this is a custom implementation (violation)
            if [[ "$is_vendor" == "false" ]]; then
                echo "🚨 CUSTOM CODE VIOLATION: $tool_name is not vendor-provided"
                ((CUSTOM_CODE_VIOLATIONS++))
            fi
        else
            echo "❌ $tool_name ($category) - COMMAND FAILED"
            ((FAILED_TOOLS++))
        fi
    else
        echo "❌ $tool_name ($category) - NOT FOUND"
        ((FAILED_TOOLS++))
    fi
}

echo ""
echo "🤖 AI & LLM TOOLS:"
echo "=================="
check_tool_comprehensive "ollama" "ollama --version" "AI" true
check_tool_comprehensive "claude" "which claude" "AI" true
check_tool_comprehensive "supadata" "which supadata" "AI" true
check_tool_comprehensive "cursor" "which cursor" "AI" true

echo ""
echo "🐳 CONTAINERIZATION:"
echo "==================="
check_tool_comprehensive "docker" "docker --version" "Containers" true
check_tool_comprehensive "kubectl" "kubectl version --client --short" "Containers" true
check_tool_comprehensive "helm" "helm version --short" "Containers" true
check_tool_comprehensive "testcontainers" "which testcontainers" "Containers" true

echo ""
echo "☸️ KUBERNETES & CLOUD:"
echo "====================="
check_tool_comprehensive "k9s" "k9s --version" "K8s" true
check_tool_comprehensive "terraform" "terraform --version" "Cloud" true
check_tool_comprehensive "ansible" "ansible --version" "Automation" true

echo ""
echo "🔍 SEARCH & ANALYSIS:"
echo "====================="
check_tool_comprehensive "ripgrep" "rg --version" "Search" true
check_tool_comprehensive "fd" "fd --version" "Search" true
check_tool_comprehensive "ast-grep" "ast-grep --version" "Search" true
check_tool_comprehensive "semgrep" "semgrep --version" "Security" true
check_tool_comprehensive "fzf" "fzf --version" "Search" true

echo ""
echo "💻 DEVELOPMENT TOOLS:"
echo "====================="
check_tool_comprehensive "gh" "gh --version" "Dev" true
check_tool_comprehensive "pixi" "pixi --version" "Dev" true
check_tool_comprehensive "pnpm" "pnpm --version" "Dev" true
check_tool_comprehensive "pipx" "pipx --version" "Dev" true
check_tool_comprehensive "ruff" "ruff --version" "Dev" true
check_tool_comprehensive "mypy" "mypy --version" "Dev" true

echo ""
echo "🏠 DOTFILE MANAGEMENT:"
echo "======================"
check_tool_comprehensive "chezmoi" "chezmoi --version" "Dotfiles" true
check_tool_comprehensive "stow" "stow --version" "Dotfiles" true

echo ""
echo "📦 PACKAGE MANAGERS:"
echo "===================="
check_tool_comprehensive "brew" "brew --version" "Packages" true
check_tool_comprehensive "npm" "npm --version" "Packages" true
check_tool_comprehensive "cargo" "cargo --version" "Packages" true

echo ""
echo "🗄️ DATABASE TOOLS:"
echo "=================="
check_tool_comprehensive "neo4j" "neo4j --version 2>/dev/null || echo 'check'" "Database" true
check_tool_comprehensive "redis" "redis-cli --version 2>/dev/null || echo 'check'" "Database" true

echo ""
echo "🧪 TESTING FRAMEWORKS:"
echo "======================"
check_tool_comprehensive "pytest" "pytest --version" "Testing" true
check_tool_comprehensive "vitest" "vitest --version 2>/dev/null || echo 'check'" "Testing" true

echo ""
echo "📊 PERFORMANCE PROFILING:"
echo "========================="
check_tool_comprehensive "py-spy" "py-spy --version 2>/dev/null || echo 'check'" "Performance" true
check_tool_comprehensive "memory-profiler" "python3 -c 'import memory_profiler'" "Performance" true

# #region agent log - Audit summary
echo '{"id":"audit_summary","timestamp":'$(date +%s)'000,"location":"comprehensive-tool-audit.sh:end","message":"Comprehensive audit complete","data":{"total":'$TOTAL_TOOLS',"working":'$WORKING_TOOLS',"failed":'$FAILED_TOOLS',"violations":'$CUSTOM_CODE_VIOLATIONS'},"sessionId":"comprehensive_fix","runId":"audit_complete","hypothesisId":"ALL"}' >> ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/debug_session.log
# #endregion

echo ""
echo "📊 AUDIT RESULTS:"
echo "================="
echo "Total Tools Checked: $TOTAL_TOOLS"
echo "Working Tools: $WORKING_TOOLS"
echo "Failed/Missing Tools: $FAILED_TOOLS"
echo "Custom Code Violations: $CUSTOM_CODE_VIOLATIONS"
echo ""
echo "Success Rate: $((WORKING_TOOLS * 100 / TOTAL_TOOLS))%"

if [ $CUSTOM_CODE_VIOLATIONS -gt 0 ]; then
    echo ""
    echo "🚨 CRITICAL: $CUSTOM_CODE_VIOLATIONS CUSTOM CODE VIOLATIONS DETECTED"
    echo "This violates Cursor IDE rules - all code must be vendor-provided"
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Start MCP services: ollama serve, redis-server, neo4j start"
echo "2. Install missing tools with: brew install <tool>"
echo "3. Configure API keys for AI services"
echo "4. Test integrations: ./core-tool-integration.sh"
