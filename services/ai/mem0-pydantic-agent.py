#!/usr/bin/env python3
"""
Mem0.ai Pydantic AI Agents

Pydantic AI agents integrated with Mem0.ai memory layer for context-aware AI interactions.
Supports multiple agent types and use cases with persistent memory and MCP tool integration.
"""

import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional, Union, Callable
from datetime import datetime
from pathlib import Path
import sys

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import torch
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from pydantic_ai.models import Model
import mem0

# MCP client imports
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MockAgent:
    """Mock agent for testing when LLM is not available"""

    def __init__(self, system_prompt: str):
        self.system_prompt = system_prompt

    async def run(self, input_text: str):
        """Mock run method"""
        class MockResult:
            def __init__(self, response: str):
                self.data = response

        return MockResult(f"[MOCK RESPONSE] {input_text[:50]}... (System: {self.system_prompt[:50]}...)")

class AgentMemory(BaseModel):
    """Memory context for agents"""
    user_id: str
    agent_id: str
    session_id: Optional[str] = None
    context: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class AgentConfig(BaseModel):
    """Configuration for Mem0-enabled agents"""
    name: str
    description: str
    model_name: str = "ollama:llama3.2"
    system_prompt: str
    memory_user_id: str
    memory_agent_id: str
    tools: List[str] = Field(default_factory=list)
    max_context_length: int = 10
    temperature: float = 0.7

class Mem0PydanticAgent:
    """Pydantic AI agent with Mem0 memory integration"""

    def __init__(self, config: AgentConfig):
        self.config = config
        self.memory_client = None
        self.agent = None
        self.mcp_sessions: Dict[str, ClientSession] = {}
        self._setup_memory()
        self._setup_agent()
        self._setup_mcp_tools()

    def _setup_memory(self):
        """Initialize Mem0 memory client"""
        try:
            # Try to connect to Mem0 MCP server
            self.memory_client = Mem0MemoryClient()
            logger.info(f"✅ Memory client initialized for agent {self.config.name}")
        except Exception as e:
            logger.warning(f"⚠️  Memory client initialization failed: {e}")
            self.memory_client = None

    def _setup_agent(self):
        """Initialize Pydantic AI agent"""
        try:
            # Set up environment for Ollama
            os.environ.setdefault('OLLAMA_BASE_URL', 'http://localhost:11434')

            # Create agent with memory-enabled system prompt
            system_prompt = f"""
            {self.config.system_prompt}

            You have access to persistent memory to maintain context across conversations.
            Use the available tools to gather information and maintain state.
            Always consider previous interactions and maintain consistency.
            """

            # Use a fallback model if Ollama is not available
            try:
                self.agent = Agent(
                    self.config.model_name,
                    system_prompt=system_prompt
                )
            except Exception as model_error:
                logger.warning(f"Failed to initialize with {self.config.model_name}: {model_error}")
                # Fallback to a basic model configuration
                try:
                    self.agent = Agent(
                        'ollama:llama3.2',  # Explicit fallback
                        system_prompt=system_prompt
                    )
                except Exception as fallback_error:
                    logger.warning(f"Fallback model also failed: {fallback_error}")
                    raise model_error  # Re-raise original error to trigger mock agent

            logger.info(f"✅ Agent {self.config.name} initialized")

        except Exception as e:
            logger.error(f"❌ Failed to initialize agent: {e}")
            # Create a mock agent for testing when LLM is not available
            self.agent = MockAgent(system_prompt="Mock agent - LLM not available")

    def _is_mock_agent(self) -> bool:
        """Check if we're using a mock agent"""
        return isinstance(self.agent, MockAgent)

    def _setup_mcp_tools(self):
        """Setup MCP tool integrations"""
        # This would integrate with various MCP servers
        # For now, we'll set up basic tool calling infrastructure
        pass

    async def run_with_memory(self, user_input: str, user_id: str, session_id: Optional[str] = None) -> str:
        """Run agent with memory context"""
        try:
            # Retrieve relevant memories
            memories = await self._get_relevant_memories(user_input, user_id)

            # Build context from memories
            context = self._build_memory_context(memories)

            # Enhance user input with context
            if self._is_mock_agent():
                enhanced_input = f"[MOCK] Context: {context[:100]}... Input: {user_input}"
            else:
                enhanced_input = f"""
                Previous context: {context}

                Current user input: {user_input}

                Respond naturally while considering the conversation history.
                """

            # Run agent
            result = await self.agent.run(enhanced_input)

            # Store interaction in memory (skip for mock agents)
            if not self._is_mock_agent():
                await self._store_interaction(user_input, result.data, user_id, session_id)

            return result.data

        except Exception as e:
            logger.error(f"Error running agent with memory: {e}")
            # Fallback response
            return f"I apologize, but I'm experiencing technical difficulties. Error: {str(e)}"

    async def _get_relevant_memories(self, query: str, user_id: str) -> List[Dict[str, Any]]:
        """Retrieve relevant memories for the query"""
        if not self.memory_client:
            return []

        try:
            memories = await self.memory_client.search_memory(
                query=query,
                user_id=user_id,
                agent_id=self.config.memory_agent_id,
                limit=self.config.max_context_length
            )

            if memories.get("success"):
                return memories.get("results", [])
            else:
                logger.warning(f"Memory search failed: {memories.get('error')}")
                return []

        except Exception as e:
            logger.error(f"Error retrieving memories: {e}")
            return []

    def _build_memory_context(self, memories: List[Dict[str, Any]]) -> str:
        """Build context string from memories"""
        if not memories:
            return "No previous context available."

        context_parts = []
        for memory in memories[:self.config.max_context_length]:
            if isinstance(memory, dict):
                content = memory.get("content", "")
                timestamp = memory.get("timestamp", "")
                context_parts.append(f"[{timestamp}] {content}")

        return "\n".join(context_parts)

    async def _store_interaction(self, user_input: str, agent_response: str, user_id: str, session_id: Optional[str]):
        """Store the interaction in memory"""
        if not self.memory_client:
            return

        try:
            messages = [
                {"role": "user", "content": user_input},
                {"role": "assistant", "content": agent_response}
            ]

            metadata = {
                "agent_id": self.config.memory_agent_id,
                "session_id": session_id,
                "timestamp": datetime.now().isoformat(),
                "agent_name": self.config.name
            }

            await self.memory_client.add_memory(
                messages=messages,
                user_id=user_id,
                agent_id=self.config.memory_agent_id,
                metadata=metadata
            )

        except Exception as e:
            logger.error(f"Error storing interaction: {e}")

