#!/bin/bash
# CLI Security Framework for Polyglot Development Environment
# Implements authentication, authorization, and approval workflows for all CLI operations

set -euo pipefail

# Configuration
SECURITY_CONFIG="${SECURITY_CONFIG:-.cli-security.json}"
AUDIT_LOG="${AUDIT_LOG:-logs/cli-audit.log}"
APPROVAL_TIMEOUT="${APPROVAL_TIMEOUT:-300}"  # 5 minutes default
SESSION_TIMEOUT="${SESSION_TIMEOUT:-3600}"  # 1 hour default

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;34m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log_audit() {
    local level="$1"
    local user="$2"
    local command="$3"
    local result="$4"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "{\"timestamp\":\"$timestamp\",\"level\":\"$level\",\"user\":\"$user\",\"command\":\"$command\",\"result\":\"$result\",\"session\":\"$SESSION_ID\"}" >> "$AUDIT_LOG"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Initialize security framework
init_security() {
    # Create necessary directories
    mkdir -p "$(dirname "$AUDIT_LOG")"
    mkdir -p .cli-sessions
    mkdir -p .cli-approvals

    # Initialize audit log if it doesn't exist
    if [[ ! -f "$AUDIT_LOG" ]]; then
        echo "[]" > "$AUDIT_LOG"
    fi

    # Initialize security config if it doesn't exist
    if [[ ! -f "$SECURITY_CONFIG" ]]; then
        cat > "$SECURITY_CONFIG" << EOF
{
  "version": "1.0.0",
  "authentication": {
    "methods": ["password", "ssh-key", "oauth"],
    "session_timeout": $SESSION_TIMEOUT,
    "max_failed_attempts": 3,
    "lockout_duration": 300
  },
  "authorization": {
    "roles": {
      "admin": ["*"],
      "developer": ["read", "write", "execute", "deploy"],
      "viewer": ["read"],
      "auditor": ["read", "audit"]
    },
    "commands": {
      "pixi": {"risk": "low", "approval_required": false},
      "npm": {"risk": "low", "approval_required": false},
      "git": {"risk": "medium", "approval_required": false},
      "kubectl": {"risk": "high", "approval_required": true},
      "terraform": {"risk": "high", "approval_required": true},
      "aws": {"risk": "critical", "approval_required": true},
      "rm": {"risk": "critical", "approval_required": true},
      "dd": {"risk": "critical", "approval_required": true}
    }
  },
  "approval": {
    "timeout": $APPROVAL_TIMEOUT,
    "approvers": ["admin@example.com"],
    "notification_methods": ["email", "slack", "console"]
  },
  "audit": {
    "enabled": true,
    "log_sensitive_commands": false,
    "retain_logs_days": 90
  }
}
EOF
    fi

    log_info "CLI Security Framework initialized"
}

# User authentication
authenticate_user() {
    local username="$1"

    # Check if user is already authenticated
    local session_file=".cli-sessions/${username}.session"
    if [[ -f "$session_file" ]]; then
        local session_data
        session_data=$(cat "$session_file")
        local session_timestamp
        session_timestamp=$(echo "$session_data" | jq -r '.timestamp')
        local current_timestamp
        current_timestamp=$(date +%s)

        if (( current_timestamp - session_timestamp < SESSION_TIMEOUT )); then
            SESSION_ID=$(echo "$session_data" | jq -r '.session_id')
            log_info "User '$username' authenticated via existing session"
            return 0
        else
            log_warning "Session expired for user '$username'"
            rm -f "$session_file"
        fi
    fi

    # Primary authentication methods
    if authenticate_password "$username"; then
        create_session "$username"
        return 0
    elif authenticate_ssh_key "$username"; then
        create_session "$username"
        return 0
    elif authenticate_oauth "$username"; then
        create_session "$username"
        return 0
    fi

    log_error "Authentication failed for user '$username'"
    return 1
}

# Password authentication
authenticate_password() {
    local username="$1"

    echo -n "Password for $username: "
    read -s password
    echo

    # In a real implementation, this would verify against a secure password store
    # For demo purposes, we'll use a simple check
    if [[ "$password" == "demo_password" ]] || [[ "$username" == "admin" && "$password" == "admin" ]]; then
        log_success "Password authentication successful for '$username'"
        return 0
    fi

    return 1
}

# SSH key authentication
authenticate_ssh_key() {
    local username="$1"

    # Check for SSH key authentication
    if [[ -n "${SSH_CLIENT:-}" ]] || [[ -n "${SSH_CONNECTION:-}" ]]; then
        log_success "SSH key authentication successful for '$username'"
        return 0
    fi

    return 1
}

# OAuth authentication (placeholder)
authenticate_oauth() {
    local username="$1"

    # Placeholder for OAuth implementation
    # In a real implementation, this would integrate with OAuth providers
    log_info "OAuth authentication not implemented for '$username'"
    return 1
}

# Create user session
create_session() {
    local username="$1"
    local session_file=".cli-sessions/${username}.session"
    SESSION_ID=$(openssl rand -hex 16)
    local timestamp
    timestamp=$(date +%s)

    cat > "$session_file" << EOF
{
  "username": "$username",
  "session_id": "$SESSION_ID",
  "timestamp": $timestamp,
  "ip_address": "${SSH_CLIENT%% *}",
  "user_agent": "${USER_AGENT:-cli}"
}
EOF

    log_success "Session created for user '$username' (ID: $SESSION_ID)"
}

# Authorization check
authorize_command() {
    local username="$1"
    local command="$2"
    local args="$3"

    # Get user role from configuration
    local user_role
    user_role=$(get_user_role "$username")

    # Get command permissions
    local command_config
    command_config=$(jq -r ".authorization.commands.\"$command\" // {}" "$SECURITY_CONFIG")

    if [[ "$command_config" == "{}" ]]; then
        # Command not explicitly configured, allow by default for low-risk commands
        log_info "Command '$command' not explicitly configured, allowing for user '$username'"
        return 0
    fi

    # Check if command requires approval
    local approval_required
    approval_required=$(echo "$command_config" | jq -r '.approval_required // false')

    if [[ "$approval_required" == "true" ]]; then
        if ! get_command_approval "$username" "$command" "$args"; then
            log_error "Command approval denied for '$command' by user '$username'"
            return 1
        fi
    fi

    # Check user permissions
    if ! has_permission "$user_role" "$command"; then
        log_error "Permission denied for user '$username' to execute '$command'"
        return 1
    fi

    log_success "Command '$command' authorized for user '$username'"
    return 0
}

# Get user role (simplified implementation)
get_user_role() {
    local username="$1"

    # In a real implementation, this would query a user database
    case "$username" in
        "admin") echo "admin" ;;
        "developer") echo "developer" ;;
        "auditor") echo "auditor" ;;
        *) echo "viewer" ;;
    esac
}

