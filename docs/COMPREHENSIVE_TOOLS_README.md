# Comprehensive Development Environment

This environment integrates **50+ development tools** using Pixi for reproducible, cross-platform package management. Everything is configured for maximum productivity and automation.

## 🚀 Quick Start

```bash
# Install Pixi environment (conda-forge tools)
pixi install

# Install remaining tools (brew, npm, cargo, etc.)
pixi run install-tools

# Setup shell configurations (zsh, starship, tmux, etc.)
pixi run setup-shell

# Full setup (all of the above)
pixi run full-setup

# Verify everything works
pixi run doctor
```

## 🛠️ Tool Categories

### CLI Tools (Fast, Efficient Command Line)
| Tool | Purpose | Install Method | Usage |
|------|---------|----------------|-------|
| **fd** | Fast find alternative | brew | `fd pattern` |
| **ripgrep (rg)** | Fast recursive grep | pixi | `rg pattern` |
| **fzf** | Fuzzy finder | pixi | `fzf` or `Ctrl+R` in shell |
| **bat** | Cat with syntax highlighting | pixi | `bat file.txt` |
| **jq** | JSON processor | pixi | `cat data.json \| jq '.key'` |
| **yq** | YAML processor | brew | `cat config.yaml \| yq '.key'` |
| **tree** | Directory tree view | pixi | `tree` |
| **htop** | Process monitor | pixi | `htop` |
| **gh** | GitHub CLI | brew | `gh repo clone user/repo` |
| **pass** | Password manager | brew | `pass init` |
| **stow** | Symlink farm manager | brew | `stow package` |
| **zoxide** | Smart directory jumping | pixi | `z directory` or `zi pattern` |
| **navi** | Interactive cheatsheet | brew | `navi` |
| **tldr** | Simplified man pages | brew | `tldr command` |
| **neofetch** | System info display | brew | `neofetch` |

### Development Tools
| Tool | Purpose | Install Method | Usage |
|------|---------|----------------|-------|
| **Python** | Core language | pixi | `python script.py` |
| **Node.js** | JavaScript runtime | pixi | `node app.js` |
| **Rust** | Systems programming | pixi | `rustc --version` |
| **Go** | Cloud-native language | pixi | `go run main.go` |
| **Java** | Enterprise development | pixi | `java -version` |
| **pyenv** | Python version manager | brew | `pyenv install 3.11` |
| **pipenv** | Python dependency management | brew | `pipenv install` |
| **rbenv** | Ruby version manager | brew | `rbenv install 3.1` |
| **nvm** | Node version manager | brew | `nvm use 18` |
| **pnpm** | Fast npm alternative | npm | `pnpm install` |

### Code Analysis & Quality
| Tool | Purpose | Install Method | Usage |
|------|---------|----------------|-------|
| **ruff** | Fast Python linter | pixi | `ruff check .` |
| **mypy** | Python type checker | pixi | `mypy file.py` |
| **ast-grep** | AST-aware code search | cargo | `ast-grep pattern` |
| **semgrep** | Semantic code analysis | pip | `semgrep --config auto` |
| **oxlint** | Fast JS/TS linter | cargo | `oxlint` |
| **knip** | Unused dependency detector | npm | `knip` |

### Performance & Profiling
| Tool | Purpose | Install Method | Usage |
|------|---------|----------------|-------|
| **py-spy** | Python CPU profiler | cargo | `py-spy top --pid 1234` |
| **memory-profiler** | Python memory analysis | pip | `python -m memory_profiler script.py` |
| **pytest-benchmark** | Performance testing | pip | `pytest --benchmark-only` |

### Cloud & Infrastructure
| Tool | Purpose | Install Method | Usage |
|------|---------|----------------|-------|
| **kubectl** | Kubernetes CLI | brew | `kubectl get pods` |
| **awscli** | AWS CLI | pixi | `aws s3 ls` |
| **docker** | Container runtime | system | `docker run image` |
| **docker-compose** | Multi-container apps | system | `docker-compose up` |

### AI & ML Tools
| Tool | Purpose | Install Method | Usage |
|------|---------|----------------|-------|
| **ollama** | Local LLM runtime | script | `ollama run llama3.2` |
| **huggingface** | ML model hub | - | Access via APIs |
| **transformers** | ML library | pip | `import transformers` |

### Shell & Terminal Enhancements
| Tool | Purpose | Install Method | Usage |
|------|---------|----------------|-------|
| **zsh** | Advanced shell | pixi | Default shell |
| **oh-my-zsh** | Zsh framework | script | Plugin manager |
| **powerlevel10k** | Zsh theme | script | Beautiful prompts |
| **starship** | Cross-shell prompt | pixi | `eval "$(starship init zsh)"` |
| **tmux** | Terminal multiplexer | pixi | `tmux` |
| **atuin** | Shell history | brew | `atuin import` |
| **zsh-autosuggestions** | Command suggestions | script | Auto-complete |
| **zsh-syntax-highlighting** | Syntax highlighting | script | Real-time highlighting |

