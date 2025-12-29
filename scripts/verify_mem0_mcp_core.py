#!/usr/bin/env python3
"""
Mem0.ai Core MCP Servers Verification

Verifies the essential MCP servers needed for Mem0.ai integration.
"""

import asyncio
import json
import os
from pathlib import Path
from typing import Dict, List, Any

# Set environment variables for OpenMP compatibility
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

try:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
except ImportError:
    print("❌ MCP client not available")
    exit(1)

class Mem0MCPCoreVerifier:
    def __init__(self):
        self.core_servers = {
            "filesystem": {
                "command": "npx",
                "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
                "description": "File system operations"
            },
            "ollama": {
                "command": "npx",
                "args": ["-y", "ollama-mcp"],
                "env": {"OLLAMA_BASE_URL": "http://localhost:11434"},
                "description": "Local AI model inference"
            },
            "qdrant": {
                "command": "npx",
                "args": ["-y", "qdrant-api-mcp"],
                "env": {"QDRANT_CLUSTER_URL": "http://localhost:6333"},
                "description": "Qdrant vector database"
            },
            "neo4j": {
                "command": "npx",
                "args": ["-y", "@henrychong-ai/mcp-neo4j-knowledge-graph"],
                "env": {"NEO4J_CONNECTION_URL": "bolt://localhost:7687"},
                "description": "Neo4j graph database"
            },
            "playwright": {
                "command": "npx",
                "args": ["-y", "@playwright/mcp"],
                "description": "Web automation and scraping"
            }
        }

    async def test_server(self, name: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Test a single MCP server"""
        result = {
            "server_name": name,
            "status": "unknown",
            "tools_count": 0,
            "error": None
        }

        try:
            # Prepare environment
            env = dict(os.environ)
            if "env" in config:
                env.update(config["env"])

            server_params = StdioServerParameters(
                command=config["command"],
                args=config["args"],
                env=env
            )

            print(f"🔍 Testing {name}...")

            # Test connection with timeout
            async with asyncio.timeout(15):
                async with stdio_client(server_params) as (read, write):
                    async with ClientSession(read, write) as session:
                        await session.initialize()
                        tools = await session.list_tools()
                        result["status"] = "connected"
                        result["tools_count"] = len(tools.tools)
                        print(f"✅ {name}: Connected ({len(tools.tools)} tools)")

        except asyncio.TimeoutError:
            result["status"] = "timeout"
            result["error"] = "Connection timeout"
            print(f"⏰ {name}: Timeout")

        except Exception as e:
            result["status"] = "failed"
            result["error"] = str(e)
            print(f"❌ {name}: {str(e)}")

        return result

    async def verify_core_servers(self) -> Dict[str, Any]:
        """Verify all core MCP servers for Mem0.ai"""
        print("🚀 Verifying core MCP servers for Mem0.ai integration...\n")

        results = {}
        successful_connections = 0

        # Test servers sequentially to avoid overwhelming
        for name, config in self.core_servers.items():
            result = await self.test_server(name, config)
            results[name] = result
            if result["status"] == "connected":
                successful_connections += 1

        # Summary
        total_servers = len(self.core_servers)
        success_rate = successful_connections / total_servers if total_servers > 0 else 0

        summary = {
            "total_servers": total_servers,
            "successful_connections": successful_connections,
            "success_rate": f"{successful_connections}/{total_servers} ({success_rate:.1%})",
            "results": results
        }

        print("\n📊 Core MCP Verification Summary:")
        print(f"   Total servers: {total_servers}")
        print(f"   Successful: {successful_connections}")
        print(f"   Success rate: {success_rate:.1%}")

        # Specific feedback for Mem0.ai integration
        if successful_connections >= 3:  # filesystem, qdrant, neo4j
            print("\n✅ Sufficient MCP servers available for Mem0.ai integration")
        else:
            print("\n⚠️  Limited MCP server connectivity - some Mem0.ai features may not work")

        return summary

async def main():
    """Main verification"""
    verifier = Mem0MCPCoreVerifier()

    try:
        results = await verifier.verify_core_servers()

        # Save results
        output_file = Path("/Users/daniellynch/Developer/docs/integrations/mem0-ai/core_mcp_verification.json")
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)

        print(f"\n💾 Results saved to {output_file}")
        print("🎉 Core MCP verification completed!")

        return results

    except Exception as e:
        print(f"❌ Verification failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())