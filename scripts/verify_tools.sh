#!/bin/bash
# Comprehensive Tool Verification Script
# Verifies all CLI tools and development utilities are properly installed

set -e

echo "🔧 Comprehensive Tool Verification"
echo "==================================="

PASSED=0
FAILED=0

# Function to check tool
check_tool() {
    local tool_name="$1"
    local command="$2"

    echo -n "Checking $tool_name... "
    if eval "$command" >/dev/null 2>&1; then
        echo "✅ PASS"
        ((PASSED++))
    else
        echo "❌ FAIL"
        ((FAILED++))
    fi
}

echo ""
echo "📁 FILE SYSTEM & SEARCH TOOLS"
echo "=============================="

check_tool "fd (fast find)" "fd --version"
check_tool "fzf (fuzzy finder)" "fzf --version"
check_tool "ripgrep (rg)" "rg --version"
check_tool "bat (cat with syntax)" "bat --version"
check_tool "eza (ls replacement)" "eza --version"
check_tool "tree" "tree --version"
check_tool "bfs (find alternative)" "bfs --version"
check_tool "fclones (duplicate finder)" "fclones --version"
check_tool "fdupes (duplicate finder)" "fdupes --version"
check_tool "jdupes (duplicate finder)" "jdupes --version"
check_tool "rmlint (duplicate finder)" "rmlint --version"

echo ""
echo "🔍 CODE ANALYSIS & SEARCH"
echo "========================"

check_tool "ast-grep" "ast-grep --version"
check_tool "sd (search replace)" "sd --version"
check_tool "jq (JSON processor)" "jq --version"
check_tool "yq (YAML processor)" "yq --version"

echo ""
echo "🐚 SHELL & ENVIRONMENT"
echo "======================"

check_tool "tmux" "tmux -V"
check_tool "zoxide (smart cd)" "zoxide --version"
check_tool "atuin (shell history)" "atuin --version"
check_tool "starship (prompt)" "starship --version"
check_tool "navi (cheatsheets)" "navi --version"
check_tool "neofetch (system info)" "neofetch --version"
check_tool "tldr (man pages)" "tldr --version"

echo ""
echo "🐙 DEVELOPMENT TOOLS"
echo "==================="

check_tool "gh (GitHub CLI)" "gh --version"
check_tool "stow (symlink manager)" "stow --version"
check_tool "chezmoi (dotfile manager)" "chezmoi --version"

echo ""
echo "🐳 CONTAINER & CLOUD"
echo "===================="

check_tool "ansible" "ansible --version"
check_tool "mas (Mac App Store)" "mas version"

echo ""
echo "🐍 PYTHON TOOLS"
echo "==============="

check_tool "conda" "conda --version"
check_tool "uv (fast Python)" "uv --version"
check_tool "py-spy (profiler)" "py-spy --version"
check_tool "pipdeptree" "pipdeptree --version"
check_tool "safety (security)" "safety --version"

echo ""
echo "📦 NODE.JS TOOLS"
echo "================"

check_tool "ni (auto package manager)" "ni --version"
check_tool "npm-check-updates" "npx npm-check-updates --version"
check_tool "depcheck" "npx depcheck --version"
check_tool "knip (unused deps)" "npx knip --version"
check_tool "vitest" "npx vitest --version"
check_tool "playwright" "npx playwright --version"
check_tool "clinic (profiler)" "npx clinic --version"

echo ""
echo "🔒 SECURITY TOOLS"
echo "================="

check_tool "snyk (security scanning)" "snyk --version"
check_tool "trivy (vulnerability scanner)" "trivy --version"
check_tool "1Password CLI" "op --version"

echo ""
echo "📊 MONITORING TOOLS"
echo "==================="

check_tool "htop (process viewer)" "htop --version"
check_tool "pixie (eBPF monitoring)" "px version"

echo ""
echo "🗂️  SUMMARY"
echo "=========="

TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

echo "✅ PASSED: $PASSED tools"
echo "❌ FAILED: $FAILED tools"
echo "📊 SUCCESS RATE: $SUCCESS_RATE%"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo "🎉 ALL TOOLS SUCCESSFULLY VERIFIED!"
    echo "Your development environment is fully configured."
else
    echo ""
    echo "⚠️  Some tools failed verification."
    echo "Check the output above for failed tools."
fi