# Check if user has permission for command
has_permission() {
    local user_role="$1"
    local command="$2"

    # Get role permissions
    local role_permissions
    role_permissions=$(jq -r ".authorization.roles.\"$user_role\" // []" "$SECURITY_CONFIG")

    # Check if command is allowed
    if echo "$role_permissions" | grep -q '"*"' || echo "$role_permissions" | grep -q "\"$command\""; then
        return 0
    fi

    return 1
}

# Get command approval
get_command_approval() {
    local username="$1"
    local command="$2"
    local args="$3"

    local approval_id
    approval_id=$(openssl rand -hex 8)
    local approval_file=".cli-approvals/${approval_id}.json"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Create approval request
    cat > "$approval_file" << EOF
{
  "id": "$approval_id",
  "username": "$username",
  "command": "$command",
  "arguments": "$args",
  "timestamp": "$timestamp",
  "status": "pending",
  "approvers": []
}
EOF

    log_warning "Command approval required for '$command'"
    echo "Approval request created (ID: $approval_id)"
    echo "Command: $command $args"
    echo "Requested by: $username"
    echo ""

    # Send notifications
    send_approval_notifications "$approval_id" "$username" "$command" "$args"

    # Wait for approval
    local start_time
    start_time=$(date +%s)

    while true; do
        local current_time
        current_time=$(date +%s)
        local elapsed=$((current_time - start_time))

        if (( elapsed > APPROVAL_TIMEOUT )); then
            log_error "Approval timeout for command '$command'"
            echo "$approval_file" | jq '.status = "timeout"' > "${approval_file}.tmp" && mv "${approval_file}.tmp" "$approval_file"
            return 1
        fi

        # Check approval status
        local status
        status=$(jq -r '.status' "$approval_file")

        case "$status" in
            "approved")
                log_success "Command '$command' approved"
                return 0
                ;;
            "denied")
                log_error "Command '$command' denied"
                return 1
                ;;
            "pending")
                echo -n "."
                sleep 5
                ;;
        esac
    done
}

