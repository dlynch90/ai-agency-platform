#!/usr/bin/env python3
"""
MCP Servers Verification Script

Verifies that all configured MCP servers in mcp-config.toml can be connected to
and lists their available tools.
"""

import asyncio
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
import toml

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
except ImportError:
    print("❌ MCP client not available")
    sys.exit(1)

class MCPServerVerifier:
    def __init__(self):
        self.config_path = Path(__file__).parent.parent / "configs" / "mcp-config.toml"
        self.results = {}

    def load_config(self) -> Dict[str, Any]:
        """Load MCP configuration from toml file"""
        try:
            with open(self.config_path, 'r') as f:
                config = toml.load(f)
            return config
        except Exception as e:
            print(f"❌ Failed to load config: {e}")
            sys.exit(1)

    def get_enabled_servers(self, config: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """Get all enabled MCP servers from config"""
        servers = {}
        for server_name, server_config in config.get('servers', {}).items():
            if not server_config.get('disabled', False):
                servers[server_name] = server_config
        return servers

    async def test_server_connection(self, server_name: str, server_config: Dict[str, Any]) -> Dict[str, Any]:
        """Test connection to a single MCP server"""
        result = {
            "server_name": server_name,
            "status": "unknown",
            "tools_count": 0,
            "tools": [],
            "error": None
        }

        try:
            # Prepare server parameters
            command = server_config.get('command', 'npx')
            args = server_config.get('args', [])
            env_vars = server_config.get('env', {})

            # Resolve environment variables
            resolved_env = dict(os.environ)
            for key, value in env_vars.items():
                # Handle 1Password CLI calls
                if 'op read' in str(value):
                    try:
                        # For testing, we'll simulate empty values since we don't have 1Password access
                        resolved_env[key] = ""
                    except:
                        resolved_env[key] = ""
                else:
                    resolved_env[key] = str(value)

            server_params = StdioServerParameters(
                command=command,
                args=args,
                env=resolved_env
            )

            print(f"🔍 Testing {server_name}...")

            # Attempt connection with timeout
            try:
                async with asyncio.timeout(10):  # 10 second timeout
                    async with stdio_client(server_params) as (read, write):
                        async with ClientSession(read, write) as session:
                            await session.initialize()

                            # List available tools
                            tools_result = await session.list_tools()
                            tools = [tool.name for tool in tools_result.tools]

                            result["status"] = "connected"
                            result["tools_count"] = len(tools)
                            result["tools"] = tools[:10]  # Limit to first 10 tools

                            print(f"✅ {server_name}: Connected ({len(tools)} tools)")

            except asyncio.TimeoutError:
                result["status"] = "timeout"
                result["error"] = "Connection timeout after 10 seconds"
                print(f"⏰ {server_name}: Timeout")

            except Exception as e:
                result["status"] = "failed"
                result["error"] = str(e)
                print(f"❌ {server_name}: {str(e)}")

        except Exception as e:
            result["status"] = "error"
            result["error"] = f"Configuration error: {str(e)}"
            print(f"⚠️  {server_name}: Configuration error - {str(e)}")

        return result

    async def verify_all_servers(self) -> Dict[str, Any]:
        """Verify all enabled MCP servers"""
        print("🚀 Starting MCP servers verification...\n")

        config = self.load_config()
        enabled_servers = self.get_enabled_servers(config)

        print(f"📋 Found {len(enabled_servers)} enabled MCP servers\n")

        results = {}
        successful_connections = 0

        # Test servers concurrently but limit concurrency to avoid overwhelming the system
        semaphore = asyncio.Semaphore(5)  # Max 5 concurrent connections

        async def test_with_semaphore(server_name: str, server_config: Dict[str, Any]):
            async with semaphore:
                return await self.test_server_connection(server_name, server_config)

        # Create tasks for all servers
        tasks = [
            test_with_semaphore(name, config)
            for name, config in enabled_servers.items()
        ]

        # Execute all tests
        test_results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        for i, result in enumerate(test_results):
            if isinstance(result, Exception):
                server_name = list(enabled_servers.keys())[i]
                results[server_name] = {
                    "server_name": server_name,
                    "status": "error",
                    "error": str(result)
                }
                print(f"💥 {server_name}: Exception - {str(result)}")
            else:
                server_name = result["server_name"]
                results[server_name] = result
                if result["status"] == "connected":
                    successful_connections += 1

        # Generate summary
        total_servers = len(enabled_servers)
        success_rate = successful_connections / total_servers if total_servers > 0 else 0

        summary = {
            "total_servers": total_servers,
            "successful_connections": successful_connections,
            "success_rate": f"{successful_connections}/{total_servers} ({success_rate:.1%})",
            "results": results
        }

        print("\n📊 Verification Summary:")
        print(f"   Total servers: {total_servers}")
        print(f"   Successful: {successful_connections}")
        print(f"   Success rate: {success_rate:.1%}")

        return summary

    def save_results(self, results: Dict[str, Any]):
        """Save verification results to file"""
        output_file = Path(__file__).parent.parent / "docs" / "integrations" / "mem0-ai" / "mcp_verification_results.json"

        try:
            with open(output_file, 'w') as f:
                json.dump(results, f, indent=2)
            print(f"\n💾 Results saved to {output_file}")
        except Exception as e:
            print(f"❌ Failed to save results: {e}")

async def main():
    """Main verification execution"""
    verifier = MCPServerVerifier()

    try:
        results = await verifier.verify_all_servers()
        verifier.save_results(results)

        print("\n🎉 MCP servers verification completed!")
        return results

    except Exception as e:
        print(f"❌ Verification failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())