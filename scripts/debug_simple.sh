#!/bin/bash
# Simple Cursor IDE Debug Script - No complex dependencies

LOG_FILE="${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/debug_results.txt"
SESSION_ID="simple-debug-$(date +%s)"

echo "=== CURSOR IDE DEBUG SESSION: $SESSION_ID ===" > "$LOG_FILE"
echo "Started at: $(date)" >> "$LOG_FILE"
echo >> "$LOG_FILE"

# Test 1: Permissions
echo "TEST 1: FILE PERMISSIONS" >> "$LOG_FILE"
echo "Testing read access to key directories:" >> "$LOG_FILE"
dirs=("$HOME/.local/share/chezmoi" "/opt/homebrew" "$HOME/Library/Caches/Homebrew" "${DEVELOPER_DIR:-$HOME/Developer}/.cursor")
for dir in "${dirs[@]}"; do
    if [ -r "$dir" ]; then
        echo "  ✅ READ: $dir" >> "$LOG_FILE"
    else
        echo "  ❌ READ: $dir" >> "$LOG_FILE"
    fi

    test_file="$dir/.debug_test"
    if touch "$test_file" 2>/dev/null; then
        rm -f "$test_file"
        echo "  ✅ WRITE: $dir" >> "$LOG_FILE"
    else
        echo "  ❌ WRITE: $dir" >> "$LOG_FILE"
    fi
done
echo >> "$LOG_FILE"

# Test 2: Network
echo "TEST 2: NETWORK CONNECTIVITY" >> "$LOG_FILE"
urls=("https://api.github.com" "http://127.0.0.1:7243" "https://registry.npmjs.org")
for url in "${urls[@]}"; do
    if curl -s --max-time 3 "$url" >/dev/null 2>&1; then
        echo "  ✅ CONNECT: $url" >> "$LOG_FILE"
    else
        echo "  ❌ CONNECT: $url" >> "$LOG_FILE"
    fi
done
echo >> "$LOG_FILE"

# Test 3: Chezmoi
echo "TEST 3: CHEZMOI STATUS" >> "$LOG_FILE"
if chezmoi doctor >/dev/null 2>&1; then
    echo "  ✅ CHEZMOI: doctor command works" >> "$LOG_FILE"
else
    echo "  ❌ CHEZMOI: doctor command failed" >> "$LOG_FILE"
fi

if [ -d "$HOME/.local/share/chezmoi" ]; then
    cd "$HOME/.local/share/chezmoi" 2>/dev/null
    if git status --porcelain >/dev/null 2>&1; then
        dirty_files=$(git status --porcelain | wc -l)
        echo "  ℹ️  CHEZMOI: $dirty_files dirty files in git" >> "$LOG_FILE"
    else
        echo "  ❌ CHEZMOI: git status failed" >> "$LOG_FILE"
    fi
else
    echo "  ❌ CHEZMOI: source directory not found" >> "$LOG_FILE"
fi
echo >> "$LOG_FILE"

# Test 4: Tool Discovery
echo "TEST 4: TOOL DISCOVERY" >> "$LOG_FILE"
tools=(chezmoi brew git node npm python3 java kubectl docker gh fd rg)
for tool in "${tools[@]}"; do
    if which "$tool" >/dev/null 2>&1; then
        tool_path=$(which "$tool")
        echo "  ✅ FOUND: $tool at $tool_path" >> "$LOG_FILE"
    else
        echo "  ❌ MISSING: $tool" >> "$LOG_FILE"
    fi
done
echo >> "$LOG_FILE"

# Test 5: System Resources
echo "TEST 5: SYSTEM RESOURCES" >> "$LOG_FILE"
disk_free=$(df -h / | tail -1 | awk '{print $4}')
echo "  ℹ️  DISK: $disk_free free on /" >> "$LOG_FILE"

process_count=$(ps aux | wc -l)
echo "  ℹ️  PROCESSES: $process_count running" >> "$LOG_FILE"

if touch /tmp/debug_test 2>/dev/null; then
    rm -f /tmp/debug_test
    echo "  ✅ FILE OPS: Can create/delete temp files" >> "$LOG_FILE"
else
    echo "  ❌ FILE OPS: Cannot create temp files" >> "$LOG_FILE"
fi
echo >> "$LOG_FILE"

echo "=== DEBUG SESSION COMPLETE ===" >> "$LOG_FILE"
echo "Results saved to: $LOG_FILE"
echo "Session ID: $SESSION_ID" >> "$LOG_FILE"

echo "Debug complete! Check results in: $LOG_FILE"