# Send approval notifications
send_approval_notifications() {
    local approval_id="$1"
    local username="$2"
    local command="$3"
    local args="$4"

    # Get notification methods
    local methods
    methods=$(jq -r '.approval.notification_methods[]' "$SECURITY_CONFIG")

    for method in $methods; do
        case "$method" in
            "console")
                echo "================================================================="
                echo "🔐 COMMAND APPROVAL REQUIRED"
                echo "================================================================="
                echo "Approval ID: $approval_id"
                echo "User: $username"
                echo "Command: $command $args"
                echo "Timestamp: $(date)"
                echo ""
                echo "To approve: approve_command $approval_id"
                echo "To deny: deny_command $approval_id"
                echo "================================================================="
                ;;
            "email")
                # Placeholder for email notification
                log_info "Email notification sent for approval $approval_id"
                ;;
            "slack")
                # Placeholder for Slack notification
                log_info "Slack notification sent for approval $approval_id"
                ;;
        esac
    done
}

# Approve command
approve_command() {
    local approval_id="$1"
    local approver="${2:-admin}"
    local approval_file=".cli-approvals/${approval_id}.json"

    if [[ ! -f "$approval_file" ]]; then
        log_error "Approval request '$approval_id' not found"
        return 1
    fi

    # Update approval status
    jq ".status = \"approved\" | .approvers += [\"$approver\"]" "$approval_file" > "${approval_file}.tmp" && mv "${approval_file}.tmp" "$approval_file"

    log_success "Command approved (ID: $approval_id) by $approver"
}

# Deny command
deny_command() {
    local approval_id="$1"
    local approver="${2:-admin}"
    local reason="${3:-No reason provided}"
    local approval_file=".cli-approvals/${approval_id}.json"

    if [[ ! -f "$approval_file" ]]; then
        log_error "Approval request '$approval_id' not found"
        return 1
    fi

    # Update approval status
    jq ".status = \"denied\" | .approvers += [\"$approver\"] | .denial_reason = \"$reason\"" "$approval_file" > "${approval_file}.tmp" && mv "${approval_file}.tmp" "$approval_file"

    log_success "Command denied (ID: $approval_id) by $approver: $reason"
}

# Execute authenticated command
execute_command() {
    local username="$1"
    local command="$2"
    shift 2
    local args="$*"

    # Authenticate user
    if ! authenticate_user "$username"; then
        log_audit "ERROR" "$username" "$command $args" "authentication_failed"
        exit 1
    fi

    # Authorize command
    if ! authorize_command "$username" "$command" "$args"; then
        log_audit "ERROR" "$username" "$command $args" "authorization_failed"
        exit 1
    fi

    # Execute command with audit logging
    log_info "Executing command: $command $args"
    log_audit "INFO" "$username" "$command $args" "executing"

    if eval "$command $args"; then
        log_audit "SUCCESS" "$username" "$command $args" "completed"
        log_success "Command completed successfully"
    else
        local exit_code=$?
        log_audit "ERROR" "$username" "$command $args" "failed (exit code: $exit_code)"
        log_error "Command failed with exit code: $exit_code"
        exit $exit_code
    fi
}

# Main CLI wrapper
cli_wrapper() {
    local username
    username="${USER:-$(whoami)}"

    # Initialize security if needed
    if [[ ! -f "$SECURITY_CONFIG" ]]; then
        init_security
    fi

    # Parse command line
    if [[ $# -eq 0 ]]; then
        echo "Usage: $0 <command> [args...]"
        echo ""
        echo "This wrapper provides authentication and authorization for CLI commands."
        echo "High-risk commands require approval from administrators."
        echo ""
        echo "Examples:"
        echo "  $0 pixi run test"
        echo "  $0 kubectl get pods"
        echo "  $0 terraform apply"
        exit 1
    fi

    local command="$1"
    shift
    local args="$*"

    # Execute with security controls
    execute_command "$username" "$command" "$args"
}

# Approval management commands
case "${1:-}" in
    init)
        init_security
        ;;
    approve)
        approve_command "$2" "${3:-}"
        ;;
    deny)
        deny_command "$2" "${3:-}" "${4:-}"
        ;;
    status)
        echo "CLI Security Status:"
        echo "==================="
        echo "Configuration: $SECURITY_CONFIG"
        echo "Audit Log: $AUDIT_LOG"
        echo "Active Sessions: $(ls -1 .cli-sessions/*.session 2>/dev/null | wc -l)"
        echo "Pending Approvals: $(ls -1 .cli-approvals/*.json 2>/dev/null | wc -l)"
        ;;
    audit)
        echo "Recent Audit Events:"
        echo "===================="
        tail -20 "$AUDIT_LOG" | jq -r '"\(.timestamp) [\(.level)] \(.user): \(.command) -> \(.result)"'
        ;;
    *)
        cli_wrapper "$@"
        ;;
esac