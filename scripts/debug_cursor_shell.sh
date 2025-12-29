#!/bin/bash
# Cursor IDE Instrumentation Debug Script - Shell Version
# Tests all hypotheses for system failures without Python dependencies

DEBUG_LOG_PATH="${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug_instrumentation.log"
SESSION_ID="cursor-debug-$(date +%s)"
RUN_ID="shell-diagnosis"

log_instrumentation() {
    local location="$1"
    local message="$2"
    local hypothesis_id="$3"
    local data="$4"

    local timestamp=$(date +%s%3N)
    local entry="{\"id\":\"log_${timestamp}_${hypothesis_id}\",\"timestamp\":${timestamp},\"location\":\"${location}\",\"message\":\"${message}\",\"data\":${data},\"sessionId\":\"${SESSION_ID}\",\"runId\":\"${RUN_ID}\",\"hypothesisId\":\"${hypothesis_id}\"}"

    echo "$entry" >> "$DEBUG_LOG_PATH"
}

echo "=== CURSOR IDE INSTRUMENTATION DEBUG SESSION ==="
echo "Session ID: $SESSION_ID"
echo "Log file: $DEBUG_LOG_PATH"
echo

log_instrumentation "debug_cursor_shell.sh:22" "Starting shell-based instrumentation debug" "{}" "INIT"

# H1: Permission issues
echo "Testing Hypothesis 1: Permission issues..."
log_instrumentation "debug_cursor_shell.sh:26" "Testing permission hypothesis" "{\"test\":\"file_operations\"}" "H1"

TEST_PATHS=(
    "${USER_HOME:-$HOME}/.local/share/chezmoi"
    "/opt/homebrew"
    "${USER_HOME:-$HOME}/Library/Caches/Homebrew"
    "${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor"
)

PERMISSION_RESULTS="{}"
for path in "${TEST_PATHS[@]}"; do
    read_ok="false"
    write_ok="false"

    if ls "$path" >/dev/null 2>&1; then
        read_ok="true"
    fi

    test_file="$path/.debug_test"
    if echo "test" > "$test_file" 2>/dev/null; then
        write_ok="true"
        rm -f "$test_file" 2>/dev/null
    fi

    PERMISSION_RESULTS=$(echo "$PERMISSION_RESULTS" | jq ". + {\"$path\": {\"read\": $read_ok, \"write\": $write_ok}}" 2>/dev/null || echo "$PERMISSION_RESULTS")
done

log_instrumentation "debug_cursor_shell.sh:52" "Permission test results" "{\"results\": $PERMISSION_RESULTS}" "H1"

# H2: Network connectivity
echo "Testing Hypothesis 2: Network connectivity..."
log_instrumentation "debug_cursor_shell.sh:56" "Testing network hypothesis" "{\"test\":\"connectivity\"}" "H2"

TEST_URLS=(
    "https://api.github.com"
    "http://127.0.0.1:7243"
    "https://registry.npmjs.org"
    "https://pypi.org"
)

NETWORK_RESULTS="{}"
for url in "${TEST_URLS[@]}"; do
    if curl -s --max-time 5 "$url" >/dev/null 2>&1; then
        NETWORK_RESULTS=$(echo "$NETWORK_RESULTS" | jq ". + {\"$url\": {\"success\": true}}" 2>/dev/null || echo "$NETWORK_RESULTS")
    else
        NETWORK_RESULTS=$(echo "$NETWORK_RESULTS" | jq ". + {\"$url\": {\"success\": false}}" 2>/dev/null || echo "$NETWORK_RESULTS")
    fi
done

log_instrumentation "debug_cursor_shell.sh:74" "Network test results" "{\"results\": $NETWORK_RESULTS}" "H2"

# H3: Chezmoi configuration
echo "Testing Hypothesis 3: Chezmoi configuration..."
log_instrumentation "debug_cursor_shell.sh:78" "Testing chezmoi hypothesis" "{\"test\":\"configuration\"}" "H3"

CHEZMOI_RESULTS="{}"
if chezmoi doctor >/dev/null 2>&1; then
    CHEZMOI_RESULTS=$(echo "$CHEZMOI_RESULTS" | jq '. + {"doctor": {"success": true}}' 2>/dev/null || echo "$CHEZMOI_RESULTS")
