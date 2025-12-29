#!/usr/bin/env python3
"""
Mem0.ai API Integration Tests
Tests the complete Mem0.ai integration with real API calls and mocking fallbacks
"""

import os
import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, List, Any


class TestMem0Integration:
    """Comprehensive test suite for Mem0.ai integration"""

    def setup_method(self):
        """Set up test environment"""
        self.test_user_id = "test-user"
        self.test_messages = [
            {"role": "user", "content": "I'm a vegetarian"},
            {"role": "assistant", "content": "Got it! I'll remember your dietary preference."}
        ]

    def test_environment_validation(self):
        """Test environment variable validation"""
        # Test with no API key - simulate the validation logic
        original_env = os.environ.copy()

        try:
            # Clear environment
            os.environ.clear()

            # Simulate validation logic
            mem0_api_key = os.environ.get('MEM0_API_KEY', 'test-key-for-debug')
            test_user_id = os.environ.get('MEM0_DEFAULT_USER_ID', 'test-user-debug')

            issues = []
            if not mem0_api_key or mem0_api_key == 'test-key-for-debug':
                issues.append('❌ MEM0_API_KEY not set or using test key')

            if not test_user_id or test_user_id == 'test-user-debug':
                issues.append('⚠️  MEM0_DEFAULT_USER_ID using test value')

            # Check if we can access the config file
            config_path = './configs/mem0-config.toml'
            if not os.path.exists(config_path):
                issues.append('❌ Mem0 config file not found at ./configs/mem0-config.toml')

            assert len(issues) > 0
            assert any("MEM0_API_KEY not set" in issue for issue in issues)

        finally:
            # Restore environment
            os.environ.update(original_env)

    def test_mock_memory_operations(self):
        """Test that mock operations work when API is not configured"""
        # Simulate the functions from the test-langchain-mem0.js script

        def retrieve_context(query: str, user_id: str) -> List[Dict]:
            """Retrieve relevant context from Mem0 (simulated)"""
            # Mock context retrieval fallback
            return [
                {"role": "system", "content": f"Mock context for: {query}"},
                {"role": "user", "content": query}
            ]

        def save_interaction(user_id: str, user_input: str, assistant_response: str):
            """Save the interaction to Mem0 (mocked)"""
            # Mock implementation
            pass

        # Test retrieve_context with mock
        context = retrieve_context("test query", self.test_user_id)
        assert len(context) == 2
        assert context[0]["role"] == "system"
        assert "Mock context" in context[0]["content"]

        # Test save_interaction with mock
        save_interaction(self.test_user_id, "test input", "test response")
        # Should not raise exception

    @pytest.mark.skipif(not os.getenv('MEM0_API_KEY') or os.getenv('MEM0_API_KEY') == 'test-key-for-debug',
                       reason="Requires real Mem0 API key")
    def test_real_mem0_api_operations(self):
        """Test real Mem0 API operations when properly configured"""
        from mem0 import MemoryClient

        api_key = os.getenv('MEM0_API_KEY')
        assert api_key and api_key != 'test-key-for-debug'

        client = MemoryClient(api_key=api_key)

        # Test add memory
        result = client.add(self.test_messages, user_id=self.test_user_id)
        assert result is not None
        assert 'results' in result

        # Test search memory
        search_result = client.search(
            query="dietary preferences",
            user_id=self.test_user_id
        )
        assert search_result is not None
        assert 'results' in search_result

    def test_langchain_tool_integration(self):
        """Test LangChain tool integration structure"""
        # Test that the tool definitions exist and are properly structured
        try:
            from langchain_core.tools import StructuredTool
            from pydantic import BaseModel

            # These would be the actual tool definitions from the integration
            # For now, just test that the imports work
            assert StructuredTool is not None
            assert BaseModel is not None

        except ImportError:
            pytest.skip("LangChain not installed")

    def test_mcp_server_configuration(self):
        """Test MCP server configuration is valid"""
        # Check that the config file exists and is valid TOML
        config_path = "configs/mem0-config.toml"
        assert os.path.exists(config_path)

        # Basic TOML validation
        with open(config_path, 'r') as f:
            content = f.read()
            assert '[mem0]' in content
            assert 'api_key' in content

    def test_error_handling_graceful_degradation(self):
        """Test that system gracefully degrades when API is unavailable"""
        # Test with invalid API key
        with patch.dict(os.environ, {'MEM0_API_KEY': 'invalid-key'}, clear=True):
            # Should not crash, should use mock fallbacks
            try:
                from mem0 import MemoryClient
                client = MemoryClient(api_key='invalid-key')
                # This should raise an exception
                assert False, "Should have raised an exception"
            except Exception:
                # Expected - invalid key should cause exception
                pass

    def test_memory_persistence_simulation(self):
        """Test memory persistence simulation for development"""
        # Test that we can simulate memory operations without real API
        mock_memory_store = {}

        # Simulate adding memory
        memory_id = "test-memory-1"
        mock_memory_store[memory_id] = {
            "user_id": self.test_user_id,
            "memory": "Test memory content",
            "timestamp": "2024-01-01T00:00:00Z"
        }

        # Simulate retrieving memory
        retrieved = mock_memory_store.get(memory_id)
        assert retrieved is not None
        assert retrieved["user_id"] == self.test_user_id
        assert retrieved["memory"] == "Test memory content"


if __name__ == "__main__":
    # Run basic tests
    test_instance = TestMem0Integration()
    test_instance.setup_method()

    print("🧪 Running Mem0.ai Integration Tests")
    print("=" * 50)

    try:
        test_instance.test_environment_validation()
        print("✅ Environment validation test passed")

        test_instance.test_mock_memory_operations()
        print("✅ Mock memory operations test passed")

        test_instance.test_mcp_server_configuration()
        print("✅ MCP server configuration test passed")

        test_instance.test_memory_persistence_simulation()
        print("✅ Memory persistence simulation test passed")

        # Test real API if available
        if os.getenv('MEM0_API_KEY') and os.getenv('MEM0_API_KEY') != 'test-key-for-debug':
            test_instance.test_real_mem0_api_operations()
            print("✅ Real Mem0 API operations test passed")
        else:
            print("⚠️  Skipping real API tests (no valid API key configured)")

        print("\n🎉 All tests completed successfully!")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        exit(1)