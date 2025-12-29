#!/bin/bash
# Extended MCP Ecosystem Integration
# PulseMCP, Cursor Directory MCP, TestSprite MCP, and more

echo "🔗 Setting up Extended MCP Ecosystem..."

# =============================================================================
# 1. PULSE MCP INTEGRATION
# =============================================================================

echo "💓 Configuring PulseMCP..."

PULSE_MCP_DIR="$HOME/.pulse-mcp"
mkdir -p "$PULSE_MCP_DIR"

cat > "$PULSE_MCP_DIR/config.json" << 'EOF'
{
  "version": "1.0",
  "name": "PulseMCP Integration",
  "description": "Real-time MCP server monitoring and management",
  "servers": [
    {
      "name": "pulse-monitor",
      "url": "https://www.pulsemcp.com/",
      "type": "monitoring",
      "enabled": true
    }
  ],
  "monitoring": {
    "interval": 30,
    "alerts": {
      "enabled": true,
      "webhook": "${PULSE_WEBHOOK_URL}"
    }
  }
}
EOF

# =============================================================================
# 2. CURSOR DIRECTORY RULES INTEGRATION
# =============================================================================

echo "📋 Setting up Cursor Directory Rules..."

CURSOR_RULES_DIR="$HOME/.cursor/rules"
mkdir -p "$CURSOR_RULES_DIR"

# Create comprehensive cursor rules based on best practices
cat > "$CURSOR_RULES_DIR/comprehensive-dev-rules.mdc" << 'EOF'
---
description: Comprehensive development rules for Cursor IDE
globs: *
alwaysApply: true
---

# Comprehensive Development Rules

## Code Quality Standards
- Use TypeScript for all new code
- Implement proper error handling with try/catch
- Write comprehensive unit tests for all functions
- Use meaningful variable and function names
- Add JSDoc comments for all public APIs

## Performance Guidelines
- Avoid memory leaks in long-running applications
- Use efficient data structures and algorithms
- Implement proper caching strategies
- Monitor and optimize bundle sizes
- Use lazy loading for large components

## Security Best Practices
- Validate all user inputs
- Use parameterized queries for database operations
- Implement proper authentication and authorization
- Sanitize data before rendering
- Keep dependencies updated and audit for vulnerabilities

## Architecture Patterns
- Use modular architecture with clear separation of concerns
- Implement proper dependency injection
- Follow SOLID principles
- Use design patterns appropriately
- Maintain clean architecture boundaries

## Testing Strategy
- Write tests before implementing features (TDD)
- Maintain high test coverage (>80%)
- Include integration and e2e tests
- Test error conditions and edge cases
- Use property-based testing where applicable

## Documentation Standards
- Maintain comprehensive README files
- Document all public APIs with examples
- Keep CHANGELOG updated
- Write clear commit messages
- Document architectural decisions
EOF

# =============================================================================
# 3. CURSOR DIRECTORY MCP INTEGRATION
# =============================================================================

echo "🔗 Setting up Cursor Directory MCP..."

CURSOR_MCP_DIR="$HOME/.cursor/mcp"
mkdir -p "$CURSOR_MCP_DIR"

# Update MCP configuration with Cursor Directory servers
cat > "$CURSOR_MCP_DIR/cursor-directory-mcp.json" << 'EOF'
{
  "mcpServers": {
    "cursor-directory": {
      "command": "npx",
      "args": ["-y", "@cursor/directory-mcp"],
      "env": {
        "CURSOR_API_KEY": "${CURSOR_API_KEY}"
      }
    },
    "pulse-mcp": {
      "command": "npx",
      "args": ["-y", "pulse-mcp"],
      "env": {
        "PULSE_API_KEY": "${PULSE_API_KEY}",
        "PULSE_WEBHOOK_URL": "${PULSE_WEBHOOK_URL}"
      }
    },
    "test-sprite-mcp": {
      "command": "npx",
      "args": ["-y", "@testsprite/mcp-server"],
      "env": {
        "TESTSPRITE_API_KEY": "${TESTSPRITE_API_KEY}"
      }
    }
  }
}
EOF

