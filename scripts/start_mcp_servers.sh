#!/bin/bash
# MCP Servers Management Script
# Starts all 35 MCP servers for comprehensive AI agent capabilities

set -euo pipefail

# Configuration
MCP_CONFIG_FILE="${MCP_CONFIG_FILE:-mcp-config.toml}"
LOG_DIR="${LOG_DIR:-logs/mcp}"
PID_DIR="${PID_DIR:-.mcp/pids}"

# Create directories
mkdir -p "$LOG_DIR" "$PID_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/mcp_startup.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/mcp_startup.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/mcp_startup.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/mcp_startup.log"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Start MCP server
start_mcp_server() {
    local server_name="$1"
    local server_config="$2"
    local log_file="$LOG_DIR/${server_name}.log"
    local pid_file="$PID_DIR/${server_name}.pid"

    # Check if already running
    if [[ -f "$pid_file" ]]; then
        local existing_pid
        existing_pid=$(cat "$pid_file")
        if kill -0 "$existing_pid" 2>/dev/null; then
            log_warning "MCP server '$server_name' is already running (PID: $existing_pid)"
            return 0
        else
            log_warning "Removing stale PID file for '$server_name'"
            rm -f "$pid_file"
        fi
    fi

    log_info "Starting MCP server: $server_name"

    # Parse server configuration
    local command
    local args=()
    local env_vars=()

    # Extract command and args from config
    command=$(echo "$server_config" | grep -oP 'command = "\K[^"]*')
    if [[ -z "$command" ]]; then
        log_error "No command specified for server '$server_name'"
        return 1
    fi

    # Extract args
    local arg_line
    arg_line=$(echo "$server_config" | grep -A 10 'args = \[' | grep -v 'args = \[' | grep -v '^\s*]' | tr -d '",' | tr -d '[' | tr -d ']')
    if [[ -n "$arg_line" ]]; then
        # Split args by comma and clean up
        IFS=',' read -ra args <<< "$arg_line"
        for i in "${!args[@]}"; do
            args[$i]=$(echo "${args[$i]}" | sed 's/^\s*//;s/\s*$//')
        done
    fi

    # Extract environment variables
    local env_section
    env_section=$(echo "$server_config" | sed -n '/\[servers\.'"$server_name"'\.env\]/,/^\[/p' | head -n -1)
    if [[ -n "$env_section" ]]; then
        while IFS='=' read -r key value; do
            if [[ -n "$key" && -n "$value" ]]; then
                key=$(echo "$key" | sed 's/^\s*//;s/\s*$//')
                value=$(echo "$value" | sed 's/^\s*"\?\(.*\)"\?\s*$/\1/')
                env_vars+=("$key=$value")
            fi
        done <<< "$(echo "$env_section" | grep '=' | sed 's/^\s*//')"
    fi

    # Build command with environment variables
    local full_command=("$command")
    [[ ${#args[@]} -gt 0 ]] && full_command+=("${args[@]}")

    # Add environment variables
    local env_prefix=""
    for env_var in "${env_vars[@]}"; do
        env_prefix="$env_prefix$env_var "
    done

    # Start server in background
    log_info "Executing: $env_prefix${full_command[*]}"
    nohup env $env_prefix "${full_command[@]}" > "$log_file" 2>&1 &
    local pid=$!

    # Save PID
    echo $pid > "$pid_file"

    # Wait a moment and check if still running
    sleep 2
    if kill -0 $pid 2>/dev/null; then
        log_success "MCP server '$server_name' started successfully (PID: $pid)"
        return 0
    else
        log_error "MCP server '$server_name' failed to start. Check logs: $log_file"
        rm -f "$pid_file"
        return 1
    fi
}

# Stop MCP server
stop_mcp_server() {
    local server_name="$1"
    local pid_file="$PID_DIR/${server_name}.pid"

    if [[ ! -f "$pid_file" ]]; then
        log_warning "No PID file found for server '$server_name'"
        return 0
    fi

    local pid
    pid=$(cat "$pid_file")

    if kill -0 "$pid" 2>/dev/null; then
        log_info "Stopping MCP server '$server_name' (PID: $pid)"
        kill "$pid"

        # Wait for graceful shutdown
        local count=0
        while kill -0 "$pid" 2>/dev/null && [[ $count -lt 10 ]]; do
            sleep 1
            ((count++))
        done

        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            log_warning "Force killing MCP server '$server_name'"
            kill -9 "$pid"
        fi
    fi

    rm -f "$pid_file"
    log_success "MCP server '$server_name' stopped"
}

# Check MCP server status
check_mcp_server() {
    local server_name="$1"
    local pid_file="$PID_DIR/${server_name}.pid"
    local log_file="$LOG_DIR/${server_name}.log"

    if [[ ! -f "$pid_file" ]]; then
        echo -e "${RED}❌${NC} $server_name: Not running (no PID file)"
        return 1
    fi

    local pid
    pid=$(cat "$pid_file")

    if kill -0 "$pid" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $server_name: Running (PID: $pid)"
        return 0
    else
        echo -e "${RED}❌${NC} $server_name: Dead process (PID: $pid)"
        rm -f "$pid_file"
        return 1
    fi
}

# Main functions
start_all_servers() {
    log_info "Starting all MCP servers..."

    local failed_servers=()

    # Read and parse MCP config
    if [[ ! -f "$MCP_CONFIG_FILE" ]]; then
        log_error "MCP config file not found: $MCP_CONFIG_FILE"
        exit 1
    fi

    # Extract server names
    local server_names
    server_names=$(grep '^\[servers\.' "$MCP_CONFIG_FILE" | sed 's/\[servers\.//' | sed 's/\]//' | sed 's/\.env\]//')

    # Remove duplicates
    server_names=$(echo "$server_names" | sort | uniq)

    for server_name in $server_names; do
        log_info "Processing server: $server_name"

        # Extract server configuration
        local server_config
        server_config=$(sed -n "/^\[servers\.$server_name\]/,/^\[servers\./p" "$MCP_CONFIG_FILE" | head -n -1)

        if [[ -z "$server_config" ]]; then
            log_warning "No configuration found for server '$server_name'"
            continue
        fi

        if ! start_mcp_server "$server_name" "$server_config"; then
            failed_servers+=("$server_name")
        fi
    done

    if [[ ${#failed_servers[@]} -gt 0 ]]; then
        log_error "Failed to start servers: ${failed_servers[*]}"
        return 1
    else
        log_success "All MCP servers started successfully"
        return 0
    fi
}

stop_all_servers() {
    log_info "Stopping all MCP servers..."

    if [[ ! -d "$PID_DIR" ]]; then
        log_warning "No PID directory found"
        return 0
    fi

    local failed_servers=()

    for pid_file in "$PID_DIR"/*.pid; do
        if [[ -f "$pid_file" ]]; then
            local server_name
            server_name=$(basename "$pid_file" .pid)
            if ! stop_mcp_server "$server_name"; then
                failed_servers+=("$server_name")
            fi
        fi
    done

    if [[ ${#failed_servers[@]} -gt 0 ]]; then
        log_error "Failed to stop servers: ${failed_servers[*]}"
        return 1
    else
        log_success "All MCP servers stopped successfully"
        return 0
    fi
}

check_all_servers() {
    log_info "Checking status of all MCP servers..."

    if [[ ! -d "$PID_DIR" ]]; then
        log_warning "No PID directory found - no servers running"
        return 1
    fi

    local running_count=0
    local total_count=0

    for pid_file in "$PID_DIR"/*.pid; do
        if [[ -f "$pid_file" ]]; then
            local server_name
            server_name=$(basename "$pid_file" .pid)
            ((total_count++))
            if check_mcp_server "$server_name"; then
                ((running_count++))
            fi
        fi
    done

    echo
    log_info "Status Summary: $running_count/$total_count servers running"

    return $((total_count - running_count))
}

# Main script logic
case "${1:-}" in
    start)
        start_all_servers
        ;;
    stop)
        stop_all_servers
        ;;
    restart)
        stop_all_servers
        sleep 2
        start_all_servers
        ;;
    status)
        check_all_servers
        ;;
    "")
        echo "Usage: $0 {start|stop|restart|status}"
        echo
        echo "Commands:"
        echo "  start   - Start all MCP servers"
        echo "  stop    - Stop all MCP servers"
        echo "  restart - Restart all MCP servers"
        echo "  status  - Check status of all MCP servers"
        exit 1
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac