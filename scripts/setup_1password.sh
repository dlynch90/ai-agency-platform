#!/bin/bash
# 1Password CLI Setup and Secret Management
# Ensures secure secret storage and retrieval

set -e

echo "🔐 Setting up 1Password CLI for Secret Management"
echo "=================================================="

# Check if 1Password CLI is installed
if ! command -v op >/dev/null 2>&1; then
    echo "❌ 1Password CLI not found. Installing..."
    brew install 1password-cli
fi

# Fix permissions
echo "Fixing 1Password configuration permissions..."
chmod 700 ~/.config/op 2>/dev/null || true
mkdir -p ~/.config/op
chmod 700 ~/.config/op

# Check authentication status
echo "Checking 1Password authentication..."
if ! op account list >/dev/null 2>&1; then
    echo "⚠️  1Password CLI not authenticated."
    echo "Please run: op signin"
    echo "Or authenticate interactively: op signin my-account"
    exit 1
fi

echo "✅ 1Password CLI authenticated"

# Create secret vault structure if it doesn't exist
echo "Setting up secret vault structure..."

# Create MCP secrets
op vault create "MCP Secrets" >/dev/null 2>&1 || echo "MCP Secrets vault exists"

# Add example secrets (user will need to populate)
echo "Setting up example MCP secret references..."
echo "Note: You'll need to manually create these secrets in 1Password:"
echo "- MCP/FIRECRAWL_API_KEY"
echo "- MCP/BRAVE_API_KEY"
echo "- Private/Neo4j/password"
echo "- Private/Qdrant/api_key"
echo "- Private/MCP/GITHUB_TOKEN"
echo "- Private/HuggingFace/token"
echo "- Private/N8N/webhook_url"
echo "- Private/N8N/api_key"

# Create secure environment setup script
cat > scripts/load_secrets.sh << 'EOF'
#!/bin/bash
# Load secrets from 1Password for MCP servers

# Check if 1Password is available
if ! command -v op >/dev/null 2>&1; then
    echo "❌ 1Password CLI not available"
    exit 1
fi

# Check authentication
if ! op account list >/dev/null 2>&1; then
    echo "❌ 1Password not authenticated. Run: op signin"
    exit 1
fi

# Export secrets as environment variables
export FIRECRAWL_API_KEY=$(op read 'op://Private/MCP/FIRECRAWL_API_KEY' 2>/dev/null || echo '')
export BRAVE_API_KEY=$(op read 'op://Private/MCP/BRAVE_API_KEY' 2>/dev/null || echo '')
export GITHUB_TOKEN=$(op read 'op://Private/MCP/GITHUB_TOKEN' 2>/dev/null || echo '')
export EXA_API_KEY=$(op read 'op://Private/MCP/EXA_API_KEY' 2>/dev/null || echo '')
export TAVILY_API_KEY=$(op read 'op://Private/MCP/TAVILY_API_KEY' 2>/dev/null || echo '')

echo "✅ Secrets loaded from 1Password"
echo "Note: Empty secrets indicate missing 1Password entries"
EOF

chmod +x scripts/load_secrets.sh

# Create secret validation script
cat > scripts/validate_secrets.sh << 'EOF'
#!/bin/bash
# Validate that all required secrets are available

echo "🔍 Validating Secret Configuration"
echo "==================================="

REQUIRED_SECRETS=(
    "FIRECRAWL_API_KEY"
    "BRAVE_API_KEY"
    "GITHUB_TOKEN"
)

missing_secrets=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    if [ -z "${!secret}" ]; then
        missing_secrets+=("$secret")
        echo "❌ $secret: MISSING"
    else
        echo "✅ $secret: PRESENT"
    fi
done

if [ ${#missing_secrets[@]} -eq 0 ]; then
    echo ""
    echo "🎉 All secrets configured correctly!"
else
    echo ""
    echo "⚠️  Missing secrets: ${missing_secrets[*]}"
    echo "Run: ./scripts/load_secrets.sh"
fi
EOF

chmod +x scripts/validate_secrets.sh

echo "✅ 1Password setup completed"
echo ""
echo "Next steps:"
echo "1. Authenticate: op signin"
echo "2. Load secrets: ./scripts/load_secrets.sh"
echo "3. Validate: ./scripts/validate_secrets.sh"