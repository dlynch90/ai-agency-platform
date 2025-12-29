#!/bin/bash
# Mem0.ai API Key Setup Script
# Helps users configure their Mem0 API key for the integration

set -e

echo "🚀 Mem0.ai API Key Setup"
echo "=========================="
echo ""

# Check if API key is already set
if [ -n "$MEM0_API_KEY" ] && [ "$MEM0_API_KEY" != "test-key-for-debug" ]; then
    echo "✅ MEM0_API_KEY is already configured"
    echo "   Current key: ${MEM0_API_KEY:0:8}..."
    echo ""
    read -p "Do you want to update it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

echo "📝 To get your Mem0 API key:"
echo "   1. Go to https://app.mem0.ai"
echo "   2. Sign up or log in to your account"
echo "   3. Navigate to Settings → API Keys"
echo "   4. Create a new API key or copy an existing one"
echo ""

# Prompt for API key
read -p "Enter your Mem0 API key: " -s mem0_api_key
echo ""

if [ -z "$mem0_api_key" ]; then
    echo "❌ No API key provided. Setup cancelled."
    exit 1
fi

# Validate API key format (should start with m0-)
if [[ ! $mem0_api_key =~ ^m0- ]]; then
    echo "⚠️  Warning: API key doesn't start with 'm0-'. This might not be a valid Mem0 API key."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Test the API key
echo "🔍 Testing API key..."
export MEM0_API_KEY="$mem0_api_key"

# Create a small test script
cat > /tmp/mem0_test_key.py << 'EOF'
import os
from mem0 import MemoryClient

try:
    client = MemoryClient(api_key=os.environ['MEM0_API_KEY'])
    print("✅ API key is valid - connection successful")
except Exception as e:
    print(f"❌ API key validation failed: {e}")
    exit(1)
EOF

# Run the test
if python3 /tmp/mem0_test_key.py; then
    echo ""
    echo "🎉 API key validated successfully!"
    echo ""

    # Update the config file
    if [ -f "configs/mem0-config.toml" ]; then
        echo "📝 Updating config file..."
        # Use sed to update the API key in the config file
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/api_key = \".*\"/api_key = \"$mem0_api_key\"/" configs/mem0-config.toml
        else
            # Linux
            sed -i "s/api_key = \".*\"/api_key = \"$mem0_api_key\"/" configs/mem0-config.toml
        fi
        echo "✅ Config file updated"
    fi

    # Set environment variable for current session
    echo "💡 To use this API key in your current session, run:"
    echo "   export MEM0_API_KEY=\"$mem0_api_key\""
    echo ""

    # Optional: Add to shell profile
    read -p "Add to your shell profile (~/.zshrc or ~/.bashrc)? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        shell_profile="$HOME/.zshrc"
        if [ ! -f "$shell_profile" ]; then
            shell_profile="$HOME/.bashrc"
        fi

        if [ -f "$shell_profile" ]; then
            echo "export MEM0_API_KEY=\"$mem0_api_key\"" >> "$shell_profile"
            echo "✅ Added to $shell_profile"
            echo "   Run 'source $shell_profile' to apply changes"
        else
            echo "⚠️  Could not find shell profile to update"
        fi
    fi

    echo ""
    echo "🎯 Next steps:"
    echo "   1. Test the integration: node scripts/debug-mem0-platform.js"
    echo "   2. Run LangChain tests: node scripts/test-langchain-mem0.js"
    echo "   3. Start MCP server: [configured in configs/mcp-server-registry.cjs]"
    echo ""
    echo "🚀 Mem0.ai integration is now ready!"

else
    echo ""
    echo "❌ API key validation failed. Please check your key and try again."
    echo "   Make sure you're using a valid API key from https://app.mem0.ai"
    exit 1
fi

# Clean up
rm -f /tmp/mem0_test_key.py