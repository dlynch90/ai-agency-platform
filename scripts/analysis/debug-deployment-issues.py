#!/usr/bin/env python3
"""
DEBUG DEPLOYMENT ISSUES - Runtime evidence collection
"""

import os
import subprocess
import json
from pathlib import Path
from datetime import datetime

def log_debug(message, data=None):
    """Log debug information"""
    timestamp = datetime.now().isoformat()
    log_entry = {
        "timestamp": timestamp,
        "message": message,
        "data": data or {},
        "script": "debug-deployment-issues.py"
    }

    # Write to debug log if possible
    try:
        with open('/tmp/debug-deployment.log', 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
    except:
        pass

    print(f"🔍 {message}")

def test_gibson_cli():
    """Hypothesis 1: Gibson CLI operational"""
    log_debug("Testing Gibson CLI")
    try:
        result = subprocess.run(['gibson', 'agency'],
                              capture_output=True, text=True, timeout=10)
        success = result.returncode == 0 and 'AI Agency' in result.stdout
        log_debug("Gibson CLI test", {"success": success, "output": result.stdout[:100]})
        return success
    except Exception as e:
        log_debug("Gibson CLI test failed", {"error": str(e)})
        return False

def test_deploy_script():
    """Hypothesis 2: Deploy script exists and executable"""
    log_debug("Testing deploy script")

    script_path = Path("domains/use-cases/deploy-all.sh")
    if not script_path.exists():
        log_debug("Deploy script does not exist", {"path": str(script_path)})
        return False

    if not os.access(script_path, os.X_OK):
        log_debug("Deploy script not executable", {"path": str(script_path)})
        return False

    try:
        with open(script_path, 'r') as f:
            content = f.read()
        log_debug("Deploy script content check", {"size": len(content), "has_docker": 'docker' in content})
        return len(content) > 0
    except Exception as e:
        log_debug("Deploy script read error", {"error": str(e)})
        return False

def test_api_endpoints():
    """Hypothesis 3: API endpoints responding"""
    log_debug("Testing API endpoints")

    import requests
    try:
        response = requests.get("http://localhost:8001/", timeout=5)
        success = response.status_code == 200
        log_debug("API endpoint test", {"success": success, "status": response.status_code})
        return success
    except Exception as e:
        log_debug("API endpoint test failed", {"error": str(e)})
        return False

def test_mcp_config():
    """Hypothesis 4: MCP servers configured"""
    log_debug("Testing MCP configuration")

    mcp_path = Path(".cursor/mcp/servers.json")
    if not mcp_path.exists():
        log_debug("MCP config does not exist", {"path": str(mcp_path)})
        return False

    try:
        with open(mcp_path, 'r') as f:
            data = json.load(f)

        servers = data.get("mcpServers", {})
        server_count = len(servers)
        has_filesystem = 'filesystem' in servers
        has_git = 'git' in servers

        log_debug("MCP config analysis", {
            "server_count": server_count,
            "has_filesystem": has_filesystem,
            "has_git": has_git
        })

        return server_count >= 20 and has_filesystem and has_git

    except Exception as e:
        log_debug("MCP config read error", {"error": str(e)})
        return False

def test_loose_files():
    """Hypothesis 5: No loose files in user root"""
    log_debug("Testing for loose files")

    try:
        home = Path.home()
        loose_files = []
        for item in home.iterdir():
            if item.is_file() and not item.name.startswith('.'):
                loose_files.append(item.name)

        count = len(loose_files)
        log_debug("Loose files check", {"count": count, "files": loose_files[:5]})

        return count == 0

    except Exception as e:
        log_debug("Loose files check error", {"error": str(e)})
        return False

def test_docker_services():
    """Hypothesis 6: Docker services running"""
    log_debug("Testing Docker services")

    try:
        result = subprocess.run(['docker', 'ps'],
                              capture_output=True, text=True, timeout=10)
        running_containers = len([line for line in result.stdout.split('\n') if line.strip()]) - 1
        log_debug("Docker services check", {"running_containers": running_containers})
        return running_containers > 0
    except Exception as e:
        log_debug("Docker check error", {"error": str(e)})
        return False

def run_comprehensive_diagnostics():
    """Run all diagnostic tests"""
    log_debug("STARTING COMPREHENSIVE DEPLOYMENT DIAGNOSTICS")

    tests = [
        ("Gibson CLI operational", test_gibson_cli),
        ("Deploy script valid", test_deploy_script),
        ("API endpoints responding", test_api_endpoints),
        ("MCP servers configured", test_mcp_config),
        ("No loose files", test_loose_files),
        ("Docker services running", test_docker_services),
    ]

    results = {}
    for test_name, test_func in tests:
        try:
            result = test_func()
            results[test_name] = result
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {test_name}: {status}")
        except Exception as e:
            results[test_name] = False
            print(f"  {test_name}: ❌ ERROR - {str(e)}")

    log_debug("DIAGNOSTICS COMPLETE", {"results": results})

    # Analyze failures and provide recommendations
    failed_tests = [name for name, result in results.items() if not result]

    if failed_tests:
        log_debug("ISSUES FOUND", {"failed_tests": failed_tests})

        recommendations = []

        if "Deploy script valid" in failed_tests:
            recommendations.append("Fix deploy script path and execution permissions")

        if "API endpoints responding" in failed_tests:
            recommendations.append("Deploy use case services using docker-compose")

        if "MCP servers configured" in failed_tests:
            recommendations.append("Re-create MCP server configuration")

        if "Docker services running" in failed_tests:
            recommendations.append("Start Docker daemon and deploy services")

        if recommendations:
            log_debug("RECOMMENDATIONS", {"recommendations": recommendations})
            print("\n💡 RECOMMENDATIONS:")
            for rec in recommendations:
                print(f"  • {rec}")

    return results

if __name__ == "__main__":
    print("🔍 COMPREHENSIVE DEPLOYMENT DIAGNOSTICS")
    print("=" * 50)

    results = run_comprehensive_diagnostics()

    print(f"\n📊 SUMMARY: {sum(results.values())}/{len(results)} tests passed")

    if all(results.values()):
        print("🎉 ALL SYSTEMS OPERATIONAL!")
    else:
        print("❌ ISSUES DETECTED - Needs fixing")