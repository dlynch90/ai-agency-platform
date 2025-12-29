#!/usr/bin/env python3
"""
Test Mem0.ai MCP Server

Tests the Mem0.ai MCP server implementation to ensure all memory operations work correctly.
"""

import asyncio
import json
import os
import subprocess
import sys
import time
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import torch

try:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
except ImportError:
    print("❌ MCP client not available")
    sys.exit(1)

class Mem0MCPTester:
    def __init__(self):
        self.server_process = None
        self.test_results = {}

    async def start_server(self):
        """Start the Mem0 MCP server process"""
        try:
            env = os.environ.copy()
            env['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

            self.server_process = subprocess.Popen(
                [sys.executable, "mcp-servers/mem0-server.py"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=env,
                cwd=Path(__file__).parent.parent
            )

            # Give server time to start
            await asyncio.sleep(2)

            # Check if process is still running
            if self.server_process.poll() is not None:
                stdout, stderr = self.server_process.communicate()
                print(f"❌ Server failed to start. STDOUT: {stdout.decode()}, STDERR: {stderr.decode()}")
                return False

            print("✅ Mem0 MCP server started successfully")
            return True

        except Exception as e:
            print(f"❌ Failed to start server: {e}")
            return False

    def stop_server(self):
        """Stop the MCP server process"""
        if self.server_process:
            self.server_process.terminate()
            try:
                self.server_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.server_process.kill()
            print("🛑 Mem0 MCP server stopped")

    async def test_mcp_tools(self):
        """Test MCP tool functionality"""
        print("🔧 Testing MCP tools...")

        # MCP server parameters
        server_params = StdioServerParameters(
            command=sys.executable,
            args=["mcp-servers/mem0-server.py"],
            env={**os.environ, 'KMP_DUPLICATE_LIB_OK': 'TRUE'}
        )

        try:
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()

                    # Test list tools
                    tools_result = await session.list_tools()
                    tools = [tool.name for tool in tools_result.tools]
                    expected_tools = [
                        "mem0_add_memory", "mem0_search_memory", "mem0_update_memory",
                        "mem0_delete_memory", "mem0_get_all_memory", "mem0_get_memory_stats"
                    ]

                    self.test_results["list_tools"] = {
                        "success": True,
                        "tools_found": tools,
                        "expected_tools": expected_tools,
                        "all_expected_present": all(tool in tools for tool in expected_tools)
                    }

                    print(f"✅ Found {len(tools)} tools: {tools}")

                    # Test get memory stats
                    stats_result = await session.call_tool("mem0_get_memory_stats", {})
                    stats_content = self.extract_text_content(stats_result)
                    stats_data = json.loads(stats_content)

                    self.test_results["get_memory_stats"] = {
                        "success": stats_data.get("success", False),
                        "device": stats_data.get("stats", {}).get("device"),
                        "memory_initialized": stats_data.get("stats", {}).get("memory_initialized")
                    }

                    print("✅ Memory stats retrieved successfully")

                    # Test add memory
                    test_messages = [
                        {"role": "user", "content": "Hello, I am a test user"},
                        {"role": "assistant", "content": "Hello! How can I help you today?"}
                    ]

                    add_result = await session.call_tool("mem0_add_memory", {
                        "messages": test_messages,
                        "user_id": "test_user",
                        "metadata": {"test": True}
                    })
                    add_content = self.extract_text_content(add_result)
                    add_data = json.loads(add_content)

                    self.test_results["add_memory"] = {
                        "success": add_data.get("success", False),
                        "memory_id": add_data.get("memory_id")
                    }

                    print("✅ Memory added successfully")

                    # Test search memory
                    search_result = await session.call_tool("mem0_search_memory", {
                        "query": "test user",
                        "user_id": "test_user",
                        "limit": 5
                    })
                    search_content = self.extract_text_content(search_result)
                    search_data = json.loads(search_content)

                    self.test_results["search_memory"] = {
                        "success": search_data.get("success", False),
                        "results_count": len(search_data.get("results", []))
                    }

                    print("✅ Memory search completed")

                    # Test get all memory
                    all_result = await session.call_tool("mem0_get_all_memory", {
                        "user_id": "test_user",
                        "limit": 10
                    })
                    all_content = self.extract_text_content(all_result)
                    all_data = json.loads(all_content)

                    self.test_results["get_all_memory"] = {
                        "success": all_data.get("success", False),
                        "memories_count": all_data.get("count", 0)
                    }

                    print("✅ Get all memories completed")

        except Exception as e:
            print(f"❌ MCP tool testing failed: {e}")
            self.test_results["mcp_tools_error"] = str(e)
            return False

        return True

    def extract_text_content(self, result):
        """Extract text content from MCP tool result"""
        if hasattr(result, 'content'):
            for item in result.content:
                if hasattr(item, 'type') and item.type == 'text':
                    return item.text
        return ""

    def print_summary(self):
        """Print test summary"""
        print("\n📊 Mem0 MCP Server Test Results:")
        print("=" * 50)

        successful_tests = 0
        total_tests = 0

        for test_name, result in self.test_results.items():
            total_tests += 1
            if isinstance(result, dict) and result.get("success", False):
                successful_tests += 1
                status = "✅ PASS"
            elif test_name.endswith("_error"):
                status = "❌ FAIL"
            else:
                status = "✅ PASS" if result else "❌ FAIL"

            print(f"{status} {test_name}: {result}")

        print(f"\n🎯 Overall: {successful_tests}/{total_tests} tests passed")

        if successful_tests == total_tests:
            print("🎉 All Mem0 MCP server tests passed!")
        else:
            print("⚠️  Some tests failed - check implementation")

    async def run_tests(self):
        """Run all tests"""
        print("🚀 Starting Mem0.ai MCP Server Tests...\n")

        # Start server
        if not await self.start_server():
            print("❌ Cannot proceed with tests - server failed to start")
            return False

        try:
            # Run MCP tool tests
            success = await self.test_mcp_tools()

            # Print summary
            self.print_summary()

            return success

        finally:
            # Always stop server
            self.stop_server()

async def main():
    """Main test execution"""
    tester = Mem0MCPTester()

    try:
        success = await tester.run_tests()
        sys.exit(0 if success else 1)

    except KeyboardInterrupt:
        print("\n🛑 Tests interrupted by user")
        tester.stop_server()
        sys.exit(1)

    except Exception as e:
        print(f"❌ Test execution failed: {e}")
        tester.stop_server()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())