else
    CHEZMOI_RESULTS=$(echo "$CHEZMOI_RESULTS" | jq '. + {"doctor": {"success": false}}' 2>/dev/null || echo "$CHEZMOI_RESULTS")
fi

cd ~/.local/share/chezmoi 2>/dev/null
if git status --porcelain >/dev/null 2>&1; then
    dirty_count=$(git status --porcelain | wc -l)
    CHEZMOI_RESULTS=$(echo "$CHEZMOI_RESULTS" | jq ". + {\"git_dirty\": $dirty_count}" 2>/dev/null || echo "$CHEZMOI_RESULTS")
fi

log_instrumentation "debug_cursor_shell.sh:95" "Chezmoi test results" "{\"results\": $CHEZMOI_RESULTS}" "H3"

# H4: PATH and environment
echo "Testing Hypothesis 4: PATH and environment..."
log_instrumentation "debug_cursor_shell.sh:99" "Testing PATH hypothesis" "{\"test\":\"environment\"}" "H4"

PATH_RESULTS="{\"PATH\":\"$PATH\",\"SHELL\":\"$SHELL\",\"HOME\":\"$HOME\"}"

TOOLS=(chezmoi brew git node npm python3 java kubectl docker gh fd rg)
TOOL_RESULTS="{}"
for tool in "${TOOLS[@]}"; do
    if which "$tool" >/dev/null 2>&1; then
        tool_path=$(which "$tool")
        TOOL_RESULTS=$(echo "$TOOL_RESULTS" | jq ". + {\"$tool\": {\"found\": true, \"path\": \"$tool_path\"}}" 2>/dev/null || echo "$TOOL_RESULTS")
    else
        TOOL_RESULTS=$(echo "$TOOL_RESULTS" | jq ". + {\"$tool\": {\"found\": false}}" 2>/dev/null || echo "$TOOL_RESULTS")
    fi
done

PATH_RESULTS=$(echo "$PATH_RESULTS" | jq ". + {\"tools\": $TOOL_RESULTS}" 2>/dev/null || echo "$PATH_RESULTS")
log_instrumentation "debug_cursor_shell.sh:117" "PATH test results" "{\"results\": $PATH_RESULTS}" "H4"

# H5: System resources
echo "Testing Hypothesis 5: System resources..."
log_instrumentation "debug_cursor_shell.sh:121" "Testing resources hypothesis" "{\"test\":\"system_limits\"}" "H5"

RESOURCE_RESULTS="{}"
disk_info=$(df -h / | tail -1 | awk '{print $4}')
RESOURCE_RESULTS=$(echo "$RESOURCE_RESULTS" | jq ". + {\"disk_free\": \"$disk_info\"}" 2>/dev/null || echo "$RESOURCE_RESULTS")

process_count=$(ps aux | wc -l)
RESOURCE_RESULTS=$(echo "$RESOURCE_RESULTS" | jq ". + {\"process_count\": $process_count}" 2>/dev/null || echo "$RESOURCE_RESULTS")

if echo "test" > /tmp/debug_test_file 2>/dev/null; then
    rm -f /tmp/debug_test_file 2>/dev/null
    RESOURCE_RESULTS=$(echo "$RESOURCE_RESULTS" | jq '. + {"file_operations": true}' 2>/dev/null || echo "$RESOURCE_RESULTS")
else
    RESOURCE_RESULTS=$(echo "$RESOURCE_RESULTS" | jq '. + {"file_operations": false}' 2>/dev/null || echo "$RESOURCE_RESULTS")
fi

log_instrumentation "debug_cursor_shell.sh:139" "Resource test results" "{\"results\": $RESOURCE_RESULTS}" "H5"

# Summary
echo
echo "=== DEBUG SESSION COMPLETE ==="
echo "Check logs at: $DEBUG_LOG_PATH"

log_instrumentation "debug_cursor_shell.sh:146" "Debug session completed" "{\"completed\": true}" "COMPLETE"

echo "Session complete. Please check the log file for detailed results."