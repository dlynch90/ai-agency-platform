#!/bin/bash
# 1Password Authentication Helper
# Interactive guide for proper CLI authentication

echo "🔐 1Password CLI Authentication Helper"
echo "======================================"
echo ""

# Check current status
echo "Current status:"
op account list >/dev/null 2>&1 && echo "✅ Already authenticated" && exit 0 || echo "❌ Not authenticated"

echo ""
echo "Choose your authentication method:"
echo ""
echo "1) Desktop App Integration (Recommended)"
echo "   - Open 1Password app"
echo "   - Settings > Security > Enable biometric unlock"
echo "   - Settings > Developer > Enable 'Integrate with 1Password CLI'"
echo "   - Then run: op signin"
echo ""
echo "2) Manual Account Setup"
echo "   - Need your 1Password sign-in address (not email!)"
echo "   - Format: your-team.1password.com"
echo ""
echo "3) Service Account (for automation)"
echo "   - Requires service account token"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📱 Desktop App Integration Setup:"
        echo "1. Open 1Password desktop app"
        echo "2. Go to Settings > Security"
        echo "3. Enable Touch ID, Face ID, or Windows Hello"
        echo "4. Go to Settings > Developer"
        echo "5. Enable 'Integrate with 1Password CLI'"
        echo "6. Close and reopen your terminal"
        echo "7. Run: op signin"
        echo ""
        echo "Ready to try? (Press Enter when done)"
        read
        echo "Running: op signin"
        op signin
        ;;
    2)
        echo ""
        echo "🔧 Manual Account Setup:"
        echo "What is your 1Password sign-in address?"
        echo "Examples:"
        echo "• mycompany.1password.com"
        echo "• myteam.1password.eu"
        echo "• my.1password.com (personal)"
        echo ""
        read -p "Enter your sign-in address: " address
        read -p "Enter your email address: " email

        echo ""
        echo "Running: op account add --address $address --email $email"
        op account add --address "$address" --email "$email"
        ;;
    3)
        echo ""
        echo "🤖 Service Account Setup:"
        echo "Enter your service account token:"
        echo "(You can get this from 1Password web > Account > Service Accounts)"
        echo ""
        read -s -p "Service account token: " token
        echo ""

        export OP_SERVICE_ACCOUNT_TOKEN="$token"
        echo "Set OP_SERVICE_ACCOUNT_TOKEN environment variable"

        echo "What is your 1Password sign-in address?"
        read -p "Sign-in address: " address

        echo ""
        echo "Running: op account add --address $address --service-account-token ***"
        op account add --address "$address" --service-account-token "$token"
        ;;
    *)
        echo "Invalid choice. Please run this script again."
        exit 1
        ;;
esac

# Verify authentication worked
echo ""
echo "Verifying authentication..."
if op account list >/dev/null 2>&1; then
    echo "✅ Authentication successful!"
    echo ""
    echo "Next steps:"
    echo "1. Run: ./1password-post-auth-setup.sh"
    echo "2. Create a 'development' vault in 1Password if it doesn't exist"
    echo "3. Add SSH keys to 1Password for git authentication"
else
    echo "❌ Authentication failed. Please try again."
    exit 1
fi