## 📋 Available Tasks

Run these with `pixi run <task>`:

| Task | Description |
|------|-------------|
| `install` | Install Python packages |
| `clean` | Clean pip cache |
| `test` | Test scientific stack |
| `test-ml` | Test ML stack |
| `test-all` | Test all stacks |
| `start` | Show ready message |
| `check` | Verify environment |
| `lint` | Run ruff linter |
| `format` | Format code with ruff |
| `type-check` | Run mypy |
| `quality` | Run all quality checks |
| `shell` | Start Pixi shell |
| `search` | Test search tools |
| `analyze` | Test analysis tools |
| `profile` | Test profiling tools |
| `benchmark` | Run benchmarks |
| `cloud` | Test cloud tools |
| `db` | Check database tools |
| `ai` | Test AI tools |
| `install-tools` | Install remaining tools |
| `setup-shell` | Setup shell configurations |
| `dev-setup` | Install tools + setup shell |
| `full-setup` | Complete environment setup |
| `doctor` | Comprehensive health check |

## 🎯 Development Workflows

### Python Development
```bash
# Activate environment
pixi shell

# Install dependencies
pip install -r requirements.txt

# Run quality checks
pixi run quality

# Profile performance
pixi run profile
```

### Web Development
```bash
# Use pnpm (faster than npm)
pnpm install
pnpm dev

# Lint and format
oxlint
knip
```

### Systems Programming
```bash
# Rust development
cargo build
cargo test

# Go development
go mod tidy
go run main.go
```

### Cloud Development
```bash
# Kubernetes
kubectl get pods

# AWS
aws s3 ls

# Docker
docker build -t myapp .
```

### AI/ML Development
```bash
# Start Ollama
ollama serve

# Run a model
ollama run llama3.2:3b

# Python ML
python -c "import torch; print('GPU:', torch.cuda.is_available())"
```

## 🔍 Code Analysis Workflow

```bash
# Fast syntax checking
ruff check .

# Type checking
mypy .

# AST-aware search
ast-grep 'console\.log' --lang js

# Semantic analysis
semgrep --config auto .

# Performance profiling
py-spy top --pid $(pgrep python)
```

## 🚀 Performance Optimization

```bash
# Benchmark Python code
pytest --benchmark-only

# Memory profiling
python -m memory_profiler script.py

# System monitoring
htop

# Disk usage analysis
du -sh * | sort -h
```

## 🔧 Shell Productivity

### Zoxide (Smart Directory Jumping)
```bash
# Jump to frequently used directories
z projects
zi dev  # Interactive selection

# Add directory to database
zoxide add /path/to/project
```

### Atuin (Enhanced History)
```bash
# Search history interactively
Ctrl+R

# Stats
atuin stats
```

### FZF (Fuzzy Finding)
```bash
# Find files
find . -type f | fzf

# Git branch selection
git branch | fzf | xargs git checkout
```

### Tmux (Terminal Multiplexer)
```bash
# Start tmux
tmux

# Keybindings (Ctrl-a prefix)
Ctrl-a |  # Split vertically
Ctrl-a -  # Split horizontally
Ctrl-a h/j/k/l  # Navigate panes
Ctrl-a r  # Reload config
```

## 📊 Environment Health

### Quick Health Check
```bash
pixi run doctor
```

### Detailed Analysis
```bash
# Check all tools
pixi run list-tools

# Test search capabilities
pixi run search

# Verify analysis tools
pixi run analyze
```

### Performance Monitoring
```bash
# System resources
neofetch

# Process monitoring
htop

# Benchmark current setup
pixi run benchmark
```

## 🔄 Updating the Environment

```bash
# Update Pixi packages
pixi update

# Update external tools
pixi run install-tools

# Full refresh
pixi run full-setup
```

## 🐛 Troubleshooting

### Common Issues

1. **Tool not found**: Run `pixi run install-tools`
2. **Shell not configured**: Run `pixi run setup-shell`
3. **Python packages missing**: Run `pip install -r requirements.txt`
4. **Environment not activated**: Run `pixi shell`

### Debug Commands
```bash
# Check Pixi status
pixi --version

# List installed packages
pixi list

# Check environment
pixi info

# Clean and reinstall
pixi clean
pixi install
```

## 📚 Resources

- [Pixi Documentation](https://pixi.sh)
- [Conda-Forge Packages](https://conda-forge.org)
- [Homebrew Formulae](https://formulae.brew.sh)
- [Rust Crates](https://crates.io)
- [npm Packages](https://www.npmjs.com)

## 🤝 Contributing

This environment is designed to be modular and extensible. To add new tools:

1. Add to appropriate category in `pixi.toml` (if available via conda)
2. Or add installation logic to `install_remaining_tools.sh`
3. Update this README
4. Test with `pixi run doctor`

## 📄 License

This environment configuration is provided as-is for development productivity.