# Create detailed report
cat > tool_verification_report.md << REPORT_EOF
# Tool Verification Report

## Summary
- **Total Tools Checked**: $TOTAL
- **Passed**: $PASSED
- **Failed**: $FAILED
- **Success Rate**: $SUCCESS_RATE%

## File System & Search Tools
- fd: $(fd --version 2>/dev/null && echo "✅" || echo "❌")
- fzf: $(fzf --version 2>/dev/null && echo "✅" || echo "❌")
- ripgrep: $(rg --version 2>/dev/null && echo "✅" || echo "❌")
- bat: $(bat --version 2>/dev/null && echo "✅" || echo "❌")
- eza: $(eza --version 2>/dev/null && echo "✅" || echo "❌")
- tree: $(tree --version 2>/dev/null && echo "✅" || echo "❌")
- bfs: $(bfs --version 2>/dev/null && echo "✅" || echo "❌")
- fclones: $(fclones --version 2>/dev/null && echo "✅" || echo "❌")
- fdupes: $(fdupes --version 2>/dev/null && echo "✅" || echo "❌")
- jdupes: $(jdupes --version 2>/dev/null && echo "✅" || echo "❌")
- rmlint: $(rmlint --version 2>/dev/null && echo "✅" || echo "❌")

## Code Analysis Tools
- ast-grep: $(ast-grep --version 2>/dev/null && echo "✅" || echo "❌")
- sd: $(sd --version 2>/dev/null && echo "✅" || echo "❌")
- jq: $(jq --version 2>/dev/null && echo "✅" || echo "❌")
- yq: $(yq --version 2>/dev/null && echo "✅" || echo "❌")

## Shell & Environment Tools
- tmux: $(tmux -V 2>/dev/null && echo "✅" || echo "❌")
- zoxide: $(zoxide --version 2>/dev/null && echo "✅" || echo "❌")
- atuin: $(atuin --version 2>/dev/null && echo "✅" || echo "❌")
- starship: $(starship --version 2>/dev/null && echo "✅" || echo "❌")
- navi: $(navi --version 2>/dev/null && echo "✅" || echo "❌")
- neofetch: $(neofetch --version 2>/dev/null && echo "✅" || echo "❌")
- tldr: $(tldr --version 2>/dev/null && echo "✅" || echo "❌")

## Development Tools
- gh: $(gh --version 2>/dev/null && echo "✅" || echo "❌")
- stow: $(stow --version 2>/dev/null && echo "✅" || echo "❌")
- chezmoi: $(chezmoi --version 2>/dev/null && echo "✅" || echo "❌")
- ansible: $(ansible --version 2>/dev/null && echo "✅" || echo "❌")

## Python Tools
- conda: $(conda --version 2>/dev/null && echo "✅" || echo "❌")
- uv: $(uv --version 2>/dev/null && echo "✅" || echo "❌")
- py-spy: $(py-spy --version 2>/dev/null && echo "✅" || echo "❌")
- pipdeptree: $(pipdeptree --version 2>/dev/null && echo "✅" || echo "❌")
- safety: $(safety --version 2>/dev/null && echo "✅" || echo "❌")

## Security Tools
- snyk: $(snyk --version 2>/dev/null && echo "✅" || echo "❌")
- trivy: $(trivy --version 2>/dev/null && echo "✅" || echo "❌")
- 1Password CLI: $(op --version 2>/dev/null && echo "✅" || echo "❌")

## Monitoring Tools
- htop: $(htop --version 2>/dev/null && echo "✅" || echo "❌")
- pixie: $(px version 2>/dev/null && echo "✅" || echo "❌")

## Recommendations
$(if [ $FAILED -gt 0 ]; then
echo "### Missing Tools to Install:"
echo "- Review failed tools above"
echo "- Use brew install, pipx install, or npm install -g as appropriate"
echo "- Check PATH configuration for newly installed tools"
fi)

### Environment Setup
\`\`\`bash
# Add to your shell configuration (~/.zshrc or ~/.bashrc)
export PATH="/opt/homebrew/bin:\$PATH"
export PATH="\$HOME/.local/bin:\$PATH"

# Initialize tools
eval "\$(starship init zsh)"
eval "\$(zoxide init zsh)"
eval "\$(atuin init zsh)"
\`\`\`
REPORT_EOF

echo "📄 Detailed report saved: tool_verification_report.md"

exit $FAILED