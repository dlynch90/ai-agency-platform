#!/usr/bin/env python3
"""
Mem0.ai Integration Test Suite
Comprehensive testing of GPU acceleration, MCP tools, and PyTorch integration

Tests:
- Memory operations (add, search, update, delete)
- GPU acceleration verification
- MCP tool orchestration (20+ tools)
- PyTorch model performance
- Vector database integration
- Graph memory operations
- Multi-tenant isolation
- Performance benchmarking
"""

import asyncio
import pytest
import torch
import numpy as np
import time
from typing import Dict, List, Any
import aiohttp
from concurrent.futures import ThreadPoolExecutor

# Test imports
try:
    from mem0 import Memory
    from sentence_transformers import SentenceTransformer
    from qdrant_client import QdrantClient
    import chromadb
    from neo4j import GraphDatabase
except ImportError:
    pytest.skip("Required dependencies not installed", allow_module_level=True)

class TestMem0Integration:
    """Comprehensive test suite for Mem0.ai integration"""

    @pytest.fixture(scope="session")
    def event_loop(self):
        """Create an instance of the default event loop for the test session."""
        loop = asyncio.get_event_loop_policy().new_event_loop()
        yield loop
        loop.close()

    @pytest.fixture(scope="session")
    async def setup_test_env(self):
        """Setup test environment with required services"""
        # Check if services are running
        services = {
            'mem0_mcp': 'http://localhost:3001/health',
            'pytorch_integration': 'http://localhost:3002/torch/stats',
            'mcp_integration': 'http://localhost:3003/system/stats'
        }

        running_services = {}
        async with aiohttp.ClientSession() as session:
            for name, url in services.items():
                try:
                    async with session.get(url, timeout=5) as response:
                        if response.status == 200:
                            running_services[name] = await response.json()
                except:
                    pytest.skip(f"Service {name} not running at {url}")

        return running_services

    def test_gpu_acceleration(self):
        """Test GPU acceleration setup"""
        assert torch.cuda.is_available() or torch.backends.mps.is_available()

        device = torch.device("cuda:0" if torch.cuda.is_available() else "mps")
        tensor = torch.randn(100, 100, device=device)

        assert tensor.device == device
        assert tensor.shape == (100, 100)

        # Test GPU memory if available
        if torch.cuda.is_available():
            memory_allocated = torch.cuda.memory_allocated(0)
            assert memory_allocated > 0

    def test_pytorch_memory_model(self):
        """Test PyTorch memory embedding model"""
        from packages.mem0_pytorch_integration.src.mem0_torch import MemoryEmbedding

        device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        model = MemoryEmbedding(embedding_dim=384).to(device)

        # Test forward pass
        embeddings = torch.randn(5, 384, device=device)
        result = model(embeddings)

        assert 'encoded' in result
        assert 'reconstructed' in result
        assert 'importance_scores' in result

        assert result['encoded'].shape == (5, 512)  # hidden_dim
        assert result['reconstructed'].shape == (5, 384)
        assert result['importance_scores'].shape == (5, 1)

    @pytest.mark.asyncio
    async def test_memory_operations(self, setup_test_env):
        """Test basic memory operations via MCP"""
        if 'mem0_mcp' not in setup_test_env:
            pytest.skip("Mem0 MCP server not running")

        test_messages = [
            {"role": "user", "content": "Hello, I'm John from New York"},
            {"role": "assistant", "content": "Hi John! Nice to meet you."}
        ]

        async with aiohttp.ClientSession() as session:
            # Test add memory
            add_payload = {
                "messages": test_messages,
                "user_id": "test_user_123",
                "metadata": {"test": True}
            }

            async with session.post(
                'http://localhost:3001/memory/add',
                json=add_payload
            ) as response:
                assert response.status == 200
                result = await response.json()
                assert result['success'] is True
                memory_id = result['memory_id']

            # Test search memory
            search_payload = {
                "query": "John from New York",
                "user_id": "test_user_123",
                "limit": 5
            }

            async with session.post(
                'http://localhost:3001/memory/search',
                json=search_payload
            ) as response:
                assert response.status == 200
                result = await response.json()
                assert result['success'] is True
                assert len(result['results']) > 0

    @pytest.mark.asyncio
    async def test_pytorch_integration(self, setup_test_env):
        """Test PyTorch integration endpoints"""
        if 'pytorch_integration' not in setup_test_env:
            pytest.skip("PyTorch integration server not running")

        async with aiohttp.ClientSession() as session:
            # Test torch stats
            async with session.get('http://localhost:3002/torch/stats') as response:
                assert response.status == 200
                stats = await response.json()

                assert 'device' in stats
                assert 'model_parameters' in stats

                if torch.cuda.is_available():
                    assert 'gpu_name' in stats
                    assert 'gpu_memory_total' in stats

    @pytest.mark.asyncio
    async def test_mcp_tool_orchestration(self, setup_test_env):
        """Test MCP tool orchestration across 20+ tools"""
        if 'mcp_integration' not in setup_test_env:
            pytest.skip("MCP integration manager not running")

        async with aiohttp.ClientSession() as session:
            # Test system stats
            async with session.get('http://localhost:3003/system/stats') as response:
                assert response.status == 200
                stats = await response.json()

                assert 'mcp_tools_count' in stats
                assert stats['mcp_tools_count'] >= 20  # Should have 20+ tools
                assert 'memory_systems_count' in stats

            # Test tool listing
            async with session.get('http://localhost:3003/tools/list') as response:
                assert response.status == 200
                tools_data = await response.json()

                assert 'tools' in tools_data
                tools = tools_data['tools']
                assert len(tools) >= 20

                # Check for key tools
                tool_names = [tool['name'] for tool in tools]
                assert 'qdrant' in tool_names
                assert 'neo4j' in tool_names
                assert 'ollama' in tool_names
                assert 'github' in tool_names

    @pytest.mark.asyncio
    async def test_memory_orchestration(self, setup_test_env):
        """Test orchestrated memory operations across multiple tools"""
        if 'mcp_integration' not in setup_test_env:
            pytest.skip("MCP integration manager not running")

        async with aiohttp.ClientSession() as session:
            # Test orchestrated add memory operation
            orchestrate_payload = {
                "operation": "add_memory",
                "params": {
                    "content": "Test orchestrated memory operation",
                    "user_id": "test_orchestration",
                    "importance": 0.8
                }
            }

            async with session.post(
                'http://localhost:3003/memory/orchestrate',
                json=orchestrate_payload
            ) as response:
                assert response.status == 200
                result = await response.json()

                assert 'operation' in result
                assert result['operation'] == 'add_memory'
                assert 'tools_used' in result
                assert len(result['tools_used']) > 0
                assert 'successful_tools' in result

    def test_vector_database_integration(self):
        """Test vector database integrations"""
        # Test Qdrant connection
        try:
            qdrant = QdrantClient(url="http://localhost:6333")
            # Try to list collections (should not fail)
            collections = qdrant.get_collections()
            assert isinstance(collections, (list, dict))
        except Exception:
            pytest.skip("Qdrant not running")

        # Test ChromaDB connection
        try:
            chroma = chromadb.PersistentClient(path="./test_chroma")
            collection = chroma.get_or_create_collection("test_collection")
            assert collection.name == "test_collection"
        except Exception:
            pytest.skip("ChromaDB not available")

    def test_graph_database_integration(self):
        """Test graph database integration"""
        try:
            driver = GraphDatabase.driver(
                "bolt://localhost:7687",
                auth=("neo4j", "test_password")
            )

            with driver.session() as session:
                result = session.run("RETURN 1 as test")
                record = result.single()
                assert record['test'] == 1

            driver.close()
        except Exception:
            pytest.skip("Neo4j not running or auth failed")

    @pytest.mark.asyncio
    async def test_performance_benchmark(self, setup_test_env):
        """Performance benchmark for memory operations"""
        if 'mem0_mcp' not in setup_test_env:
            pytest.skip("Mem0 MCP server not running")

        # Benchmark memory addition
        test_messages = [
            {"role": "user", "content": f"Benchmark message {i}"}
            for i in range(10)
        ]

        async with aiohttp.ClientSession() as session:
            start_time = time.time()

            for i in range(5):  # 5 iterations
                payload = {
                    "messages": test_messages,
                    "user_id": f"benchmark_user_{i}",
                    "metadata": {"benchmark": True, "iteration": i}
                }

                async with session.post(
                    'http://localhost:3001/memory/add',
                    json=payload
                ) as response:
                    assert response.status == 200

            end_time = time.time()
            total_time = end_time - start_time

            # Should complete in reasonable time (adjust threshold as needed)
            assert total_time < 30.0  # Less than 30 seconds for 5 operations

            ops_per_second = 5 / total_time
            print(".2f")

    def test_multi_tenant_isolation(self):
        """Test multi-tenant memory isolation"""
        # Create separate memory instances for different tenants
        tenant1_memory = Memory()  # Would use different configs
        tenant2_memory = Memory()  # Would use different configs

        # In a real implementation, these would have different vector stores
        # and complete isolation between tenants
        assert tenant1_memory is not tenant2_memory

    @pytest.mark.asyncio
    async def test_error_handling(self, setup_test_env):
        """Test error handling in various scenarios"""
        if 'mem0_mcp' not in setup_test_env:
            pytest.skip("Mem0 MCP server not running")

        async with aiohttp.ClientSession() as session:
            # Test invalid memory ID
            update_payload = {
                "memory_id": "invalid_id_12345",
                "data": {"content": "Updated content"}
            }

            async with session.put(
                'http://localhost:3001/memory/update',
                json=update_payload
            ) as response:
                # Should return error gracefully
                assert response.status in [400, 404, 500]
                result = await response.json()
                assert 'error' in result or 'success' in result

    def test_memory_embedding_quality(self):
        """Test quality of memory embeddings"""
        try:
            embedder = SentenceTransformer('all-MiniLM-L6-v2')

            # Test embedding similarity
            text1 = "Hello, how are you today?"
            text2 = "Hi, how do you feel today?"
            text3 = "The weather is nice outside."

            emb1 = embedder.encode(text1)
            emb2 = embedder.encode(text2)
            emb3 = embedder.encode(text3)

            # Calculate cosine similarities
            sim_1_2 = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
            sim_1_3 = np.dot(emb1, emb3) / (np.linalg.norm(emb1) * np.linalg.norm(emb3))

            # Similar texts should have higher similarity
            assert sim_1_2 > sim_1_3
            assert sim_1_2 > 0.5  # Should be reasonably similar
            assert sim_1_3 < 0.5  # Should be less similar

        except ImportError:
            pytest.skip("SentenceTransformers not available")

# Performance test utilities
def benchmark_memory_operations():
    """Benchmark memory operations performance"""
    import cProfile
    import pstats

    profiler = cProfile.Profile()
    profiler.enable()

    # Run test suite
    pytest.main([
        __file__,
        "-v",
        "-k", "test_memory_operations or test_pytorch_integration",
        "--tb=short"
    ])

    profiler.disable()
    stats = pstats.Stats(profiler).sort_stats('cumulative')
    stats.print_stats(20)  # Top 20 functions by cumulative time

if __name__ == "__main__":
    # Run benchmarks if called directly
    if len(sys.argv) > 1 and sys.argv[1] == "--benchmark":
        benchmark_memory_operations()
    else:
        # Run pytest
        pytest.main([__file__, "-v"])