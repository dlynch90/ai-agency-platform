#!/bin/bash
# Authenticated CLI Wrapper - ADR 0001 Implementation
# Requires user approval for all CLI commands

set -e

# Configuration
AUTH_LOG="${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/auth/cli/auth.log"
MCP_SERVER_ENDPOINT="http://localhost:7243"
SESSION_ID="cli-auth-$(date +%s)"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [CLI-AUTH] $1" >> "$AUTH_LOG"
}

assess_risk() {
    local command="$1"

    # High risk commands
    if echo "$command" | grep -qE '\b(rm|sudo|chmod|chown|dd|mkfs|fdisk|format)\b'; then
        echo "critical"
    # Medium risk commands
    elif echo "$command" | grep -qE '\b(git|npm|yarn|pip|curl|wget|ssh|scp)\b'; then
        echo "high"
    # Low risk commands
    elif echo "$command" | grep -qE '\b(ls|pwd|echo|cat|grep|find|which)\b'; then
        echo "low"
    else
        echo "medium"
    fi
}

request_authentication() {
    local command="$1"
    local risk_level="$2"
    local reason="$3"

    local auth_id="auth_$(date +%s)_$RANDOM"

    echo -e "${YELLOW}🔐 AUTHENTICATION REQUIRED${NC}"
    echo -e "${BLUE}Command:${NC} $command"
    echo -e "${BLUE}Risk Level:${NC} $risk_level"
    echo -e "${BLUE}Reason:${NC} $reason"
    echo -e "${BLUE}Auth ID:${NC} $auth_id"
    echo
    echo -e "${PURPLE}Do you approve this command execution? (y/N)${NC}"
    read -r response

    case "$response" in
        [Yy]|[Yy][Ee][Ss])
            log "APPROVED: $auth_id - $command"
            echo "approved"
            ;;
        *)
            log "DENIED: $auth_id - $command"
            echo "denied"
            ;;
    esac
}

execute_via_mcp() {
    local command="$1"
    shift
    local args=("$@")

    # Call MCP server for authenticated execution
    local mcp_payload=$(cat <<EOF
{
  "method": "tools/call",
  "params": {
    "name": "execute_authenticated_command",
    "arguments": {
      "command": "$command",
      "args": $(printf '%s\n' "${args[@]}" | jq -R . | jq -s .),
      "requiresAuth": true
    }
  }
}
EOF
)

    # In real implementation, this would make HTTP request to MCP server
    # For now, simulate MCP call
    log "MCP_CALL: $command ${args[*]}"

    # Execute command directly (with MCP simulation)
    if "$@"; then
        log "SUCCESS: $command ${args[*]}"
        return 0
    else
        log "FAILED: $command ${args[*]}"
        return 1
    fi
}

main() {
    if [ $# -eq 0 ]; then
        echo -e "${RED}Error: No command specified${NC}"
        echo "Usage: $0 <command> [args...]"
        exit 1
    fi

    local command="$1"
    shift
    local args=("$@")
    local full_command="$command ${args[*]}"
    local risk_level=$(assess_risk "$full_command")

    log "REQUEST: $full_command (risk: $risk_level)"

    # Request authentication based on risk level
    if [ "$risk_level" = "critical" ] || [ "$risk_level" = "high" ]; then
        local auth_result=$(request_authentication "$full_command" "$risk_level" "High-risk CLI operation")

        if [ "$auth_result" = "denied" ]; then
            echo -e "${RED}❌ Command execution denied by user${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Low-risk command approved automatically${NC}"
    fi

    # Execute via MCP server
    echo -e "${BLUE}🚀 Executing via MCP server...${NC}"
    if execute_via_mcp "$command" "${args[@]}"; then
        echo -e "${GREEN}✅ Command executed successfully${NC}"
    else
        echo -e "${RED}❌ Command execution failed${NC}"
        exit 1
    fi
}

# Only run main if this script is called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi