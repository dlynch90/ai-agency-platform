# Vendor-Only Aliases - Managed by chezmoi
# NO CUSTOM CODE - All aliases use vendor-provided tools

# File operations with vendor tools
if command -v fd >/dev/null 2>&1; then
    alias find='fd'
fi

if command -v rg >/dev/null 2>&1; then
    alias grep='rg'
fi

if command -v bat >/dev/null 2>&1; then
    alias cat='bat --paging=never'
fi

# Development shortcuts using vendor tools
if command -v python3 >/dev/null 2>&1; then
    alias py='python3'
    alias pip='python3 -m pip'
    alias venv='python3 -m venv'
fi

# Git shortcuts (git is vendor-provided)
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline'

# Docker shortcuts (docker is vendor-provided)
if command -v docker >/dev/null 2>&1; then
    alias d='docker'
    alias dc='docker-compose'
    alias dcu='docker-compose up'
    alias dcd='docker-compose down'
fi

# Navigation (built-in shell features)
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'

# Listing (ls is vendor-provided)
alias ls='ls --color=auto'
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'

# Development workflow using vendor tools
if command -v pixi >/dev/null 2>&1; then
    alias run='pixi run'
    alias test='pixi run test'
    alias build='pixi run build'
fi

# Code quality using vendor tools
if command -v ruff >/dev/null 2>&1 && command -v mypy >/dev/null 2>&1; then
    alias lint='ruff check && mypy'
    alias format='ruff format'
    alias check='lint && test'
fi

# Language-specific search using vendor tools
if command -v fd >/dev/null 2>&1; then
    alias findpy='fd "\.py$"'
    alias findjs='fd "\.js$|\.ts$|\.jsx$|\.tsx$"'
    alias findmd='fd "\.md$"'
fi

# Kubernetes shortcuts (kubectl is vendor-provided)
if command -v kubectl >/dev/null 2>&1; then
    alias k='kubectl'
    alias kg='kubectl get'
    alias kgp='kubectl get pods'
    alias kgs='kubectl get services'
    alias kgn='kubectl get nodes'
    alias kga='kubectl get all'
    alias kl='kubectl logs'
    alias kx='kubectl exec -it'
fi

# Helm shortcuts (helm is vendor-provided)
if command -v helm >/dev/null 2>&1; then
    alias h='helm'
    alias hi='helm install'
    alias hu='helm upgrade'
    alias hd='helm delete'
    alias hl='helm list'
    alias hs='helm status'
fi

# Docker cleanup (docker is vendor-provided)
if command -v docker >/dev/null 2>&1; then
    alias docker-clean='docker system prune -f && docker volume prune -f'
    alias docker-nuke='docker system prune -a -f --volumes'
fi

# Performance monitoring aliases
alias psmem='ps aux --sort=-%mem | head -10'
alias pscpu='ps aux --sort=-%cpu | head -10'

# Environment navigation using vendor tools
DEVELOPER_DIR="${DEVELOPER_DIR:-$HOME/Developer}"
alias dev="cd \"$DEVELOPER_DIR\""