# =============================================================================
# 4. CLAUDE INTEGRATION SETUP
# =============================================================================

echo "🤖 Setting up Claude Integration..."

CLAUDE_DIR="$HOME/.claude"
mkdir -p "$CLAUDE_DIR"

# Claude configuration
cat > "$CLAUDE_DIR/config.json" << 'EOF'
{
  "version": "1.0",
  "integrations": {
    "claude-code": {
      "enabled": true,
      "commands": {
        "source": "https://claudecodecommands.directory/",
        "auto_execute": false
      }
    },
    "claude-log": {
      "url": "https://claudelog.com/",
      "enabled": true
    },
    "playbooks": {
      "url": "https://playbooks.com/modes",
      "enabled": true
    }
  },
  "api_keys": {
    "anthropic": "${ANTHROPIC_API_KEY}",
    "claude": "${CLAUDE_API_KEY}"
  }
}
EOF

# Claude commands directory setup
CLAUDE_COMMANDS_DIR="$HOME/.claude/commands"
mkdir -p "$CLAUDE_COMMANDS_DIR"

cat > "$CLAUDE_COMMANDS_DIR/README.md" << 'EOF'
# Claude Commands Directory

This directory contains Claude Code commands and integrations.

## Available Commands

### Development Commands
- `claude-code review` - Code review with AI assistance
- `claude-code refactor` - Refactoring suggestions
- `claude-code test` - Generate test cases
- `claude-code docs` - Generate documentation

### Integration Commands
- `claude-log analyze` - Log analysis with Claude
- `playbook mode dev` - Development mode playbooks
- `playbook mode review` - Code review playbooks

## Configuration

Commands are sourced from:
- https://claudecodecommands.directory/
- https://claudelog.com/
- https://playbooks.com/modes

## Usage

```bash
# Enable Claude commands
source ~/.claude/commands/enable.sh

# Use a command
claude-code review --file myfile.js
```
EOF

# =============================================================================
# 5. SUPADATA INTEGRATION (Web & Video to Text API)
# =============================================================================

echo "🎥 Setting up Supadata Integration..."

SUPADATA_DIR="$HOME/.supadata"
mkdir -p "$SUPADATA_DIR"

cat > "$SUPADATA_DIR/config.json" << 'EOF'
{
  "version": "1.0",
  "apis": {
    "web-to-text": {
      "endpoint": "https://api.supadata.ai/web-to-text",
      "api_key": "${SUPADATA_API_KEY}",
      "enabled": true
    },
    "video-to-text": {
      "endpoint": "https://api.supadata.ai/video-to-text",
      "api_key": "${SUPADATA_API_KEY}",
      "enabled": true,
      "supported_formats": ["mp4", "avi", "mov", "webm"]
    }
  },
  "features": {
    "batch_processing": true,
    "real_time_processing": false,
    "quality": "high"
  }
}
EOF

# =============================================================================
# 6. HELIX EDITOR INTEGRATION
# =============================================================================

echo "🌀 Setting up Helix Editor..."

HELIX_DIR="$HOME/.helix"
mkdir -p "$HELIX_DIR"

# Helix configuration
cat > "$HELIX_DIR/config.toml" << 'EOF'
# Helix Editor Configuration
# https://github.com/helix-editor/helix

theme = "onedark"

[editor]
line-number = "relative"
mouse = false
middle-click-paste = false
scroll-lines = 3
rulers = [80, 120]

[editor.cursor-shape]
insert = "bar"
normal = "block"
select = "underline"

[editor.file-picker]
hidden = false

[editor.lsp]
display-messages = true

[keys.normal]
"C-s" = ":w"
"C-q" = ":q"

[keys.insert]
"C-s" = ":w"
EOF

