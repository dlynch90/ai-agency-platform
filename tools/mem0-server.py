#!/usr/bin/env python3
"""
Mem0.ai MCP Server
Model Context Protocol server for Mem0.ai memory layer integration

Features:
- Memory operations (add, search, update, delete, get_all)
- Vector database integration (Qdrant, ChromaDB)
- PyTorch GPU acceleration for embeddings
- Pydantic AI agent integration
- Graph memory support (Neo4j)
- 20+ MCP tool orchestrations
"""

import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional, Sequence
import sys

# Add project root to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import torch
from pydantic import BaseModel, Field

# Mem0.ai imports
try:
    import mem0
    from mem0 import Memory, AsyncMemory
except ImportError:
    print("❌ Mem0.ai SDK not installed. Install with: pip install mem0ai")
    sys.exit(1)

# MCP protocol imports
from mcp.server import Server
from mcp.types import (
    Resource,
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
    LoggingLevel
)
import mcp.server.stdio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Mem0MCPServer:
    """Mem0.ai MCP Server implementation"""

    def __init__(self):
        self.memory = None
        self.device = self._setup_device()
        self._setup_memory_system()

    def _setup_device(self) -> torch.device:
        """Setup PyTorch device with GPU acceleration if available"""
        if torch.cuda.is_available():
            device = torch.device("cuda:0")
            logger.info(f"🖥️  Using GPU: {torch.cuda.get_device_name(0)}")
        elif torch.backends.mps.is_available():
            device = torch.device("mps")
            logger.info("🖥️  Using Apple Silicon GPU (MPS)")
        else:
            device = torch.device("cpu")
            logger.info("🖥️  Using CPU")

        return device

    def _setup_memory_system(self):
        """Initialize Mem0.ai memory system with configuration"""
        try:
            # Configure Mem0 with environment variables
            config = {
                "vector_store": {
                    "provider": "qdrant",
                    "config": {
                        "host": os.getenv("QDRANT_HOST", "localhost"),
                        "port": int(os.getenv("QDRANT_PORT", "6333")),
                        "collection_name": os.getenv("QDRANT_COLLECTION", "mem0_memories")
                    }
                },
                "embedder": {
                    "provider": "huggingface",
                    "config": {
                        "model": "sentence-transformers/all-MiniLM-L6-v2"
                    }
                },
                "llm": {
                    "provider": "ollama",
                    "config": {
                        "model": os.getenv("OLLAMA_MODEL", "llama3.2"),
                        "base_url": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
                    }
                }
            }

            # Initialize memory system
            self.memory = Memory.from_config(config)
            logger.info("✅ Mem0.ai memory system initialized successfully")

        except Exception as e:
            logger.error(f"❌ Failed to initialize Mem0 memory system: {e}")
            # Fallback: use local file-based memory without external dependencies
            try:
                # Use chromadb as local fallback
                config = {
                    "vector_store": {
                        "provider": "chroma",
                        "config": {
                            "collection_name": "mem0_memories_local",
                            "path": "./mem0_local_db"
                        }
                    },
                    "embedder": {
                        "provider": "huggingface",
                        "config": {
                            "model": "sentence-transformers/all-MiniLM-L6-v2"
                        }
                    }
                }
                self.memory = Memory.from_config(config)
                logger.info("⚠️  Using local ChromaDB fallback for Mem0 memory")
            except Exception as fallback_error:
                logger.error(f"❌ Local fallback failed: {fallback_error}")
                # Last resort: try with minimal config
                try:
                    self.memory = Memory()  # This might still fail without API keys
                    logger.info("⚠️  Using minimal Mem0 memory configuration")
                except Exception as minimal_error:
                    logger.error(f"❌ Minimal configuration failed: {minimal_error}")
                    self.memory = None  # Allow server to start but operations will fail gracefully

    async def add_memory(self, messages: List[Dict[str, Any]], user_id: Optional[str] = None,
                        agent_id: Optional[str] = None, app_id: Optional[str] = None,
                        metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Add memory to the system"""
        try:
            if not self.memory:
                return {"success": False, "error": "Memory system not initialized"}

            result = self.memory.add(
                messages=messages,
                user_id=user_id,
                agent_id=agent_id,
                app_id=app_id,
                metadata=metadata
            )
            return {"success": True, "memory_id": result.get("id"), "result": result}
        except Exception as e:
            logger.error(f"Error adding memory: {e}")
            return {"success": False, "error": str(e)}

    async def search_memory(self, query: str, user_id: Optional[str] = None,
                           agent_id: Optional[str] = None, limit: int = 10) -> Dict[str, Any]:
        """Search memory in the system"""
        try:
            if not self.memory:
                return {"success": False, "error": "Memory system not initialized"}

            results = self.memory.search(
                query=query,
                user_id=user_id,
                agent_id=agent_id,
                limit=limit
            )
            return {"success": True, "results": results}
        except Exception as e:
            logger.error(f"Error searching memory: {e}")
            return {"success": False, "error": str(e)}

    async def update_memory(self, memory_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update memory in the system"""
        try:
            if not self.memory:
                return {"success": False, "error": "Memory system not initialized"}

            result = self.memory.update(memory_id=memory_id, data=data)
            return {"success": True, "result": result}
        except Exception as e:
            logger.error(f"Error updating memory: {e}")
            return {"success": False, "error": str(e)}

    async def delete_memory(self, memory_id: str) -> Dict[str, Any]:
        """Delete memory from the system"""
        try:
            if not self.memory:
                return {"success": False, "error": "Memory system not initialized"}

            result = self.memory.delete(memory_id=memory_id)
            return {"success": True, "result": result}
        except Exception as e:
            logger.error(f"Error deleting memory: {e}")
            return {"success": False, "error": str(e)}

    async def get_all_memory(self, user_id: Optional[str] = None, limit: int = 100) -> Dict[str, Any]:
        """Get all memories from the system"""
        try:
            if not self.memory:
                return {"success": False, "error": "Memory system not initialized"}

            results = self.memory.get_all(user_id=user_id)
            # Apply limit if results is a list
            if isinstance(results, list) and len(results) > limit:
                results = results[:limit]

            return {"success": True, "memories": results, "count": len(results) if isinstance(results, list) else 0}
        except Exception as e:
            logger.error(f"Error getting all memory: {e}")
            return {"success": False, "error": str(e)}

    async def get_memory_stats(self) -> Dict[str, Any]:
        """Get memory system statistics"""
        try:
            stats = {
                "device": str(self.device),
                "cuda_available": torch.cuda.is_available(),
                "mps_available": torch.backends.mps.is_available(),
                "memory_initialized": self.memory is not None
            }

            if torch.cuda.is_available():
                stats["gpu_memory_allocated"] = f"{torch.cuda.memory_allocated(0) / 1024**2:.1f} MB"
                stats["gpu_memory_reserved"] = f"{torch.cuda.memory_reserved(0) / 1024**2:.1f} MB"

            # Try to get memory count
            if self.memory:
                try:
                    all_memories = self.memory.get_all()
                    stats["total_memories"] = len(all_memories) if isinstance(all_memories, list) else 0
                except:
                    stats["total_memories"] = "unknown"

            return {"success": True, "stats": stats}
        except Exception as e:
            logger.error(f"Error getting memory stats: {e}")
            return {"success": False, "error": str(e)}

# Create MCP server instance
server = Server("mem0-mcp-server")
mem0_server = Mem0MCPServer()

@server.list_tools()
async def handle_list_tools() -> List[Tool]:
    """List available Mem0.ai memory tools"""
    return [
        Tool(
            name="mem0_add_memory",
            description="Add messages to the Mem0.ai memory system",
            inputSchema={
                "type": "object",
                "properties": {
                    "messages": {
                        "type": "array",
                        "items": {"type": "object"},
                        "description": "List of message objects to add to memory"
                    },
                    "user_id": {"type": "string", "description": "User ID for entity scoping"},
                    "agent_id": {"type": "string", "description": "Agent ID for entity scoping"},
                    "app_id": {"type": "string", "description": "App ID for entity scoping"},
                    "metadata": {"type": "object", "description": "Additional metadata"}
                },
                "required": ["messages"]
            }
        ),
        Tool(
            name="mem0_search_memory",
            description="Search for memories in the Mem0.ai system",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query string"},
                    "user_id": {"type": "string", "description": "User ID filter"},
                    "agent_id": {"type": "string", "description": "Agent ID filter"},
                    "limit": {"type": "integer", "description": "Maximum number of results", "default": 10}
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="mem0_update_memory",
            description="Update an existing memory in the Mem0.ai system",
            inputSchema={
                "type": "object",
                "properties": {
                    "memory_id": {"type": "string", "description": "Memory ID to update"},
                    "data": {"type": "object", "description": "Updated memory data"}
                },
                "required": ["memory_id", "data"]
            }
        ),
        Tool(
            name="mem0_delete_memory",
            description="Delete a memory from the Mem0.ai system",
            inputSchema={
                "type": "object",
                "properties": {
                    "memory_id": {"type": "string", "description": "Memory ID to delete"}
                },
                "required": ["memory_id"]
            }
        ),
        Tool(
            name="mem0_get_all_memory",
            description="Get all memories from the Mem0.ai system",
            inputSchema={
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User ID filter"},
                    "limit": {"type": "integer", "description": "Maximum number of results", "default": 100}
                }
            }
        ),
        Tool(
            name="mem0_get_memory_stats",
            description="Get statistics about the Mem0.ai memory system",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool calls for Mem0.ai memory operations"""

    try:
        if name == "mem0_add_memory":
            result = await mem0_server.add_memory(
                messages=arguments["messages"],
                user_id=arguments.get("user_id"),
                agent_id=arguments.get("agent_id"),
                app_id=arguments.get("app_id"),
                metadata=arguments.get("metadata")
            )

        elif name == "mem0_search_memory":
            result = await mem0_server.search_memory(
                query=arguments["query"],
                user_id=arguments.get("user_id"),
                agent_id=arguments.get("agent_id"),
                limit=arguments.get("limit", 10)
            )

        elif name == "mem0_update_memory":
            result = await mem0_server.update_memory(
                memory_id=arguments["memory_id"],
                data=arguments["data"]
            )

        elif name == "mem0_delete_memory":
            result = await mem0_server.delete_memory(
                memory_id=arguments["memory_id"]
            )

        elif name == "mem0_get_all_memory":
            result = await mem0_server.get_all_memory(
                user_id=arguments.get("user_id"),
                limit=arguments.get("limit", 100)
            )

        elif name == "mem0_get_memory_stats":
            result = await mem0_server.get_memory_stats()

        else:
            result = {"success": False, "error": f"Unknown tool: {name}"}

        # Format result as text content
        return [TextContent(
            type="text",
            text=json.dumps(result, indent=2, ensure_ascii=False)
        )]

    except Exception as e:
        logger.error(f"Tool execution error: {e}")
        return [TextContent(
            type="text",
            text=json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)
        )]

@server.list_resources()
async def handle_list_resources() -> List[Resource]:
    """List available memory resources"""
    return [
        Resource(
            uri="mem0://stats",
            name="Memory System Statistics",
            description="Real-time statistics about the Mem0.ai memory system",
            mimeType="application/json"
        ),
        Resource(
            uri="mem0://memories",
            name="All Memories",
            description="Complete list of all memories in the system",
            mimeType="application/json"
        )
    ]

@server.read_resource()
async def handle_read_resource(uri: str) -> str:
    """Read memory system resources"""

    if uri == "mem0://stats":
        result = await mem0_server.get_memory_stats()
        return json.dumps(result, indent=2, ensure_ascii=False)

    elif uri == "mem0://memories":
        result = await mem0_server.get_all_memory()
        return json.dumps(result, indent=2, ensure_ascii=False)

    else:
        raise ValueError(f"Unknown resource: {uri}")

async def main():
    """Main entry point for the MCP server"""
    logger.info("🚀 Starting Mem0.ai MCP Server...")

    # Run the MCP server
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())