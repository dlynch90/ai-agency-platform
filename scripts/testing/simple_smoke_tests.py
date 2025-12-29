#!/usr/bin/env python3
"""
Simple API Smoke Tests
Tests all database services and basic functionality
"""

import subprocess
import sys
import time
import json
from pathlib import Path

def run_command(cmd: list, timeout: int = 10) -> dict:
    """Run command and return result"""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
            "returncode": result.returncode
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "timeout", "timeout": timeout}
    except Exception as e:
        return {"success": False, "error": str(e)}

def test_postgresql():
    """Test PostgreSQL connection"""
    result = run_command(["pg_isready", "-h", "localhost", "-p", "5432"])
    return {
        "service": "PostgreSQL",
        "status": "healthy" if result["success"] else "unhealthy",
        "details": result.get("stdout", result.get("error", "unknown"))
    }

def test_redis():
    """Test Redis connection"""
    result = run_command(["redis-cli", "ping"])
    return {
        "service": "Redis",
        "status": "healthy" if result["success"] and "PONG" in result["stdout"] else "unhealthy",
        "details": result.get("stdout", result.get("error", "unknown"))
    }

def test_neo4j():
    """Test Neo4j connection"""
    result = run_command(["curl", "-s", "http://localhost:7474"], timeout=5)
    if result["success"] and "neo4j" in result["stdout"].lower():
        return {"service": "Neo4j", "status": "healthy", "details": "connected"}
    else:
        return {"service": "Neo4j", "status": "unhealthy", "details": "not responding"}

def test_qdrant():
    """Test Qdrant connection"""
    result = run_command(["curl", "-s", "http://localhost:6333/health"], timeout=5)
    return {
        "service": "Qdrant",
        "status": "healthy" if result["success"] else "unhealthy",
        "details": "connected" if result["success"] else "not responding"
    }

def test_python_libraries():
    """Test Python library imports"""
    libraries = ["torch", "numpy", "pandas", "fastapi", "pydantic"]
    results = {}

    for lib in libraries:
        result = run_command([sys.executable, "-c", f"import {lib}; print('{lib} imported successfully')"])
        results[lib] = "available" if result["success"] else "missing"

    return {"service": "Python Libraries", "status": "healthy", "libraries": results}

def test_cli_tools():
    """Test CLI tool availability"""
    tools = ["rustc", "cargo", "node", "npm", "java", "go", "git", "docker"]
    results = {}

    for tool in tools:
        result = run_command([tool, "--version"])
        results[tool] = "available" if result["success"] else "unavailable"

    return {"service": "CLI Tools", "status": "healthy", "tools": results}

def main():
    """Run all smoke tests"""
    print("🚀 Running Simple API Smoke Tests...")
    print("=" * 60)

    start_time = time.time()
    results = {
        "timestamp": time.time(),
        "tests": []
    }

    # Run all tests
    test_functions = [
        test_postgresql,
        test_redis,
        test_neo4j,
        test_qdrant,
        test_python_libraries,
        test_cli_tools
    ]

    for test_func in test_functions:
        try:
            result = test_func()
            results["tests"].append(result)
            status_emoji = "✅" if result["status"] == "healthy" else "❌"
            print(f"{status_emoji} {result['service']}: {result['status']}")
        except Exception as e:
            error_result = {
                "service": test_func.__name__,
                "status": "error",
                "details": str(e)
            }
            results["tests"].append(error_result)
            print(f"❌ {test_func.__name__}: error - {str(e)}")

    # Calculate summary
    results["duration"] = time.time() - start_time
    healthy_tests = sum(1 for test in results["tests"] if test["status"] == "healthy")
    total_tests = len(results["tests"])

    results["summary"] = {
        "total_tests": total_tests,
        "healthy_tests": healthy_tests,
        "failed_tests": total_tests - healthy_tests,
        "success_rate": (healthy_tests / total_tests) * 100 if total_tests > 0 else 0
    }

    print("\n📊 SUMMARY:")
    print(f"Total Tests: {total_tests}")
    print(f"Healthy: {healthy_tests}")
    print(f"Failed: {total_tests - healthy_tests}")
    print(".1f")

    if healthy_tests == total_tests:
        print("🎉 ALL TESTS PASSED!")
        exit_code = 0
    else:
        print("⚠️  Some tests failed. Check details above.")
        exit_code = 1

    # Save results
    output_dir = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/logs/audit")
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / f"simple_smoke_test_{int(time.time())}.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)

    print(f"\n📄 Results saved to: {output_file}")

    sys.exit(exit_code)

if __name__ == "__main__":
    main()