# Helix languages configuration
cat > "$HELIX_DIR/languages.toml" << 'EOF'
# Language configurations for Helix

[language-server.typescript-language-server]
command = "typescript-language-server"
args = ["--stdio"]

[language-server.pyright]
command = "pyright-langserver"
args = ["--stdio"]

[language-server.rust-analyzer]
command = "rust-analyzer"

[[language]]
name = "typescript"
scope = "source.ts"
injection-regex = "ts"
file-types = ["ts"]
roots = ["package.json", "tsconfig.json"]
language-server = { command = "typescript-language-server", args = ["--stdio"] }
indent = { tab-width = 2, unit = "  " }

[[language]]
name = "javascript"
scope = "source.js"
injection-regex = "js"
file-types = ["js", "mjs"]
roots = ["package.json"]
language-server = { command = "typescript-language-server", args = ["--stdio"] }
indent = { tab-width = 2, unit = "  " }

[[language]]
name = "python"
scope = "source.python"
file-types = ["py", "pyw", "pyi"]
roots = ["pyproject.toml", "setup.py", "requirements.txt"]
language-server = { command = "pyright-langserver", args = ["--stdio"] }
indent = { tab-width = 4, unit = "    " }

[[language]]
name = "rust"
scope = "source.rust"
file-types = ["rs"]
roots = ["Cargo.toml"]
language-server = { command = "rust-analyzer" }
indent = { tab-width = 4, unit = "    " }
EOF

# =============================================================================
# 7. BETTERSTACK LOGGING INTEGRATION
# =============================================================================

echo "📝 Setting up BetterStack Logging..."

LOGGING_DIR="$HOME/.logging"
mkdir -p "$LOGGING_DIR"

cat > "$LOGGING_DIR/betterstack-config.json" << 'EOF'
{
  "version": "1.0",
  "provider": "betterstack",
  "documentation": "https://betterstack.com/community/guides/logging/",
  "configuration": {
    "structured_logging": {
      "enabled": true,
      "format": "json"
    },
    "log_levels": {
      "development": "debug",
      "production": "info",
      "test": "error"
    },
    "transports": [
      {
        "type": "console",
        "level": "debug",
        "format": "human"
      },
      {
        "type": "file",
        "level": "info",
        "path": "/var/log/application.log",
        "max_size": "10m",
        "max_files": "5"
      },
      {
        "type": "betterstack",
        "level": "info",
        "api_key": "${BETTERSTACK_API_KEY}",
        "endpoint": "https://logs.betterstack.com/"
      }
    ],
    "context": {
      "service": "polyglot-dev-env",
      "version": "1.0.0",
      "environment": "${NODE_ENV:-development}"
    }
  }
}
EOF

# =============================================================================
# 8. DOTFILES INSPIRATION INTEGRATION
# =============================================================================

echo "📄 Setting up Dotfiles Inspiration..."

DOTFILES_DIR="$HOME/.dotfiles-inspiration"
mkdir -p "$DOTFILES_DIR"

cat > "$DOTFILES_DIR/README.md" << 'EOF'
# Dotfiles Inspiration

Inspired by https://dotfiles.github.io/inspiration/

This directory contains configurations and scripts inspired by the best dotfiles setups.

## Featured Setups

### Development Tools
- **Modern Shell**: zsh with powerlevel10k, autosuggestions, syntax highlighting
- **Terminal Multiplexer**: tmux with custom layouts and plugins
- **Editor**: Multiple editor support (Cursor, Helix, VS Code)
- **Version Control**: Git with advanced configurations

### Productivity Tools
- **File Management**: Modern CLI tools (fd, ripgrep, bat, exa)
- **Containerization**: Docker with extensions and test containers
- **Package Management**: Universal package managers (pixi, pnpm)
- **Code Quality**: Comprehensive linting and testing tools

### System Integration
- **MCP Servers**: Model Context Protocol for AI integration
- **Container Orchestration**: Kubernetes with Helm
- **Logging**: Structured logging with BetterStack
- **Monitoring**: System and application monitoring