class Mem0MemoryClient:
    """Client for Mem0 MCP server memory operations"""

    def __init__(self):
        self._available = False

    async def _create_session(self):
        """Create a new MCP session for each operation"""
        try:
            server_params = StdioServerParameters(
                command="python",
                args=["mcp-servers/mem0-server.py"],
                env=dict(os.environ)
            )

            transport = stdio_client(server_params)
            read_stream, write_stream = await transport.__aenter__()
            session = ClientSession(read_stream, write_stream)
            await session.initialize()

            return session, transport

        except Exception as e:
            logger.warning(f"❌ Failed to create MCP session: {e}")
            return None, None

    async def _close_session(self, session, transport):
        """Close MCP session"""
        try:
            if session:
                await session.aclose()
            if transport:
                await transport.__aexit__(None, None, None)
        except Exception as e:
            logger.warning(f"Warning during session cleanup: {e}")

    async def _call_tool(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Call MCP tool with automatic session management"""
        session, transport = await self._create_session()
        if not session:
            return {"success": False, "error": "Failed to create MCP session"}

        try:
            result = await session.call_tool(tool_name, args)
            return self._extract_result(result)
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            await self._close_session(session, transport)

    def _extract_result(self, result) -> Dict[str, Any]:
        """Extract JSON result from MCP response"""
        if hasattr(result, 'content') and result.content:
            for item in result.content:
                if hasattr(item, 'type') and item.type == 'text':
                    try:
                        return json.loads(item.text)
                    except json.JSONDecodeError:
                        return {"success": False, "error": "Invalid JSON response"}
        return {"success": False, "error": "No valid response"}

    async def add_memory(self, messages: List[Dict[str, Any]], user_id: str,
                        agent_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Add memory via MCP"""
        return await self._call_tool("mem0_add_memory", {
            "messages": messages,
            "user_id": user_id,
            "agent_id": agent_id,
            "metadata": metadata or {}
        })

    async def search_memory(self, query: str, user_id: str, agent_id: Optional[str] = None,
                           limit: int = 10) -> Dict[str, Any]:
        """Search memory via MCP"""
        return await self._call_tool("mem0_search_memory", {
            "query": query,
            "user_id": user_id,
            "agent_id": agent_id,
            "limit": limit
        })

    async def get_memory_stats(self) -> Dict[str, Any]:
        """Get memory statistics via MCP"""
        return await self._call_tool("mem0_get_memory_stats", {})

# Pre-configured agent templates for different use cases

def create_ecommerce_agent() -> Mem0PydanticAgent:
    """Create an ecommerce personalization agent"""
    config = AgentConfig(
        name="ecommerce_assistant",
        description="Personalized shopping assistant with purchase history memory",
        system_prompt="""
        You are a personalized ecommerce shopping assistant. Help customers find products
        based on their preferences, purchase history, and browsing behavior. Remember
        their favorite brands, sizes, colors, and past purchases to provide tailored recommendations.
        """,
        memory_user_id="ecommerce_users",
        memory_agent_id="shopping_assistant",
        tools=["search_products", "get_user_history", "recommend_similar"],
        temperature=0.8
    )
    return Mem0PydanticAgent(config)

def create_healthcare_agent() -> Mem0PydanticAgent:
    """Create a healthcare triage agent"""
    config = AgentConfig(
        name="healthcare_triage",
        description="Medical symptom assessment and triage assistant",
        system_prompt="""
        You are a healthcare triage assistant. Assess symptoms, provide general health information,
        and determine urgency levels. Always recommend consulting healthcare professionals for
        medical concerns. Maintain patient privacy and remember conversation context.
        """,
        memory_user_id="healthcare_patients",
        memory_agent_id="triage_assistant",
        tools=["symptom_checker", "urgency_assessment", "general_advice"],
        temperature=0.3  # Lower temperature for medical accuracy
    )
    return Mem0PydanticAgent(config)

def create_financial_agent() -> Mem0PydanticAgent:
    """Create a financial portfolio agent"""
    config = AgentConfig(
        name="financial_advisor",
        description="Personal finance and investment assistant",
        system_prompt="""
        You are a personal finance assistant. Help users with budgeting, investment advice,
        risk assessment, and portfolio optimization. Remember their financial goals,
        risk tolerance, and investment history for personalized recommendations.
        """,
        memory_user_id="financial_clients",
        memory_agent_id="portfolio_advisor",
        tools=["portfolio_analysis", "risk_assessment", "market_research"],
        temperature=0.6
    )
    return Mem0PydanticAgent(config)

def create_educational_agent() -> Mem0PydanticAgent:
    """Create an adaptive learning agent"""
    config = AgentConfig(
        name="learning_tutor",
        description="Adaptive learning and tutoring assistant",
        system_prompt="""
        You are an adaptive learning tutor. Personalize educational content based on
        student performance, learning style, and progress. Remember their strengths,
        weaknesses, and learning preferences to optimize their educational journey.
        """,
        memory_user_id="students",
        memory_agent_id="adaptive_tutor",
        tools=["assess_knowledge", "personalize_content", "track_progress"],
        temperature=0.7
    )
    return Mem0PydanticAgent(config)

def create_customer_service_agent() -> Mem0PydanticAgent:
    """Create a customer service automation agent"""
    config = AgentConfig(
        name="customer_support",
        description="Automated customer support with context awareness",
        system_prompt="""
        You are an intelligent customer support assistant. Handle inquiries, resolve issues,
        and maintain conversation context. Remember customer history, preferences, and
        previous interactions to provide personalized, efficient support.
        """,
        memory_user_id="customers",
        memory_agent_id="support_agent",
        tools=["ticket_lookup", "knowledge_search", "escalation_check"],
        temperature=0.5
    )
    return Mem0PydanticAgent(config)

# Agent registry for easy access
AGENT_REGISTRY = {
    "ecommerce": create_ecommerce_agent,
    "healthcare": create_healthcare_agent,
    "financial": create_financial_agent,
    "educational": create_educational_agent,
    "customer_service": create_customer_service_agent,
}

async def get_agent(agent_type: str) -> Optional[Mem0PydanticAgent]:
    """Get a pre-configured agent by type"""
    if agent_type in AGENT_REGISTRY:
        try:
            return AGENT_REGISTRY[agent_type]()
        except Exception as e:
            logger.error(f"Failed to create {agent_type} agent: {e}")
            return None
    else:
        logger.error(f"Unknown agent type: {agent_type}")
        return None

# Example usage and testing functions
async def test_agents():
    """Test all agent types"""
    print("🚀 Testing Mem0 Pydantic AI Agents...\n")

    test_query = "Hello, can you help me?"
    test_user = "test_user_123"

    for agent_type in AGENT_REGISTRY.keys():
        print(f"🤖 Testing {agent_type} agent...")
        try:
            agent = await get_agent(agent_type)
            if agent:
                response = await agent.run_with_memory(test_query, test_user)
                print(f"✅ {agent_type}: {response[:100]}...")
            else:
                print(f"❌ {agent_type}: Failed to create agent")
        except Exception as e:
            print(f"❌ {agent_type}: Error - {e}")

        print()

if __name__ == "__main__":
    # Run tests if executed directly
    asyncio.run(test_agents())