#!/usr/bin/env python3
"""
DEBUG USE CASES IMPLEMENTATION
Instrument and debug why use case implementations failed
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

# Instrumentation for debugging
def log_debug(message, data=None):
    """Log debug information"""
    timestamp = datetime.now().isoformat()
    log_entry = {
        "timestamp": timestamp,
        "message": message,
        "data": data or {},
        "script": "debug-use-cases.py"
    }

    # Write to debug log if possible
    try:
        with open('${HOME}/Developer/.cursor/debug.log', 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
    except:
        pass

    print(f"🔍 {message}")

def check_use_cases_directory():
    """Hypothesis 1: Check if use cases directory structure exists"""
    log_debug("Checking use cases directory structure")

    use_cases_dir = Path("domains/use-cases")
    if not use_cases_dir.exists():
        log_debug("FAIL: domains/use-cases directory does not exist")
        return False

    subdirs = list(use_cases_dir.glob("??-*"))
    log_debug(f"Found {len(subdirs)} use case directories", {"directories": [str(d) for d in subdirs]})

    if len(subdirs) != 20:
        log_debug("FAIL: Expected 20 use case directories", {"expected": 20, "found": len(subdirs)})
        return False

    # Check if directories are empty
    empty_dirs = []
    for subdir in subdirs:
        if not any(subdir.iterdir()):
            empty_dirs.append(str(subdir))

    if empty_dirs:
        log_debug("FAIL: Use case directories are empty", {"empty_directories": empty_dirs})
        return False

    log_debug("PASS: Use cases directory structure is correct")
    return True

def check_deploy_script():
    """Hypothesis 2: Check if deploy script exists and is valid"""
    log_debug("Checking deploy script")

    deploy_script = Path("domains/use-cases/deploy-all.sh")
    if not deploy_script.exists():
        log_debug("FAIL: deploy-all.sh does not exist")
        return False

    if not os.access(deploy_script, os.X_OK):
        log_debug("FAIL: deploy-all.sh is not executable")
        return False

    try:
        with open(deploy_script, 'r') as f:
            content = f.read()

        if len(content.strip()) == 0:
            log_debug("FAIL: deploy-all.sh is empty")
            return False

        log_debug("PASS: Deploy script exists and is executable", {"size": len(content)})
        return True

    except Exception as e:
        log_debug("FAIL: Error reading deploy script", {"error": str(e)})
        return False

def check_bash_syntax():
    """Hypothesis 3: Check bash script syntax issues"""
    log_debug("Checking for bash syntax issues in implementation script")

    script_path = Path("20-real-world-use-cases-implementation.sh")
    if not script_path.exists():
        log_debug("Script file does not exist", {"path": str(script_path)})
        return False

    try:
        with open(script_path, 'r') as f:
            content = f.read()

        # Check for common bash syntax issues
        issues = []

        # Check for bad substitutions
        if "${name,, | tr ' ' '-'}" in content:
            issues.append("Invalid parameter expansion syntax")

        # Check for unclosed quotes or braces
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if line.count('"') % 2 != 0 or line.count("'") % 2 != 0:
                issues.append(f"Unmatched quotes on line {i+1}: {line[:50]}...")

        if issues:
            log_debug("FAIL: Bash syntax issues found", {"issues": issues})
            return False

        log_debug("PASS: No obvious bash syntax issues found")
        return True

    except Exception as e:
        log_debug("FAIL: Error checking bash syntax", {"error": str(e)})
        return False

def check_sandbox_restrictions():
    """Hypothesis 4: Check for sandbox restrictions preventing file creation"""
    log_debug("Checking for sandbox restrictions")

    try:
        # Try to create a test file in a use case directory
        test_file = Path("domains/use-cases/01-ecommerce/test.txt")
        test_file.parent.mkdir(parents=True, exist_ok=True)

        with open(test_file, 'w') as f:
            f.write("test")

        # Clean up
        test_file.unlink()

        log_debug("PASS: File creation works in use case directories")
        return True

    except Exception as e:
        log_debug("FAIL: Sandbox restrictions prevent file creation", {"error": str(e)})
        return False

def run_diagnostics():
    """Run all diagnostic checks"""
    log_debug("STARTING USE CASES DIAGNOSTICS")

    results = {
        "directory_structure": check_use_cases_directory(),
        "deploy_script": check_deploy_script(),
        "bash_syntax": check_bash_syntax(),
        "sandbox_restrictions": check_sandbox_restrictions()
    }

    log_debug("DIAGNOSTICS COMPLETE", {"results": results})

    # Analyze results and provide recommendations
    failed_checks = [k for k, v in results.items() if not v]

    if failed_checks:
        log_debug("ISSUES FOUND", {"failed_checks": failed_checks})

        if "bash_syntax" in failed_checks:
            log_debug("RECOMMENDATION: Fix bash script syntax errors")

        if "sandbox_restrictions" in failed_checks:
            log_debug("RECOMMENDATION: Run outside sandbox or get permissions")

        if "directory_structure" in failed_checks:
            log_debug("RECOMMENDATION: Re-run use case implementation script")

    else:
        log_debug("ALL CHECKS PASSED - Use cases should work")

    return results

if __name__ == "__main__":
    results = run_diagnostics()

    # Print summary
    print("\n📊 DIAGNOSTIC SUMMARY:")
    for check, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {check}: {status}")

    print(f"\n🎯 NEXT STEPS:")
    if not all(results.values()):
        print("  1. Fix identified issues")
        print("  2. Re-run use case implementation")
        print("  3. Test deployment again")
    else:
        print("  1. Run: ./domains/use-cases/deploy-all.sh")
        print("  2. Test: curl http://localhost:8001")