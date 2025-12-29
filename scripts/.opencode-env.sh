#!/bin/bash

# OpenCode Environment Configuration with 1Password Integration
# This script retrieves API keys from 1Password and sets them as environment variables

echo "🔐 Loading secrets from 1Password..."

# #region agent log - hypothesis A1: 1Password CLI availability check
fetch('http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'.opencode-env.sh:10',message:'Checking 1Password CLI availability',data:{opCommandExists: $(command -v op &> /dev/null && echo 'true' || echo 'false')},timestamp:Date.now(),sessionId:'opencode-auth-debug',runId:'initial-run',hypothesisId:'A1'})}).catch(()=>{});
# #endregion

# Check if 1Password CLI is available
if ! command -v op &> /dev/null; then
    echo "❌ 1Password CLI not found. Install with: brew install 1password-cli"
    # #region agent log - hypothesis A1: 1Password CLI missing
    fetch('http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'.opencode-env.sh:14',message:'1Password CLI not found',data:{error:'CLI not installed'},timestamp:Date.now(),sessionId:'opencode-auth-debug',runId:'initial-run',hypothesisId:'A1'})}).catch(()=>{});
    # #endregion
    exit 1
fi

# #region agent log - hypothesis A2: 1Password CLI authentication status
OP_WHOAMI_RESULT=$(op whoami 2>&1)
OP_WHOAMI_EXIT=$?
fetch('http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'.opencode-env.sh:18',message:'Checking 1Password authentication status',data:{whoamiExitCode: $OP_WHOAMI_EXIT, whoamiOutput: '$OP_WHOAMI_RESULT'},timestamp:Date.now(),sessionId:'opencode-auth-debug',runId:'initial-run',hypothesisId:'A2'})}).catch(()=>{});
# #endregion

# Note: Make sure "Connect with 1Password CLI" is enabled in 1Password desktop app
# Settings > Developer > Connect with 1Password CLI

# #region agent log - hypothesis B1: API key retrieval attempts
echo "🔑 Attempting to retrieve API keys from 1Password..."

# Try to retrieve OpenAI API key
OPENAI_KEY_RESULT=$(op read "op://Private/OpenAI/credential" 2>&1)
OPENAI_KEY_EXIT=$?
if [ $OPENAI_KEY_EXIT -eq 0 ]; then
    export OPENAI_API_KEY="$OPENAI_KEY_RESULT"
    echo "✅ OpenAI API key loaded"
else
    echo "❌ OpenAI API key not found or accessible"
fi
fetch('http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'.opencode-env.sh:25',message:'OpenAI key retrieval result',data:{exitCode: $OPENAI_KEY_EXIT, keyLength: ${#OPENAI_KEY_RESULT}, hasKey: $([ -n "$OPENAI_KEY_RESULT" ] && echo 'true' || echo 'false')},timestamp:Date.now(),sessionId:'opencode-auth-debug',runId:'initial-run',hypothesisId:'B1'})}).catch(()=>{});

# Try to retrieve Anthropic API key
ANTHROPIC_KEY_RESULT=$(op read "op://Private/Anthropic/api_key" 2>&1)
ANTHROPIC_KEY_EXIT=$?
if [ $ANTHROPIC_KEY_EXIT -eq 0 ]; then
    export ANTHROPIC_API_KEY="$ANTHROPIC_KEY_RESULT"
    echo "✅ Anthropic API key loaded"
else
    echo "❌ Anthropic API key not found or accessible"
fi
fetch('http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'.opencode-env.sh:35',message:'Anthropic key retrieval result',data:{exitCode: $ANTHROPIC_KEY_EXIT, keyLength: ${#ANTHROPIC_KEY_RESULT}, hasKey: $([ -n "$ANTHROPIC_KEY_RESULT" ] && echo 'true' || echo 'false')},timestamp:Date.now(),sessionId:'opencode-auth-debug',runId:'initial-run',hypothesisId:'B1'})}).catch(()=>{});

# Try to retrieve Google API key
GOOGLE_KEY_RESULT=$(op read "op://Private/Google AI/credential" 2>&1)
GOOGLE_KEY_EXIT=$?
if [ $GOOGLE_KEY_EXIT -eq 0 ]; then
    export GOOGLE_API_KEY="$GOOGLE_KEY_RESULT"
    echo "✅ Google API key loaded"
else
    echo "❌ Google API key not found or accessible"
fi
fetch('http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'.opencode-env.sh:45',message:'Google key retrieval result',data:{exitCode: $GOOGLE_KEY_EXIT, keyLength: ${#GOOGLE_KEY_RESULT}, hasKey: $([ -n "$GOOGLE_KEY_RESULT" ] && echo 'true' || echo 'false')},timestamp:Date.now(),sessionId:'opencode-auth-debug',runId:'initial-run',hypothesisId:'B1'})}).catch(()=>{});

# Try to retrieve Groq API key
GROQ_KEY_RESULT=$(op read "op://Private/Groq/api_key" 2>&1)
GROQ_KEY_EXIT=$?
if [ $GROQ_KEY_EXIT -eq 0 ]; then
    export GROQ_API_KEY="$GROQ_KEY_RESULT"
    echo "✅ Groq API key loaded"
else
    echo "❌ Groq API key not found or accessible"
fi
fetch('http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'.opencode-env.sh:55',message:'Groq key retrieval result',data:{exitCode: $GROQ_KEY_EXIT, keyLength: ${#GROQ_KEY_RESULT}, hasKey: $([ -n "$GROQ_KEY_RESULT" ] && echo 'true' || echo 'false')},timestamp:Date.now(),sessionId:'opencode-auth-debug',runId:'initial-run',hypothesisId:'B1'})}).catch(()=>{});
# #endregion

# #region agent log - hypothesis C1: Environment variable verification
ENV_VARS_STATUS=$(env | grep -E "(OPENAI|ANTHROPIC|GOOGLE|GROQ)_API_KEY" | wc -l)
fetch('http://127.0.0.1:7243/ingest/5072b9ca-f4c1-41f0-9e47-ea0a9f90dfab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'.opencode-env.sh:60',message:'Environment variables status after loading',data:{apiKeyCount: $ENV_VARS_STATUS, openaiSet: $([ -n "$OPENAI_API_KEY" ] && echo 'true' || echo 'false'), anthropicSet: $([ -n "$ANTHROPIC_API_KEY" ] && echo 'true' || echo 'false'), googleSet: $([ -n "$GOOGLE_API_KEY" ] && echo 'true' || echo 'false'), groqSet: $([ -n "$GROQ_API_KEY" ] && echo 'true' || echo 'false')},timestamp:Date.now(),sessionId:'opencode-auth-debug',runId:'initial-run',hypothesisId:'C1'})}).catch(()=>{});
# #endregion

# For now, let's check what items are available
echo "📋 Available 1Password items:"
op item list --categories "API Credential" --format json 2>/dev/null | jq -r '.[].title' || echo "Please enable CLI integration in 1Password app"

echo ""
echo "✅ To use this script:"
echo "   1. Enable 'Connect with 1Password CLI' in 1Password app (Settings > Developer)"
echo "   2. Edit this file to uncomment and configure your API key retrieval"
echo "   3. Run: source /Users/daniellynch/Developer/.opencode-env.sh"
echo "   4. Then run: opencode"
