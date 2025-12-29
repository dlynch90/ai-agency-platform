#!/bin/bash
# 1Password Status Check Script
# Comprehensive verification of all components

echo "🔍 1Password CLI Status Check"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. CLI Installation
echo "1. CLI Installation:"
if command -v op >/dev/null 2>&1; then
    version=$(op --version 2>/dev/null | head -1)
    check_pass "1Password CLI installed: $version"
else
    check_fail "1Password CLI not installed"
fi

# 2. Authentication
echo ""
echo "2. Authentication:"
if op account list >/dev/null 2>&1; then
    account_count=$(op account list --format json 2>/dev/null | jq '. | length' 2>/dev/null || echo "1")
    check_pass "Authenticated ($account_count account(s))"
else
    check_fail "Not authenticated - Run: ./1password-auth-helper.sh"
fi

# 3. Development Vault
echo ""
echo "3. Development Vault:"
if op vault get development >/dev/null 2>&1; then
    item_count=$(op item list --vault development 2>/dev/null | wc -l)
    check_pass "Development vault accessible ($item_count items)"
else
    check_warn "Development vault not accessible - Create 'development' vault in 1Password"
fi

# 4. SSH Agent
echo ""
echo "4. SSH Agent:"
if [[ -S ~/.1password/agent.sock ]]; then
    export SSH_AUTH_SOCK=~/.1password/agent.sock
    if ssh-add -l >/dev/null 2>&1; then
        key_count=$(ssh-add -l 2>/dev/null | wc -l)
        check_pass "SSH agent running ($key_count keys loaded)"
    else
        check_warn "SSH agent running but no keys loaded - Add SSH keys to 1Password"
    fi
else
    check_warn "SSH agent socket not found - Enable in 1Password app Settings > Developer"
fi

# 5. Configuration Files
echo ""
echo "5. Configuration Files:"
config_files=("$HOME/.config/op/config.json" "$HOME/.config/zsh/custom/1password.zsh" "$HOME/.ssh/config.d/1password")
all_configs=true
for config in "${config_files[@]}"; do
    if [[ -f "$config" ]]; then
        check_pass "$(basename "$config") exists"
    else
        check_fail "$(basename "$config") missing"
        all_configs=false
    fi
done

# 6. Environment Variables
echo ""
echo "6. Environment Variables:"
if [[ -n "${OP_VAULT:-}" ]]; then
    check_pass "OP_VAULT set: $OP_VAULT"
else
    check_fail "OP_VAULT not set"
fi

if [[ -n "${SSH_AUTH_SOCK:-}" ]] && [[ "$SSH_AUTH_SOCK" == *"1password"* ]]; then
    check_pass "SSH_AUTH_SOCK configured for 1Password"
else
    check_warn "SSH_AUTH_SOCK not set to 1Password agent"
fi

# 7. Zsh Integration
echo ""
echo "7. Zsh Integration:"
if grep -q "op completion zsh" ~/.config/zsh/custom/1password.zsh 2>/dev/null; then
    check_pass "Zsh completions configured"
else
    check_fail "Zsh completions not configured"
fi

if grep -q "op_get_secret" ~/.config/zsh/custom/1password.zsh 2>/dev/null; then
    check_pass "Custom functions available"
else
    check_fail "Custom functions not available"
fi

# 8. Plugin Ecosystem
echo ""
echo "8. Plugin Ecosystem:"
plugin_count=$(op plugin list --format json 2>/dev/null | jq '. | length' 2>/dev/null || echo "0")
if [ "$plugin_count" -gt 50 ]; then
    check_pass "$plugin_count plugins available"
else
    check_warn "Only $plugin_count plugins available - CLI may not be fully authenticated"
fi

# 9. Secrets Injection
echo ""
echo "9. Secrets Injection:"
echo "test-secret={{ op://development/test/secret }}" | op inject >/dev/null 2>&1
if [ $? -eq 0 ]; then
    check_pass "Secrets injection working"
else
    check_warn "Secrets injection test failed - May be expected if no test secrets exist"
fi

# 10. Development Tools
echo ""
echo "10. Development Tools:"
dev_tools=("chezmoi" "node" "npm" "python3" "git" "docker")
missing_tools=0
for tool in "${dev_tools[@]}"; do
    if command -v "$tool" >/dev/null 2>&1; then
        check_pass "$tool available"
    else
        check_fail "$tool missing"
        ((missing_tools++))
    fi
done

# Summary
echo ""
echo "📊 Summary:"
authenticated=$(op account list >/dev/null 2>&1 && echo "true" || echo "false")
vault_access=$(op vault get development >/dev/null 2>&1 && echo "true" || echo "false")

if [[ "$authenticated" == "true" && "$vault_access" == "true" ]]; then
    check_pass "1Password setup is COMPLETE and READY!"
    echo ""
    echo "🎉 You can now use:"
    echo "• op signin/signout"
    echo "• op item list/create/edit"
    echo "• op run -- (for secrets injection)"
    echo "• SSH authentication with 1Password keys"
    echo "• Zsh functions: op_get_secret, op_list_items, etc."
else
    echo "🔧 Setup incomplete. Run:"
    echo "1. ./1password-auth-helper.sh (for authentication)"
    echo "2. ./1password-post-auth-setup.sh (for configuration)"
    echo "3. Create 'development' vault in 1Password app"
fi

echo ""
echo "📄 Log files available:"
echo "• Setup logs: ~/1password-setup-*.log"
echo "• Test results: ~/1password-tests-*.json"