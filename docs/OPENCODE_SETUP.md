# OpenCode CLI Setup Guide

## Installation Status
✅ OpenCode CLI v1.0.206 is installed

## Quick Start

### Launch OpenCode
```bash
# From project root
cd /Users/daniellynch/Developer
opencode

# Or with specific model
opencode -m anthropic/claude-3-5-sonnet
```

## 1Password Integration

### Setup Steps

1. **Enable CLI Integration in 1Password Desktop App**
   - Open 1Password app
   - Go to: Settings → Developer
   - Enable "Connect with 1Password CLI"
   - Use Touch ID for authentication

2. **Load Secrets Before Running OpenCode**
   ```bash
   # Source the environment script
   source /Users/daniellynch/Developer/.opencode-env.sh
   
   # Then run opencode
   opencode
   ```

3. **Configure Your API Keys in 1Password**
   
   Store your API keys in 1Password with these names:
   - OpenAI API Key → `op://Private/OpenAI/credential`
   - Anthropic API Key → `op://Private/Anthropic/api_key`
   - Google AI Key → `op://Private/Google AI/credential`
   - Groq API Key → `op://Private/Groq/api_key`

4. **Edit the Environment Script**
   
   Edit `/Users/daniellynch/Developer/.opencode-env.sh` and uncomment the API keys you want to use:
   
   ```bash
   # Example: Enable OpenAI
   export OPENAI_API_KEY=$(op read "op://Private/OpenAI/credential")
   
   # Example: Enable Anthropic
   export ANTHROPIC_API_KEY=$(op read "op://Private/Anthropic/api_key")
   ```

## Authentication with Providers

### Option 1: Use Built-in Auth
```bash
opencode auth login
# Select provider and enter API key
```

### Option 2: Use Environment Variables (Recommended with 1Password)
```bash
# Load from 1Password
source /Users/daniellynch/Developer/.opencode-env.sh

# Verify keys are loaded
echo $OPENAI_API_KEY | head -c 10
```

### List Configured Providers
```bash
opencode auth list
```

## Usage Examples

### Interactive TUI Mode
```bash
opencode
```

### Non-Interactive Mode
```bash
# Quick question
opencode run "Explain this error"

# With specific model
opencode run -m openai/gpt-4 "Write a function"
```

### Continue Previous Session
```bash
opencode -c  # Continue last session
```

## Available Commands

```bash
opencode                     # Start TUI
opencode run [message]       # Run with message
opencode auth                # Manage credentials
opencode models              # List available models
opencode stats               # Show usage statistics
opencode session             # Manage sessions
opencode --help              # Full help
```

## Model Providers

OpenCode supports 75+ LLM providers:
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3.5 Sonnet, Opus)
- Google (Gemini)
- Groq
- Local models via Ollama
- And many more via Models.dev

## Troubleshooting

### OpenCode Not Found
```bash
# Reload shell configuration
source ~/.zshrc

# Verify installation
which opencode
opencode --version
```

### Authentication Issues
```bash
# Check 1Password CLI
op --version
op whoami

# Enable desktop app integration
# Settings → Developer → Connect with 1Password CLI
```

### API Key Issues
```bash
# Test 1Password secret retrieval
op read "op://Private/OpenAI/credential"

# Check if key is loaded
env | grep API_KEY
```

## Security Best Practices

✅ **DO:**
- Store API keys in 1Password
- Use environment variables
- Never commit secrets to git
- Use Touch ID/biometric auth

❌ **DON'T:**
- Hardcode API keys in code
- Share API keys in chat logs
- Commit `.env` files with secrets
- Use the same key for dev/prod

## Resources

- [OpenCode Documentation](https://opencode.ai/docs)
- [OpenCode GitHub](https://github.com/sst/opencode)
- [1Password CLI Docs](https://developer.1password.com/docs/cli/)
