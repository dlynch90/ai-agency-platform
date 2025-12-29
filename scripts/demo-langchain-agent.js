#!/usr/bin/env node

// Demo script showing LangChain agent integration with Mem0 tools
import { execSync } from 'child_process';
import fs from 'fs';

console.log('=== LANGCHAIN AGENT + MEM0 TOOLS DEMO ===');

// Create AI agent integration script
const agentScript = `
import os
from typing import List, Dict, Any, Optional
from langchain_core.tools import StructuredTool
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from pydantic import BaseModel, Field

# Mock LangChain components for demo
class MockChatOpenAI:
    def __init__(self, model="gpt-4"):
        self.model = model

    def invoke(self, messages):
        # Simple mock responses based on tool usage
        last_message = messages[-1]['content'] if messages else ""

        if 'remember' in last_message.lower() or 'save' in last_message.lower():
            return type('Response', (), {'content': "I'll save that information for you!"})()
        elif 'what do you know' in last_message.lower() or 'tell me about' in last_message.lower():
            return type('Response', (), {'content': "Based on your saved memories, I can help with that."})()
        else:
            return type('Response', (), {'content': f"I understand you said: {last_message[:50]}..."})()

class MockChatPromptTemplate:
    @classmethod
    def from_messages(cls, messages):
        return cls()

    def __or__(self, other):
        return other

class MockMessagesPlaceholder:
    def __init__(self, variable_name):
        self.variable_name = variable_name

# Import tools from the debug script
# Note: In a real implementation, these would be imported from a separate module

# Pydantic models for tool inputs
class Message(BaseModel):
    role: str = Field(description="Role of the message sender (user or assistant)")
    content: str = Field(description="Content of the message")

class AddMemoryInput(BaseModel):
    messages: List[Message] = Field(description="List of messages to add to memory")
    user_id: str = Field(description="ID of the user associated with these messages")
    metadata: Optional[Dict[str, Any]] = Field(description="Additional metadata for the messages", default=None)

class SearchMemoryInput(BaseModel):
    query: str = Field(description="The search query string")
    filters: Dict[str, Any] = Field(description="Filters to apply to the search")

class GetAllMemoryInput(BaseModel):
    filters: Dict[str, Any] = Field(description="Filters to apply to the retrieval")
    page: Optional[int] = Field(description="Page number for pagination", default=1)
    page_size: Optional[int] = Field(description="Number of items per page", default=50)

# Mock tool implementations (would use real Mem0 in production)
def add_memory_func(messages: List[Message], user_id: str, metadata: Optional[Dict[str, Any]] = None) -> Any:
    print(f"🧠 Agent using add_memory tool for user: {user_id}")
    return {
        "results": [
            {"memory": f"Stored: {msg.content[:30]}...", "event": "ADD"}
            for msg in messages
        ]
    }

def search_memory_func(query: str, filters: Dict[str, Any]) -> Any:
    print(f"🔍 Agent using search_memory tool with query: '{query}'")
    return {
        "results": [
            {
                "id": "mem-123",
                "memory": f"Found memory related to: {query}",
                "user_id": filters.get("user_id", "unknown"),
                "score": 0.92
            }
        ]
    }

def get_all_memory_func(filters: Dict[str, Any], page: int = 1, page_size: int = 50) -> Any:
    print(f"📋 Agent using get_all_memory tool")
    return {
        "count": 3,
        "results": [
            {"id": "mem-1", "memory": "User preferences", "user_id": filters.get("user_id")},
            {"id": "mem-2", "memory": "Past conversations", "user_id": filters.get("user_id")},
            {"id": "mem-3", "memory": "Important facts", "user_id": filters.get("user_id")}
        ]
    }

# Create LangChain tools
add_tool = StructuredTool(
    name="add_memory",
    description="Add new messages to memory with associated metadata",
    func=add_memory_func,
    args_schema=AddMemoryInput
)

search_tool = StructuredTool(
    name="search_memory",
    description="Search through memories with a query and filters",
    func=search_memory_func,
    args_schema=SearchMemoryInput
)

get_all_tool = StructuredTool(
    name="get_all_memory",
    description="Retrieve all memories matching specified filters",
    func=get_all_memory_func,
    args_schema=GetAllMemoryInput
)

# AI Agent implementation
class Mem0EnabledAgent:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.llm = MockChatOpenAI()
        self.tools = [add_tool, search_tool, get_all_tool]
        self.conversation_history = []

    def should_use_tool(self, user_input: str) -> Optional[StructuredTool]:
        """Simple logic to decide which tool to use"""
        input_lower = user_input.lower()

        if any(word in input_lower for word in ['remember', 'save', 'store', 'note']):
            return add_tool
        elif any(word in input_lower for word in ['what do you know', 'tell me about', 'search', 'find']):
            return search_tool
        elif any(word in input_lower for word in ['show all', 'list all', 'get all']):
            return get_all_tool

        return None

    def process_with_tool(self, tool: StructuredTool, user_input: str):
        """Process user input using the appropriate tool"""
        if tool == add_tool:
            # Convert user input to message format
            messages = [{"role": "user", "content": user_input}]
            return tool.invoke({
                "messages": messages,
                "user_id": self.user_id,
                "metadata": {"source": "conversation"}
            })
        elif tool == search_tool:
            # Extract search query
            query = user_input.replace("what do you know about", "").replace("tell me about", "").strip()
            return tool.invoke({
                "query": query,
                "filters": {"user_id": self.user_id}
            })
        elif tool == get_all_tool:
            return tool.invoke({
                "filters": {"user_id": self.user_id},
                "page": 1,
                "page_size": 10
            })

        return None

    def chat(self, user_input: str) -> str:
        """Main chat method with tool integration"""
        print(f"\\n👤 User: {user_input}")

        # Check if we should use a tool
        tool_to_use = self.should_use_tool(user_input)

        if tool_to_use:
            print(f"🤖 Agent: Using {tool_to_use.name} tool...")
            tool_result = self.process_with_tool(tool_to_use, user_input)
            response = f"Tool executed successfully. Result: {tool_result}"
        else:
            # Regular LLM response
            messages = [{"role": "user", "content": user_input}]
            llm_response = self.llm.invoke(messages)
            response = llm_response.content

        # Store conversation in memory
        conversation_messages = [
            {"role": "user", "content": user_input},
            {"role": "assistant", "content": response}
        ]

        memory_result = add_tool.invoke({
            "messages": conversation_messages,
            "user_id": self.user_id,
            "metadata": {"type": "conversation"}
        })

        print(f"🤖 Agent: {response}")
        print(f"💾 Memory: Stored conversation (tool result: {len(memory_result.get('results', []))} items)")

        return response

# Demo the agent
print("🎯 Mem0-Enabled AI Agent Demo")
print("=" * 50)
print("This agent can remember information and retrieve it using Mem0 tools!")

agent = Mem0EnabledAgent("demo-user")

# Demo interactions
demo_inputs = [
    "Remember that I love vegetarian food and hiking",
    "What do you know about my food preferences?",
    "Tell me about my hobbies",
    "Show me all my stored memories"
]

for user_input in demo_inputs:
    agent.chat(user_input)
    print()

print("✅ Agent demo completed!")
print("\\n🔧 Key Features Demonstrated:")
print("• Tool selection based on user intent")
print("• Memory storage with metadata")
print("• Memory retrieval with filters")
print("• Conversation persistence")
`;

// Write and execute the demo script
const demoFile = '/tmp/langchain-agent-demo.py';
fs.writeFileSync(demoFile, agentScript);

console.log('Running LangChain agent demo...');
try {
  execSync(`${process.env.VIRTUAL_ENV ? process.env.VIRTUAL_ENV + '/bin/python3' : 'python3'} ${demoFile}`, {
    stdio: 'inherit',
    timeout: 30000
  });
  console.log('✅ LangChain agent demo completed successfully');
} catch (error) {
  console.log('❌ LangChain agent demo failed:', error.message);
}

// Clean up
try {
  fs.unlinkSync(demoFile);
} catch (e) {
  // Ignore cleanup errors
}

console.log('\n=== LANGCHAIN AGENT INTEGRATION SUMMARY ===');
console.log('✅ Agent can intelligently select tools based on user intent');
console.log('✅ Memory operations integrated into conversation flow');
console.log('✅ Structured tool inputs with Pydantic validation');
console.log('✅ Mock implementations allow testing without API keys');
console.log('📝 Production: Replace mock implementations with real Mem0 client');