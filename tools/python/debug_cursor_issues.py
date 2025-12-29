#!/usr/bin/env python3
"""
Cursor IDE Instrumentation Debug Script
Tests all hypotheses for system failures and instrumentation issues
"""
import os
import sys
import json
import time
import subprocess
import requests
from pathlib import Path

DEBUG_LOG_PATH = "${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug_instrumentation.log"
SESSION_ID = f"cursor-debug-{int(time.time())}"
RUN_ID = "initial-diagnosis"

def log_instrumentation(location, message, data=None, hypothesis_id="unknown"):
    """Log instrumentation data to debug log"""
    entry = {
        "id": f"log_{int(time.time()*1000)}_{hypothesis_id}",
        "timestamp": int(time.time() * 1000),
        "location": location,
        "message": message,
        "data": data or {},
        "sessionId": SESSION_ID,
        "runId": RUN_ID,
        "hypothesisId": hypothesis_id
    }

    try:
        with open(DEBUG_LOG_PATH, 'a') as f:
            f.write(json.dumps(entry) + '\n')
    except Exception as e:
        print(f"Failed to write log: {e}")

def test_hypothesis_1_permissions():
    """H1: Permission issues preventing file operations and instrumentation logging"""
    log_instrumentation("debug_cursor_issues.py:29", "Testing permission hypothesis", {"test": "file_operations"}, "H1")

    test_paths = [
        "${USER_HOME:-$HOME}/.local/share/chezmoi",
        "/opt/homebrew",
        "${USER_HOME:-$HOME}/Library/Caches/Homebrew",
        "${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor"
    ]

    results = {}
    for path in test_paths:
        try:
            # Test read access
            os.listdir(path)
            read_ok = True
        except:
            read_ok = False

        try:
            # Test write access
            test_file = os.path.join(path, ".debug_test")
            with open(test_file, 'w') as f:
                f.write("test")
            os.remove(test_file)
            write_ok = True
        except:
            write_ok = False

        results[path] = {"read": read_ok, "write": write_ok}

    log_instrumentation("debug_cursor_issues.py:58", "Permission test results", {"results": results}, "H1")
    return results

def test_hypothesis_2_network():
    """H2: Network connectivity failures blocking external API calls and MCP server communication"""
    log_instrumentation("debug_cursor_issues.py:62", "Testing network hypothesis", {"test": "connectivity"}, "H2")

    test_urls = [
        "https://api.github.com",
        "http://127.0.0.1:7243",
        "https://registry.npmjs.org",
        "https://pypi.org"
    ]

    results = {}
    for url in test_urls:
        try:
            response = requests.get(url, timeout=5)
            results[url] = {"status": response.status_code, "success": True}
        except Exception as e:
            results[url] = {"error": str(e), "success": False}

    log_instrumentation("debug_cursor_issues.py:79", "Network test results", {"results": results}, "H2")
    return results

def test_hypothesis_3_chezmoi():
    """H3: Chezmoi configuration conflicts causing dotfile management failures"""
    log_instrumentation("debug_cursor_issues.py:83", "Testing chezmoi hypothesis", {"test": "configuration"}, "H3")

    results = {}

    # Test chezmoi doctor
    try:
        result = subprocess.run(['chezmoi', 'doctor'], capture_output=True, text=True, timeout=30)
        results['doctor'] = {
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr
        }
    except Exception as e:
        results['doctor'] = {"error": str(e)}

    # Test chezmoi source status
    try:
        os.chdir(os.path.expanduser("~/.local/share/chezmoi"))
        result = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True)
        results['git_status'] = result.stdout.strip()
    except Exception as e:
        results['git_status'] = {"error": str(e)}

    log_instrumentation("debug_cursor_issues.py:107", "Chezmoi test results", {"results": results}, "H3")
    return results

