#!/usr/bin/env python3
"""
Cursor IDE Compliance Check - Pre-commit Hook
Validates compliance with Cursor rules and event-driven architecture
"""

import os
import sys
import json
import time
from pathlib import Path

def log_event(message: str, event_type: str, success: bool):
    """Log events to Cursor debug system"""
    log_entry = {
        "id": f"cursor_compliance_{int(time.time()*1000)}_{hash(message) % 10000}",
        "timestamp": int(time.time()*1000),
        "location": "cursor_compliance_check.py:main",
        "message": message,
        "data": {"event_type": event_type, "success": success},
        "sessionId": "cursor-compliance-check",
        "runId": f"run-{int(time.time())}",
        "hypothesisId": "H_CURSOR_COMPLIANCE"
    }

    log_path = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug.log")
    try:
        with open(log_path, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
    except:
        pass  # Fail silently in hooks

def check_cursor_rules():
    """Check Cursor IDE rules compliance"""
    project_root = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}")

    # Check required directory structure
    required_dirs = ['docs', 'testing', 'infra', 'data', 'api', 'graphql', 'federation']
    missing_dirs = []

    for req_dir in required_dirs:
        if not (project_root / req_dir).exists():
            missing_dirs.append(req_dir)

    if missing_dirs:
        print(f"❌ Missing required directories: {', '.join(missing_dirs)}")
        log_event(f"Missing directories: {missing_dirs}", "directory_check", False)
        return False

    # Check for loose files in root
    loose_files = []
    for item in project_root.iterdir():
        if item.is_file() and not item.name.startswith('.'):
            if item.suffix in ['.sh', '.md', '.json', '.log', '.txt', '.py', '.toml']:
                if not any(parent in required_dirs for parent in item.parent.parts):
                    loose_files.append(item.name)

    if loose_files:
        print(f"❌ Loose files in root directory: {', '.join(loose_files[:5])}")
        if len(loose_files) > 5:
            print(f"  ... and {len(loose_files) - 5} more")
        log_event(f"Loose files found: {len(loose_files)}", "loose_files_check", False)
        return False

    # Check Cursor rules directory
    cursor_rules_dir = Path.home() / ".cursor" / "rules"
    if not cursor_rules_dir.exists():
        print("❌ Cursor rules directory missing")
        log_event("Cursor rules directory missing", "rules_check", False)
        return False

    rule_files = list(cursor_rules_dir.glob("*.mdc"))
    if not rule_files:
        print("❌ No Cursor rule files found (.mdc files)")
        log_event("No Cursor rule files found", "rules_check", False)
        return False

    log_event("Cursor compliance check passed", "compliance_check", True)
    return True

def check_event_driven_architecture():
    """Check event-driven architecture implementation"""
    project_root = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}")

    # Check for Lefthook configuration
    lefthook_config = project_root / ".lefthook.yml"
    if not lefthook_config.exists():
        print("❌ Lefthook configuration missing")
        log_event("Lefthook configuration missing", "event_driven_check", False)
        return False

    # Check for Git hooks
    git_hooks_dir = project_root / ".git" / "hooks"
    if not git_hooks_dir.exists():
        print("❌ Git hooks directory missing")
        log_event("Git hooks directory missing", "event_driven_check", False)
        return False

    required_hooks = ['pre-commit', 'post-commit', 'pre-push', 'post-merge']
    missing_hooks = []

    for hook in required_hooks:
        if not (git_hooks_dir / hook).exists():
            missing_hooks.append(hook)

    if missing_hooks:
        print(f"❌ Missing Git hooks: {', '.join(missing_hooks)}")
        log_event(f"Missing hooks: {missing_hooks}", "event_driven_check", False)
        return False

    log_event("Event-driven architecture check passed", "event_driven_check", True)
    return True

def check_mcp_integration():
    """Check MCP server integration"""
    mcp_config_path = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/mcp-config.toml")

    if not mcp_config_path.exists():
        print("❌ MCP configuration missing")
        log_event("MCP configuration missing", "mcp_check", False)
        return False

    # Check if required MCP servers are configured
    required_servers = ['sequential-thinking', 'ollama', 'neo4j', 'qdrant']
    configured_servers = []

    try:
        import toml
        with open(mcp_config_path, 'r') as f:
            config = toml.load(f)

        if 'mcp_servers' in config:
            configured_servers = list(config['mcp_servers'].keys())

        missing_servers = [s for s in required_servers if s not in configured_servers]

        if missing_servers:
            print(f"❌ Missing MCP servers: {', '.join(missing_servers)}")
            log_event(f"Missing MCP servers: {missing_servers}", "mcp_check", False)
            return False

    except Exception as e:
        print(f"❌ Error reading MCP config: {e}")
        log_event(f"MCP config error: {e}", "mcp_check", False)
        return False

    log_event("MCP integration check passed", "mcp_check", True)
    return True

def main():
    """Main compliance check"""
    print("🔍 Running Cursor IDE Compliance Check...")
    print("=" * 50)

    checks = [
        ("Cursor Rules", check_cursor_rules),
        ("Event-Driven Architecture", check_event_driven_architecture),
        ("MCP Integration", check_mcp_integration)
    ]

    all_passed = True

    for check_name, check_func in checks:
        print(f"\n📋 {check_name}:")
        try:
            if check_func():
                print(f"✅ {check_name} passed")
            else:
                print(f"❌ {check_name} failed")
                all_passed = False
        except Exception as e:
            print(f"❌ {check_name} error: {e}")
            log_event(f"Check error in {check_name}: {e}", "check_error", False)
            all_passed = False

    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All Cursor compliance checks passed!")
        log_event("All compliance checks passed", "final_result", True)
        return 0
    else:
        print("❌ Cursor compliance checks failed!")
        print("Please fix the issues above before committing.")
        log_event("Compliance checks failed", "final_result", False)
        return 1

if __name__ == "__main__":
    sys.exit(main())