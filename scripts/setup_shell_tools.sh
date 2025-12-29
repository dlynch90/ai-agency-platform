#!/bin/bash
# Setup shell tools and configurations
# This script configures zsh, starship, and other shell tools

set -e

echo "🐚 Setting up shell tools and configurations..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if file contains a line
file_contains() {
    local file=$1
    local line=$2
    grep -qF "$line" "$file" 2>/dev/null
}

# Add line to file if not present
add_to_file() {
    local file=$1
    local line=$2
    if [ ! -f "$file" ]; then
        touch "$file"
    fi
    if ! file_contains "$file" "$line"; then
        echo "$line" >> "$file"
        print_success "Added to $file: $line"
    else
        print_status "Already in $file: $line"
    fi
}

# Backup file
backup_file() {
    local file=$1
    if [ -f "$file" ]; then
        cp "$file" "${file}.backup.$(date +%Y%m%d_%H%M%S)"
        print_status "Backed up $file"
    fi
}

# Setup Zsh configuration
setup_zsh() {
    print_status "Setting up Zsh configuration..."

    ZSHRC="$HOME/.zshrc"

    backup_file "$ZSHRC"

    # Set Zsh as default shell if not already
    if [ "$SHELL" != "/bin/zsh" ] && [ "$SHELL" != "/usr/local/bin/zsh" ]; then
        print_status "Setting Zsh as default shell..."
        chsh -s "$(which zsh)"
        print_success "Zsh set as default shell"
    fi

    # Configure Oh My Zsh theme
    if [ -d "$HOME/.oh-my-zsh" ]; then
        # Set Powerlevel10k theme
        sed -i.bak 's/ZSH_THEME=".*"/ZSH_THEME="powerlevel10k\/powerlevel10k"/g' "$ZSHRC"
        print_success "Set Powerlevel10k theme"
    fi

    # Configure plugins
    if [ -d "$HOME/.oh-my-zsh/custom/plugins/zsh-autosuggestions" ] && \
       [ -d "$HOME/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting" ]; then
        # Add plugins to zshrc
        add_to_file "$ZSHRC" 'plugins=(git zsh-autosuggestions zsh-syntax-highlighting)'
        print_success "Configured Zsh plugins"
    fi

    # Add Pixi to PATH
    PIXI_PATH='export PATH="$HOME/.pixi/bin:$PATH"'
    add_to_file "$ZSHRC" "$PIXI_PATH"

    # Add local bin to PATH
    LOCAL_BIN='export PATH="$HOME/.local/bin:$PATH"'
    add_to_file "$ZSHRC" "$LOCAL_BIN"

    # Configure zoxide
    if command -v zoxide >/dev/null 2>&1; then
        ZOXIDE_INIT='eval "$(zoxide init zsh)"'
        add_to_file "$ZSHRC" "$ZOXIDE_INIT"
        print_success "Configured zoxide"
    fi

    # Configure starship
    if command -v starship >/dev/null 2>&1; then
        STARSHIP_INIT='eval "$(starship init zsh)"'
        add_to_file "$ZSHRC" "$STARSHIP_INIT"
        print_success "Configured starship"
    fi

    # Configure atuin
    if command -v atuin >/dev/null 2>&1; then
        ATUIN_INIT='eval "$(atuin init zsh)"'
        add_to_file "$ZSHRC" "$ATUIN_INIT"
        print_success "Configured atuin"
    fi

    print_success "Zsh configuration completed"
}