def test_hypothesis_4_path():
    """H4: PATH and environment variable conflicts preventing tool discovery"""
    log_instrumentation("debug_cursor_issues.py:111", "Testing PATH hypothesis", {"test": "environment"}, "H4")

    results = {
        "PATH": os.environ.get("PATH", ""),
        "SHELL": os.environ.get("SHELL", ""),
        "HOME": os.environ.get("HOME", "")
    }

    # Test tool discovery
    critical_tools = [
        "chezmoi", "brew", "git", "node", "npm", "python3",
        "java", "kubectl", "docker", "gh", "fd", "rg"
    ]

    tool_results = {}
    for tool in critical_tools:
        try:
            result = subprocess.run(['which', tool], capture_output=True, text=True)
            tool_results[tool] = {
                "found": result.returncode == 0,
                "path": result.stdout.strip()
            }
        except Exception as e:
            tool_results[tool] = {"error": str(e)}

    results["tools"] = tool_results
    log_instrumentation("debug_cursor_issues.py:137", "PATH test results", {"results": results}, "H4")
    return results

def test_hypothesis_5_resources():
    """H5: Resource exhaustion or sandbox restrictions limiting system operations"""
    log_instrumentation("debug_cursor_issues.py:141", "Testing resources hypothesis", {"test": "system_limits"}, "H5")

    results = {}

    # Test system resources
    try:
        result = subprocess.run(['df', '-h'], capture_output=True, text=True)
        results['disk'] = result.stdout
    except Exception as e:
        results['disk'] = {"error": str(e)}

    try:
        result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
        process_count = len(result.stdout.strip().split('\n')) - 1  # Subtract header
        results['processes'] = process_count
    except Exception as e:
        results['processes'] = {"error": str(e)}

    # Test file limits
    try:
        with open("/tmp/debug_test_file", 'w') as f:
            f.write("test")
        os.remove("/tmp/debug_test_file")
        results['file_operations'] = True
    except Exception as e:
        results['file_operations'] = {"error": str(e)}

    log_instrumentation("debug_cursor_issues.py:170", "Resource test results", {"results": results}, "H5")
    return results

def main():
    print(f"=== CURSOR IDE INSTRUMENTATION DEBUG SESSION ===")
    print(f"Session ID: {SESSION_ID}")
    print(f"Log file: {DEBUG_LOG_PATH}")
    print()

    log_instrumentation("debug_cursor_issues.py:178", "Starting comprehensive instrumentation debug", {"session": SESSION_ID}, "INIT")

    # Run all hypothesis tests
    print("Testing Hypothesis 1: Permission issues...")
    h1_results = test_hypothesis_1_permissions()

    print("Testing Hypothesis 2: Network connectivity...")
    h2_results = test_hypothesis_2_network()

    print("Testing Hypothesis 3: Chezmoi configuration...")
    h3_results = test_hypothesis_3_chezmoi()

    print("Testing Hypothesis 4: PATH and environment...")
    h4_results = test_hypothesis_4_path()

    print("Testing Hypothesis 5: System resources...")
    h5_results = test_hypothesis_5_resources()

    # Summary
    summary = {
        "h1_permissions_issues": not all(all(v.get('write', False) for v in h1_results.values()) for h1_results in [h1_results]),
        "h2_network_failures": not all(r.get('success', False) for r in h2_results.values()),
        "h3_chezmoi_conflicts": 'error' in str(h3_results),
        "h4_path_conflicts": not all(t.get('found', False) for t in h4_results.get('tools', {}).values()),
        "h5_resource_limits": not h5_results.get('file_operations', False)
    }

    log_instrumentation("debug_cursor_issues.py:205", "Debug session completed", {"summary": summary}, "COMPLETE")

    print(f"\n=== DEBUG SESSION COMPLETE ===")
    print(f"Check logs at: {DEBUG_LOG_PATH}")
    print("Summary of issues found:"
    for hypothesis, has_issue in summary.items():
        status = "❌ ISSUE" if has_issue else "✅ OK"
        print(f"  {hypothesis}: {status}")

if __name__ == "__main__":
    main()