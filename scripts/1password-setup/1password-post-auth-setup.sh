#!/bin/bash
# 1Password Post-Authentication Setup Script
# Run this AFTER authenticating with 1Password CLI

set -euo pipefail

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $*"
}

warning() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $*"
}

# Verify authentication
verify_auth() {
    log "Verifying 1Password authentication..."
    if ! op account list >/dev/null 2>&1; then
        echo "❌ Not authenticated. Please run: op signin"
        exit 1
    fi
    success "Authentication verified"
}

# Check/create development vault
setup_vault() {
    log "Checking development vault..."
    if op vault get development >/dev/null 2>&1; then
        success "Development vault exists"
    else
        warning "Development vault not found. Please create it in 1Password app"
        log "Create a vault named 'development' in your 1Password account"
        exit 1
    fi
}

# Resolve template configurations
resolve_templates() {
    log "Resolving template configurations..."

    # Get account info
    ACCOUNT_INFO=$(op account list --format json | jq '.[0]')
    ACCOUNT_EMAIL=$(echo "$ACCOUNT_INFO" | jq -r '.email')
    ACCOUNT_URL=$(echo "$ACCOUNT_INFO" | jq -r '.url')
    ACCOUNT_UUID=$(echo "$ACCOUNT_INFO" | jq -r '.account_uuid')

    # Update config.json
    cat > ~/.config/op/config.json << EOF
{
  "accounts": [
    {
      "account_uuid": "$ACCOUNT_UUID",
      "email": "$ACCOUNT_EMAIL",
      "url": "$ACCOUNT_URL",
      "shorthand": "development"
    }
  ],
  "latest_signin_account_uuid": "$ACCOUNT_UUID",
  "biometric_unlock": true,
  "auto_lock_timeout_seconds": 3600,
  "device_uuid": "$(uuidgen)",
  "device_name": "Empathy First Media - Developer MacBook",
  "user_uuid": "$(op account list --format json | jq -r '.[0].user_uuid')"
}
EOF

    success "Configuration templates resolved"
}

# Setup SSH agent
setup_ssh_agent() {
    log "Setting up SSH agent..."

    if [[ -S ~/.1password/agent.sock ]]; then
        export SSH_AUTH_SOCK=~/.1password/agent.sock
        echo "export SSH_AUTH_SOCK=~/.1password/agent.sock" >> ~/.zshrc
        success "SSH agent configured"

        # Check for SSH keys
        if ssh-add -l >/dev/null 2>&1; then
            KEY_COUNT=$(ssh-add -l 2>/dev/null | wc -l)
            success "SSH agent has $KEY_COUNT keys"
        else
            warning "No SSH keys loaded. Add SSH keys to 1Password"
        fi
    else
        warning "1Password SSH agent socket not found"
        log "Ensure 1Password app is running with SSH agent enabled"
    fi
}

# Test basic functionality
run_tests() {
    log "Running basic functionality tests..."

    # Test vault access
    if op item list --vault development >/dev/null 2>&1; then
        success "Vault access test passed"
    else
        warning "Vault access test failed"
    fi

    # Test secrets injection
    echo 'test={{ op://development/test/secret }}' | op inject >/dev/null 2>&1 && success "Secrets injection test passed" || warning "Secrets injection test failed (may be expected if no test secrets exist)"

    # Test plugin access
    PLUGIN_COUNT=$(op plugin list --format json 2>/dev/null | jq '. | length' 2>/dev/null || echo "0")
    success "$PLUGIN_COUNT plugins available"
}

# Main execution
main() {
    log "🚀 Starting 1Password Post-Authentication Setup"

    verify_auth
    setup_vault
    resolve_templates
    setup_ssh_agent
    run_tests

    success "Post-authentication setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Add SSH keys to 1Password for git authentication"
    echo "2. Create service accounts in 1Password for CI/CD"
    echo "3. Run: chezmoi apply  # to sync configurations"
    echo "4. Test integrations with: ./1password-debug-setup.sh"
}

main "$@"