## Key Features

1. **Modular Configuration**: Easy to enable/disable components
2. **Cross-Platform**: Works on macOS, Linux, and Windows (WSL)
3. **Version Controlled**: All configurations tracked in git
4. **Well Documented**: Comprehensive documentation for all features
5. **Security Conscious**: Proper API key management and permissions

## Usage

```bash
# Clone inspiration repository
git clone https://github.com/dotfiles/dotfiles.github.io.git ~/.dotfiles-inspiration

# Explore different setups
ls ~/.dotfiles-inspiration/inspiration

# Apply configurations
./install.sh
```
EOF

# =============================================================================
# 9. INTEGRATION SCRIPTS
# =============================================================================

echo "🔗 Creating integration scripts..."

INTEGRATION_DIR="$HOME/.extended-integration"
mkdir -p "$INTEGRATION_DIR"

# Main integration script
cat > "$INTEGRATION_DIR/extended-setup.sh" << 'EOF'
#!/bin/bash
# Extended Ecosystem Integration

echo "🚀 Loading Extended Ecosystem Integrations..."

# Claude integration
export CLAUDE_CONFIG="$HOME/.claude/config.json"

# Pulse MCP
export PULSE_CONFIG="$HOME/.pulse-mcp/config.json"

# Supadata
export SUPADATA_CONFIG="$HOME/.supadata/config.json"

# Helix
export HELIX_CONFIG="$HOME/.helix/config.toml"

# Logging
export LOGGING_CONFIG="$HOME/.logging/betterstack-config.json"

# Cursor Directory
export CURSOR_RULES_DIR="$HOME/.cursor/rules"

echo "✅ Extended ecosystem integrations loaded!"
EOF

chmod +x "$INTEGRATION_DIR/extended-setup.sh"

# =============================================================================
# 10. VALIDATION AND HEALTH CHECKS
# =============================================================================

echo "🔍 Creating validation scripts..."

VALIDATION_DIR="$HOME/.extended-validation"
mkdir -p "$VALIDATION_DIR"

cat > "$VALIDATION_DIR/health-check.sh" << 'EOF'
#!/bin/bash
# Extended Ecosystem Health Check

echo "🏥 Extended Ecosystem Health Check"
echo "=================================="

# Check configurations
configs=(
    "$HOME/.pulse-mcp/config.json:PulseMCP"
    "$HOME/.cursor/rules/comprehensive-dev-rules.mdc:Cursor Rules"
    "$HOME/.cursor/mcp/cursor-directory-mcp.json:Cursor Directory MCP"
    "$HOME/.claude/config.json:Claude Integration"
    "$HOME/.supadata/config.json:Supadata"
    "$HOME/.helix/config.toml:Helix Editor"
    "$HOME/.logging/betterstack-config.json:BetterStack Logging"
)

for config in "${configs[@]}"; do
    file="${config%%:*}"
    name="${config#*:}"
    if [ -f "$file" ]; then
        echo "✅ $name: Configured"
    else
        echo "❌ $name: Not configured"
    fi
done

# Check API keys (without revealing values)
api_keys=(
    "ANTHROPIC_API_KEY:Claude API"
    "CURSOR_API_KEY:Cursor API"
    "PULSE_API_KEY:Pulse API"
    "SUPADATA_API_KEY:Supadata API"
    "TESTSPRITE_API_KEY:TestSprite API"
    "BETTERSTACK_API_KEY:BetterStack API"
)

echo ""
echo "🔑 API Key Status:"
for key_info in "${api_keys[@]}"; do
    key="${key_info%%:*}"
    name="${key_info#*:}"
    if [ -n "${!key:-}" ]; then
        echo "✅ $name: Set"
    else
        echo "⚠️ $name: Not set"
    fi
done

