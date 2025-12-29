#!/bin/bash
# Comprehensive Tool Validation Script
# Tests all integrated tools and reports status

echo "🔍 Starting Comprehensive Tool Validation..."
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validation counters
total_tools=0
working_tools=0
failed_tools=0
missing_tools=0

# Function to check tool status
check_tool() {
    local tool_name="$1"
    local tool_cmd="$2"
    local expected_output="$3"

    ((total_tools++))

    if ! command -v "$tool_cmd" >/dev/null 2>&1; then
        echo -e "${RED}❌ MISSING${NC}: $tool_name ($tool_cmd)"
        ((missing_tools++))
        return 1
    fi

    # Test the tool
    if [[ -n "$expected_output" ]]; then
        if eval "$tool_cmd" 2>/dev/null | grep -q "$expected_output"; then
            echo -e "${GREEN}✅ WORKING${NC}: $tool_name"
            ((working_tools++))
            return 0
        else
            echo -e "${RED}❌ FAILED${NC}: $tool_name (unexpected output)"
            ((failed_tools++))
            return 1
        fi
    else
        if eval "$tool_cmd" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ WORKING${NC}: $tool_name"
            ((working_tools++))
            return 0
        else
            echo -e "${RED}❌ FAILED${NC}: $tool_name (command failed)"
            ((failed_tools++))
            return 1
        fi
    fi
}

echo "📁 File/Directory Management Tools:"
echo "-----------------------------------"
check_tool "fclones" "fclones --version" "fclones"
check_tool "fd" "fd --version" "fd"
check_tool "rmlint" "rmlint --version" "rmlint"
check_tool "stow" "stow --version" "stow"
check_tool "tree" "tree --version" "tree"

echo ""
echo "🧭 Navigation & Terminal Tools:"
echo "-------------------------------"
check_tool "tmux" "tmux -V" "tmux"
check_tool "zoxide" "zoxide --version" "zoxide"
check_tool "navi" "navi --version" "navi"
check_tool "fzf" "fzf --version" "fzf"

echo ""
echo "🔍 Search & Analysis Tools:"
echo "---------------------------"
check_tool "ripgrep" "rg --version" "ripgrep"
check_tool "grep" "grep --version" "grep"
check_tool "bat" "bat --version" "bat"
check_tool "sd" "sd --version" "sd"
check_tool "bfs" "bfs --version" "bfs"
check_tool "fdupes" "fdupes --version" "fdupes"
check_tool "jdupes" "jdupes --version" "jdupes"

echo ""
echo "💻 Development Tools:"
echo "---------------------"
check_tool "GitHub CLI" "gh --version" "gh"
check_tool "jq" "jq --version" "jq"
check_tool "yq" "yq --version" "yq"
check_tool "pass" "pass version" "pass"
check_tool "taplo" "taplo --version" "taplo"

echo ""
echo "🔧 Code Quality & Analysis Tools:"
echo "----------------------------------"
check_tool "ast-grep" "ast-grep --version" "ast-grep"
check_tool "semgrep" "semgrep --version" "semgrep"
check_tool "ruff" "ruff --version" "ruff"
check_tool "mypy" "mypy --version" "mypy"

echo ""
echo "📊 Monitoring & System Tools:"
echo "-----------------------------"
check_tool "htop" "htop --version" "htop"

echo ""
echo "📦 Package Managers:"
echo "--------------------"
check_tool "pnpm" "pnpm --version" "pnpm"
check_tool "pipx" "pipx --version" "pipx"
check_tool "pixi" "pixi --version" "pixi"

echo ""
echo "🔗 Testing Key Integrations:"
echo "----------------------------"

# Test fd integration
if command -v fd >/dev/null 2>&1; then
    if fd --type f --max-depth 1 . | head -1 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ WORKING${NC}: fd file search integration"
        ((working_tools++))
        ((total_tools++))
    else
        echo -e "${RED}❌ FAILED${NC}: fd file search integration"
        ((failed_tools++))
        ((total_tools++))
    fi
fi

# Test ripgrep integration
if command -v rg >/dev/null 2>&1; then
    if echo "test content" | rg "test" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ WORKING${NC}: ripgrep search integration"
        ((working_tools++))
        ((total_tools++))
    else
        echo -e "${RED}❌ FAILED${NC}: ripgrep search integration"
        ((failed_tools++))
        ((total_tools++))
    fi
fi

# Test bat integration
if command -v bat >/dev/null 2>&1; then
    if echo "test" | bat --plain >/dev/null 2>&1; then
        echo -e "${GREEN}✅ WORKING${NC}: bat cat replacement"
        ((working_tools++))
        ((total_tools++))
    else
        echo -e "${RED}❌ FAILED${NC}: bat cat replacement"
        ((failed_tools++))
        ((total_tools++))
    fi
fi

echo ""
echo "==============================================="
echo "📊 VALIDATION RESULTS:"
echo "==============================================="
echo "Total tools checked: $total_tools"
echo -e "Working tools: ${GREEN}$working_tools${NC}"
echo -e "Failed tools: ${RED}$failed_tools${NC}"
echo -e "Missing tools: ${YELLOW}$missing_tools${NC}"

success_rate=$((working_tools * 100 / total_tools))
echo "Success rate: ${success_rate}%"

if [ $success_rate -ge 90 ]; then
    echo -e "${GREEN}🎉 EXCELLENT: Tool integration is highly functional!${NC}"
elif [ $success_rate -ge 75 ]; then
    echo -e "${YELLOW}⚠️ GOOD: Tool integration is mostly functional${NC}"
elif [ $success_rate -ge 50 ]; then
    echo -e "${RED}❌ FAIR: Tool integration needs improvement${NC}"
else
    echo -e "${RED}💥 CRITICAL: Tool integration requires immediate attention${NC}"
fi

echo ""
echo "💡 Next Steps:"
if [ $missing_tools -gt 0 ]; then
    echo "  - Install missing tools with: brew install <tool>"
fi
if [ $failed_tools -gt 0 ]; then
    echo "  - Debug failed tools and check configurations"
fi
echo "  - Test integrations in your development workflow"
echo "  - Run 'source ~/.zshrc' to reload configurations"

echo "==============================================="