# Setup Starship configuration
setup_starship() {
    print_status "Setting up Starship configuration..."

    STARSHIP_CONFIG="$HOME/.config/starship.toml"

    mkdir -p "$(dirname "$STARSHIP_CONFIG")"

    if [ ! -f "$STARSHIP_CONFIG" ]; then
        cat > "$STARSHIP_CONFIG" << 'EOF'
# Starship configuration for comprehensive development environment

# General settings
format = """
[┌─](bold green)$username$hostname(white) in $directory$git_branch$git_commit$git_state$git_status$nix_shell$memory_usage$cmd_duration
[│](bold green)$python$nodejs$rust$golang$java$docker_context$aws$gcloud$azure$package
[└─](bold green)$character"""

# Username and hostname
[username]
style_user = "bright-blue bold"
style_root = "bright-red bold"
format = "[$user]($style)@"
show_always = true

[hostname]
style = "bright-green bold"
format = "[$hostname]($style) "
ssh_only = false
trim_at = "-"

# Directory
[directory]
style = "cyan bold"
format = "[$path]($style)"
truncation_length = 3
truncate_to_repo = true

# Git
[git_branch]
style = "bright-purple bold"
format = " on [$branch]($style)"

[git_status]
style = "bright-red bold"
format = "[$all_status$ahead_behind]($style)"

# Programming languages
[python]
style = "bright-yellow bold"
format = " via [🐍 $version]($style)"

[nodejs]
style = "bright-green bold"
format = " via [⬢ $version]($style)"

[rust]
style = "bright-red bold"
format = " via [🦀 $version]($style)"

[golang]
style = "bright-cyan bold"
format = " via [🐹 $version]($style)"

[java]
style = "bright-red bold"
format = " via [☕ $version]($style)"

# Cloud providers
[aws]
style = "bright-yellow bold"
format = " on [$profile]($style) "

[gcloud]
style = "bright-blue bold"
format = " on [$project]($style) "

[azure]
style = "bright-cyan bold"
format = " on [$subscription]($style) "

# Docker
[docker_context]
style = "bright-blue bold"
format = " via [🐳 $context]($style) "

# Package manager
[package]
style = "bright-cyan bold"
format = " using [$symbol$version]($style) "

# Performance
[memory_usage]
style = "bright-red bold"
format = " [$ram]($style) "

[cmd_duration]
style = "bright-yellow bold"
format = " took [$duration]($style) "

# Character
[character]
success_symbol = "[❯](bright-green bold)"
error_symbol = "[❯](bright-red bold)"
vimcmd_symbol = "[❮](bright-green bold)"
EOF
        print_success "Created Starship configuration"
    else
        print_status "Starship configuration already exists"
    fi
}

# Setup Zoxide configuration
setup_zoxide() {
    print_status "Setting up Zoxide configuration..."

    # Zoxide is configured in .zshrc, but we can set some defaults
    if command -v zoxide >/dev/null 2>&1; then
        # Initialize database if needed
        zoxide query --help >/dev/null 2>&1 || true
        print_success "Zoxide is ready"
    else
        print_warning "Zoxide not found, skipping configuration"
    fi
}

# Setup Atuin configuration
setup_atuin() {
    print_status "Setting up Atuin configuration..."

    if command -v atuin >/dev/null 2>&1; then
        # Import shell history if not already done
        if ! atuin status >/dev/null 2>&1; then
            print_status "Setting up Atuin database..."
            atuin import auto
            print_success "Atuin database initialized"
        else
            print_status "Atuin already configured"
        fi
    else
        print_warning "Atuin not found, skipping configuration"
    fi
}

# Setup Tmux configuration
setup_tmux() {
    print_status "Setting up Tmux configuration..."

    TMUX_CONFIG="$HOME/.tmux.conf"

    backup_file "$TMUX_CONFIG"

    # Basic tmux configuration
    cat > "$TMUX_CONFIG" << 'EOF'
# Tmux configuration for development environment

# Set prefix to Ctrl-a
unbind C-b
set -g prefix C-a
bind C-a send-prefix

# Enable mouse support
set -g mouse on

# Set default shell
set-option -g default-shell /bin/zsh

# Window and pane indexing
set -g base-index 1
setw -g pane-base-index 1

# Reload config
bind r source-file ~/.tmux.conf \; display "Reloaded!"

# Pane navigation
bind h select-pane -L
bind j select-pane -D
bind k select-pane -U
bind l select-pane -R

# Pane splitting
bind | split-window -h
bind - split-window -v

# Window navigation
bind -n M-1 select-window -t 1
bind -n M-2 select-window -t 2
bind -n M-3 select-window -t 3
bind -n M-4 select-window -t 4
bind -n M-5 select-window -t 5

# Status bar
set -g status-bg black
set -g status-fg white
set -g status-left '#[fg=green]#S '
set -g status-right '#[fg=yellow]%H:%M %d-%b-%y'

# Pane borders
set -g pane-border-style fg=colour240
set -g pane-active-border-style fg=colour39

# Window status
setw -g window-status-current-style fg=black,bg=green

# Vi mode
setw -g mode-keys vi

# Copy mode
bind -T copy-mode-vi v send -X begin-selection
bind -T copy-mode-vi y send -X copy-selection

# Plugins (if tmux plugin manager is installed)
# set -g @plugin 'tmux-plugins/tpm'
# set -g @plugin 'tmux-plugins/tmux-sensible'
# set -g @plugin 'tmux-plugins/tmux-resurrect'

# Initialize TMUX plugin manager (keep this line at the very bottom of tmux.conf)
# run '~/.tmux/plugins/tpm/tpm'
EOF

    print_success "Tmux configuration created"
}

