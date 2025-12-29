#!/usr/bin/env python3
"""
MCP Server Health Check - Pre-commit Hook
Validates all MCP servers are running and responsive
"""

import asyncio
import aiohttp
import json
import time
import sys
from pathlib import Path
from typing import Dict, List, Any

class MCPHealthChecker:
    """Check health of all MCP servers"""

    def __init__(self):
        self.mcp_config_path = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/mcp-config.toml")
        self.health_report = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/mcp_health_report.json")

    def log_event(self, message: str, server: str = "", success: bool = True):
        """Log events to Cursor debug system"""
        log_entry = {
            "id": f"mcp_health_{int(time.time()*1000)}_{hash(message) % 10000}",
            "timestamp": int(time.time()*1000),
            "location": "mcp_server_health.py:main",
            "message": message,
            "data": {"server": server, "success": success},
            "sessionId": "mcp-health-check",
            "runId": f"run-{int(time.time())}",
            "hypothesisId": "H_MCP_HEALTH"
        }

        log_path = Path("${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/.cursor/debug.log")
        try:
            with open(log_path, 'a') as f:
                f.write(json.dumps(log_entry) + '\n')
        except:
            pass

    async def check_server_health(self, server_name: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Check individual MCP server health"""
        url = config.get("url", "")
        expected_status = 200

        self.log_event(f"Checking {server_name} at {url}", server_name)

        try:
            timeout = aiohttp.ClientTimeout(total=10)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                start_time = time.time()
                async with session.get(url) as response:
                    response_time = time.time() - start_time

                    result = {
                        "server": server_name,
                        "url": url,
                        "status_code": response.status,
                        "response_time": round(response_time * 1000, 2),  # ms
                        "healthy": response.status == expected_status,
                        "error": None
                    }

                    self.log_event(
                        f"{server_name} health check: {'PASS' if result['healthy'] else 'FAIL'}",
                        server_name,
                        result['healthy']
                    )

                    return result

        except asyncio.TimeoutError:
            result = {
                "server": server_name,
                "url": url,
                "status_code": None,
                "response_time": None,
                "healthy": False,
                "error": "Timeout after 10 seconds"
            }
        except Exception as e:
            result = {
                "server": server_name,
                "url": url,
                "status_code": None,
                "response_time": None,
                "healthy": False,
                "error": str(e)
            }

        self.log_event(f"{server_name} health check failed: {result['error']}", server_name, False)
        return result

    async def check_all_servers(self) -> Dict[str, Any]:
        """Check health of all configured MCP servers"""
        if not self.mcp_config_path.exists():
            error_msg = "MCP configuration file not found"
            print(f"❌ {error_msg}")
            self.log_event(error_msg, "", False)
            return {"error": error_msg}

        try:
            import toml
            with open(self.mcp_config_path, 'r') as f:
                config = toml.load(f)
        except Exception as e:
            error_msg = f"Failed to load MCP config: {e}"
            print(f"❌ {error_msg}")
            self.log_event(error_msg, "", False)
            return {"error": error_msg}

        mcp_servers = config.get("mcp_servers", {})
        if not mcp_servers:
            error_msg = "No MCP servers configured"
            print(f"❌ {error_msg}")
            self.log_event(error_msg, "", False)
            return {"error": error_msg}

        print(f"🔍 Checking health of {len(mcp_servers)} MCP servers...")

        # Check all servers concurrently
        tasks = []
        for server_name, server_config in mcp_servers.items():
            tasks.append(self.check_server_health(server_name, server_config))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        healthy_servers = []
        unhealthy_servers = []
        server_results = {}

        for result in results:
            if isinstance(result, Exception):
                print(f"❌ Exception during health check: {result}")
                continue

            server_results[result["server"]] = result

            if result["healthy"]:
                healthy_servers.append(result["server"])
                print(f"✅ {result['server']}: {result['response_time']}ms")
            else:
                unhealthy_servers.append(result["server"])
                error_msg = result.get("error", f"Status {result.get('status_code', 'unknown')}")
                print(f"❌ {result['server']}: {error_msg}")

        summary = {
            "total_servers": len(mcp_servers),
            "healthy_servers": len(healthy_servers),
            "unhealthy_servers": len(unhealthy_servers),
            "healthy_list": healthy_servers,
            "unhealthy_list": unhealthy_servers,
            "server_results": server_results,
            "overall_health": len(unhealthy_servers) == 0
        }

        # Save health report
        with open(self.health_report, 'w') as f:
            json.dump(summary, f, indent=2)

        self.log_event(
            f"Health check complete: {len(healthy_servers)}/{len(mcp_servers)} servers healthy",
            "",
            summary["overall_health"]
        )

        return summary

    def run_sync_check(self) -> int:
        """Run health check synchronously"""
        async def main():
            return await self.check_all_servers()

        result = asyncio.run(main())

        if "error" in result:
            return 1

        if result["overall_health"]:
            print("🎉 All MCP servers are healthy!")
            return 0
        else:
            print("❌ Some MCP servers are unhealthy!")
            print(f"Healthy: {len(result['healthy_servers'])}")
            print(f"Unhealthy: {len(result['unhealthy_servers'])}")
            return 1

def main():
    """Main health check execution"""
    checker = MCPHealthChecker()
    return checker.run_sync_check()

if __name__ == "__main__":
    sys.exit(main())