echo ""
echo "📋 Recommendations:"
echo "1. Set missing API keys in your environment"
echo "2. Review and customize configurations"
echo "3. Test integrations with your development workflow"
echo "4. Update documentation as you customize setups"

echo "=================================="
EOF

chmod +x "$VALIDATION_DIR/health-check.sh"

# =============================================================================
# 11. DOCUMENTATION
# =============================================================================

echo "📚 Creating comprehensive documentation..."

DOCS_DIR="$HOME/.extended-docs"
mkdir -p "$DOCS_DIR"

cat > "$DOCS_DIR/README.md" << 'EOF'
# Extended Ecosystem Integration

This setup integrates advanced development tools and services for a comprehensive polyglot development environment.

## Components

### 🤖 AI & LLM Integration
- **Claude**: Code generation, review, and assistance
- **PulseMCP**: Real-time MCP server monitoring
- **Supadata**: Web and video content to text conversion
- **Cursor Directory MCP**: Enhanced Cursor IDE capabilities

### 📝 Development Tools
- **Helix Editor**: Modern modal editor with LSP support
- **Cursor Rules**: Comprehensive development guidelines
- **TestSprite MCP**: Advanced testing capabilities
- **Dotfiles Inspiration**: Best practices from dotfiles community

### 📊 Observability & Logging
- **BetterStack**: Structured logging and monitoring
- **XDG Standards**: Cross-desktop compatibility
- **Free Desktop**: Standards compliance

### 🔗 Integration Points
- **MCP Ecosystem**: Model Context Protocol servers
- **Container Tools**: Docker, Kubernetes, Helm integration
- **Package Registries**: Artifact Hub, Cloudsmith, Docker Hub

## Quick Start

```bash
# Run health check
~/.extended-validation/health-check.sh

# Load integrations
source ~/.extended-integration/extended-setup.sh

# Use Helix editor
hx myfile.rs

# Access Claude commands
claude-code review --file myfile.js
```

## Configuration

### API Keys Setup
```bash
# Add to your shell profile or .env file
export ANTHROPIC_API_KEY="your-key"
export CURSOR_API_KEY="your-key"
export PULSE_API_KEY="your-key"
export SUPADATA_API_KEY="your-key"
export TESTSPRITE_API_KEY="your-key"
export BETTERSTACK_API_KEY="your-key"
```

### Customization
1. Edit configuration files in respective directories
2. Modify rules in `~/.cursor/rules/`
3. Customize Helix settings in `~/.helix/`
4. Update logging configuration in `~/.logging/`

## Resources

- [Cursor Directory](https://cursor.directory/)
- [PulseMCP](https://www.pulsemcp.com/)
- [Claude Commands](https://claudecodecommands.directory/)
- [WebContainers](https://webcontainers.io/)
- [Test Containers](https://testcontainers.com/)
- [Helix Editor](https://github.com/helix-editor/helix)
- [TestSprite](https://www.testsprite.com/)
- [Free Desktop](https://www.freedesktop.org/)
- [BetterStack Logging](https://betterstack.com/community/guides/logging/)
- [Dotfiles Inspiration](https://dotfiles.github.io/inspiration/)

## Troubleshooting

### Common Issues
1. **API Key Missing**: Set required environment variables
2. **MCP Server Down**: Check server status and restart
3. **Configuration Invalid**: Validate JSON/YAML syntax
4. **Permissions Error**: Ensure proper file permissions

### Debug Commands
```bash
# Check MCP server status
ps aux | grep mcp

# Validate configurations
find ~/. -name "*.json" -exec echo "Checking {}" \; -exec jq . {} \; 2>/dev/null

# Test integrations
curl -s https://api.supadata.ai/health
```
EOF

echo "✅ Extended MCP ecosystem setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Set API keys for Claude, Pulse, Supadata, etc."
echo "2. Run: ~/.extended-validation/health-check.sh"
echo "3. Review and customize configurations"
echo "4. Test Helix editor: hx --help"
echo "5. Explore Claude integrations"