# Setup Neofetch configuration
setup_neofetch() {
    print_status "Setting up Neofetch configuration..."

    NEOFETCH_CONFIG="$HOME/.config/neofetch/config.conf"

    mkdir -p "$(dirname "$NEOFETCH_CONFIG")"

    if [ ! -f "$NEOFETCH_CONFIG" ]; then
        cat > "$NEOFETCH_CONFIG" << 'EOF'
# Neofetch configuration

# Info
print_info() {
    info title
    info underline
    info "OS" distro
    info "Host" model
    info "Kernel" kernel
    info "Uptime" uptime
    info "Packages" packages
    info "Shell" shell
    info "Resolution" resolution
    info "DE" de
    info "WM" wm
    info "Theme" theme
    info "Icons" icons
    info "Terminal" term
    info "CPU" cpu
    info "GPU" gpu
    info "Memory" memory
    info "Disk" disk
    info "Battery" battery
    info "Font" font
    info "Song" song
    info "Local IP" local_ip
    info "Public IP" public_ip
    info "Users" users
    info cols
}

# Kernel
kernel_shorthand="on"

# Distro
distro_shorthand="off"

# OS
os_arch="on"

# Uptime
uptime_shorthand="on"

# Memory
memory_percent="on"
memory_unit="gib"

# Packages
package_managers="on"

# Shell
shell_path="off"
shell_version="on"

# CPU
cpu_brand="on"
cpu_speed="on"
cpu_cores="on"
cpu_temp="off"

# GPU
gpu_brand="on"
gpu_type="all"

# Colors
colors=(distro)

# Bold
bold="on"

# Underline
underline_enabled="on"

# Underline character
underline_char="-"

# Separator
separator=":"

# Block range
block_range=(0 15)

# Color blocks
color_blocks="on"

# Block width
block_width=3

# Block height
block_height=1

# Col offset
col_offset="auto"

# Background color
background_color=

# ASCII
ascii="auto"
ascii_distro="auto"
ascii_colors=(distro)
ascii_bold="on"

# Image
image_backend="ascii"
image_source="auto"
image_size="auto"
image_crop_mode="normal"
image_crop_offset="center"

# Gap
gap=3

# Y offset
yoffset=0

# X offset
xoffset=0

# Disable line wrap
disable_line_wrap="off"

# Refresh rate
refresh_rate="off"

# stdout
stdout="off"
EOF
        print_success "Neofetch configuration created"
    else
        print_status "Neofetch configuration already exists"
    fi
}

# Main setup function
main() {
    print_status "Starting shell tools setup..."

    setup_zsh
    echo ""
    setup_starship
    echo ""
    setup_zoxide
    echo ""
    setup_atuin
    echo ""
    setup_tmux
    echo ""
    setup_neofetch

    echo ""
    print_success "🎉 Shell tools setup completed!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Restart your terminal or run: source ~/.zshrc"
    echo "2. Test the configurations:"
    echo "   - zsh (should load with new theme and plugins)"
    echo "   - starship (should show in prompt)"
    echo "   - zoxide (cd around and use zi/z)"
    echo "   - atuin (shell history search with Ctrl+R)"
    echo "   - tmux (should have custom keybindings)"
    echo "   - neofetch (run neofetch to see custom config)"
    echo ""
    echo "🔧 Configured tools:"
    echo "   • Zsh with Oh My Zsh, Powerlevel10k, and plugins"
    echo "   • Starship prompt"
    echo "   • Zoxide smart directory jumping"
    echo "   • Atuin shell history"
    echo "   • Tmux with custom configuration"
    echo "   • Neofetch with custom display"
}

# Run main function
main