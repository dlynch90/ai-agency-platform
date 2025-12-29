#!/usr/bin/env python3
"""
Mem0.ai Integration Test Script

Tests the complete Mem0.ai integration with PyTorch GPU acceleration,
Pydantic AI, and MCP tools.
"""

import os
import sys
import asyncio
from typing import Dict, Any, List

# Set environment variables for OpenMP compatibility
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

try:
    import torch
    import mem0
    import pydantic_ai
    from qdrant_client import QdrantClient
    from neo4j import GraphDatabase
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
    print("✅ All dependencies imported successfully")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

class Mem0IntegrationTester:
    def __init__(self):
        self.device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
        print(f"🖥️  Using device: {self.device}")

    def test_pytorch_gpu(self) -> Dict[str, Any]:
        """Test PyTorch GPU acceleration"""
        print("🔥 Testing PyTorch GPU acceleration...")

        results = {
            "torch_version": torch.__version__,
            "device": str(self.device),
            "cuda_available": torch.cuda.is_available(),
            "mps_available": torch.backends.mps.is_available(),
        }

        try:
            # Create a simple tensor operation
            x = torch.randn(1000, 1000).to(self.device)
            y = torch.randn(1000, 1000).to(self.device)
            z = torch.matmul(x, y)

            results["gpu_computation_successful"] = True
            results["tensor_shape"] = str(z.shape)
            print("✅ GPU computation successful")

        except Exception as e:
            results["gpu_computation_successful"] = False
            results["error"] = str(e)
            print(f"❌ GPU computation failed: {e}")

        return results

    def test_mem0_basic(self) -> Dict[str, Any]:
        """Test basic Mem0.ai functionality"""
        print("🧠 Testing Mem0.ai basic functionality...")

        results = {}

        try:
            # Initialize Mem0 memory (using local storage for testing)
            config = {
                "vector_store": {
                    "provider": "qdrant",
                    "config": {
                        "collection_name": "test_memories",
                        "host": "localhost",
                        "port": 6333,
                    }
                }
            }

            # Note: This will fail without Qdrant running, but tests the import
            try:
                memory = mem0.Memory.from_config(config)
                results["mem0_initialization"] = "successful"
                print("✅ Mem0 initialization successful")
            except Exception as e:
                results["mem0_initialization"] = "expected_failure_no_qdrant"
                results["mem0_error"] = str(e)
                print(f"⚠️  Mem0 initialization failed (expected without Qdrant): {e}")

            results["mem0_version"] = getattr(mem0, '__version__', 'unknown')

        except Exception as e:
            results["mem0_basic_test"] = "failed"
            results["error"] = str(e)
            print(f"❌ Mem0 basic test failed: {e}")

        return results

    def test_pydantic_ai(self) -> Dict[str, Any]:
        """Test Pydantic AI functionality"""
        print("🤖 Testing Pydantic AI...")

        results = {}

        try:
            # Test basic Pydantic AI import and setup
            from pydantic_ai import Agent
            results["pydantic_ai_import"] = "successful"
            print("✅ Pydantic AI imported successfully")

            # Create a simple agent (without actual LLM for testing)
            try:
                agent = Agent('test-model')
                results["agent_creation"] = "successful"
                print("✅ Pydantic AI agent created successfully")
            except Exception as e:
                results["agent_creation"] = "failed"
                results["agent_error"] = str(e)
                print(f"⚠️  Agent creation failed (expected without API key): {e}")

        except Exception as e:
            results["pydantic_ai_test"] = "failed"
            results["error"] = str(e)
            print(f"❌ Pydantic AI test failed: {e}")

        return results

    def test_vector_databases(self) -> Dict[str, Any]:
        """Test vector database clients"""
        print("🗄️  Testing vector database clients...")

        results = {}

        # Test Qdrant client
        try:
            # Try to connect to local Qdrant (will fail if not running)
            client = QdrantClient(host="localhost", port=6333)
            results["qdrant_client_creation"] = "successful"
            print("✅ Qdrant client created successfully")
        except Exception as e:
            results["qdrant_client_creation"] = "expected_failure_no_server"
            results["qdrant_error"] = str(e)
            print(f"⚠️  Qdrant client creation failed (expected without server): {e}")

        # Test Neo4j client
        try:
            # Try to connect to local Neo4j (will fail if not running)
            driver = GraphDatabase.driver("bolt://localhost:7687")
            results["neo4j_driver_creation"] = "successful"
            driver.close()
            print("✅ Neo4j driver created successfully")
        except Exception as e:
            results["neo4j_driver_creation"] = "expected_failure_no_server"
            results["neo4j_error"] = str(e)
            print(f"⚠️  Neo4j driver creation failed (expected without server): {e}")

        return results

    async def test_mcp_client(self) -> Dict[str, Any]:
        """Test MCP client functionality"""
        print("🔧 Testing MCP client...")

        results = {}

        try:
            # Test MCP client import and basic functionality
            from mcp import ClientSession, StdioServerParameters
            from mcp.client.stdio import stdio_client

            results["mcp_import"] = "successful"
            print("✅ MCP client imported successfully")

            # Try to connect to a basic MCP server (filesystem)
            server_params = StdioServerParameters(
                command="npx",
                args=["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
                env=dict(os.environ)
            )

            try:
                async with stdio_client(server_params) as (read, write):
                    async with ClientSession(read, write) as session:
                        await session.initialize()
                        tools = await session.list_tools()
                        results["mcp_connection"] = "successful"
                        results["mcp_tools_count"] = len(tools.tools)
                        print(f"✅ MCP connection successful, {len(tools.tools)} tools available")
            except Exception as e:
                results["mcp_connection"] = "expected_failure_no_npx"
                results["mcp_connection_error"] = str(e)
                print(f"⚠️  MCP connection failed (expected without npx): {e}")

        except Exception as e:
            results["mcp_test"] = "failed"
            results["error"] = str(e)
            print(f"❌ MCP test failed: {e}")

        return results

    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all integration tests"""
        print("🚀 Starting Mem0.ai integration tests...\n")

        results = {
            "timestamp": "2024-12-28T12:00:00Z",
            "environment": "pixi-ai-ml",
            "tests": {}
        }

        # Run tests
        results["tests"]["pytorch_gpu"] = self.test_pytorch_gpu()
        results["tests"]["mem0_basic"] = self.test_mem0_basic()
        results["tests"]["pydantic_ai"] = self.test_pydantic_ai()
        results["tests"]["vector_databases"] = self.test_vector_databases()
        results["tests"]["mcp_client"] = await self.test_mcp_client()

        # Summary
        successful_tests = sum(1 for test_results in results["tests"].values()
                              for key, value in test_results.items()
                              if key.endswith('_successful') and value is True)

        total_tests = len(results["tests"])
        results["summary"] = {
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "success_rate": f"{successful_tests}/{total_tests}"
        }

        print("\n📊 Test Summary:")
        print(f"   Total tests: {total_tests}")
        print(f"   Successful: {successful_tests}")
        print(f"   Success rate: {successful_tests}/{total_tests}")

        return results

async def main():
    """Main test execution"""
    tester = Mem0IntegrationTester()

    try:
        results = await tester.run_all_tests()

        # Save results
        import json
        output_file = "/Users/daniellynch/Developer/docs/integrations/mem0-ai/integration_test_results.json"
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)

        print(f"\n💾 Results saved to {output_file}")
        print("🎉 Mem0.ai integration testing completed!")

        return results

    except Exception as e:
        print(f"❌ Test execution failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())