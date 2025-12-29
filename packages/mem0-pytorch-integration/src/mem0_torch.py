"""
Mem0.ai PyTorch Integration with GPU Acceleration
Provides PyTorch-based memory operations with Pydantic AI integration
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import numpy as np
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging

logger = logging.getLogger(__name__)

class MemoryEmbedding(nn.Module):
    """PyTorch model for memory embeddings with GPU acceleration"""

    def __init__(self, embedding_dim: int = 384, hidden_dim: int = 512):
        super().__init__()
        self.embedding_dim = embedding_dim
        self.hidden_dim = hidden_dim

        # Encoder layers
        self.encoder = nn.Sequential(
            nn.Linear(embedding_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.1)
        )

        # Memory attention mechanism
        self.memory_attention = nn.MultiheadAttention(
            embed_dim=hidden_dim,
            num_heads=8,
            dropout=0.1,
            batch_first=True
        )

        # Decoder for memory reconstruction
        self.decoder = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_dim, embedding_dim)
        )

        # Memory importance scorer
        self.importance_scorer = nn.Sequential(
            nn.Linear(hidden_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 1),
            nn.Sigmoid()
        )

    def forward(self, embeddings: torch.Tensor, memory_context: Optional[torch.Tensor] = None) -> Dict[str, torch.Tensor]:
        """Forward pass with memory attention"""
        # Encode embeddings
        encoded = self.encoder(embeddings)

        if memory_context is not None:
            # Apply memory attention
            attended, _ = self.memory_attention(
                encoded.unsqueeze(1),
                memory_context.unsqueeze(1),
                memory_context.unsqueeze(1)
            )
            encoded = encoded + attended.squeeze(1)

        # Decode to reconstruct memory
        reconstructed = self.decoder(encoded)

        # Score memory importance
        importance_scores = self.importance_scorer(encoded)

        return {
            'encoded': encoded,
            'reconstructed': reconstructed,
            'importance_scores': importance_scores
        }

class MemoryDataset(Dataset):
    """PyTorch Dataset for memory data"""

    def __init__(self, memories: List[Dict[str, Any]], embedder):
        self.memories = memories
        self.embedder = embedder

    def __len__(self):
        return len(self.memories)

    def __getitem__(self, idx):
        memory = self.memories[idx]
        text = memory.get('content', '')

        # Generate embedding
        embedding = self.embedder.encode(text, convert_to_tensor=True)

        return {
            'embedding': embedding,
            'metadata': memory.get('metadata', {}),
            'importance': memory.get('importance', 1.0)
        }

class PydanticMemoryRequest(BaseModel):
    """Pydantic model for memory requests"""
    content: str = Field(..., description="Memory content")
    user_id: Optional[str] = Field(None, description="User identifier")
    agent_id: Optional[str] = Field(None, description="Agent identifier")
    app_id: Optional[str] = Field(None, description="Application identifier")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    importance: float = Field(default=1.0, description="Memory importance score")

class PydanticMemorySearch(BaseModel):
    """Pydantic model for memory search"""
    query: str = Field(..., description="Search query")
    user_id: Optional[str] = Field(None, description="User filter")
    limit: int = Field(default=10, description="Maximum results")
    threshold: float = Field(default=0.7, description="Similarity threshold")

class Mem0TorchIntegration:
    """Mem0.ai PyTorch integration with GPU acceleration"""

    def __init__(self, device: Optional[str] = None, embedding_dim: int = 384):
        self.device = self._setup_device(device)
        self.embedding_dim = embedding_dim

        # Initialize PyTorch model
        self.model = MemoryEmbedding(embedding_dim=embedding_dim).to(self.device)

        # Load pre-trained embedder (Sentence Transformers)
        try:
            from sentence_transformers import SentenceTransformer
            self.embedder = SentenceTransformer('all-MiniLM-L6-v2', device=str(self.device))
        except ImportError:
            logger.warning("SentenceTransformers not available, using basic embeddings")
            self.embedder = None

        # Thread pool for async operations
        self.executor = ThreadPoolExecutor(max_workers=4)

        logger.info(f"Mem0TorchIntegration initialized on device: {self.device}")

    def _setup_device(self, device: Optional[str]) -> torch.device:
        """Setup PyTorch device"""
        if device:
            return torch.device(device)
        elif torch.cuda.is_available():
            return torch.device("cuda:0")
        elif torch.backends.mps.is_available():
            return torch.device("mps")
        else:
            return torch.device("cpu")

    async def encode_memory_async(self, content: str) -> torch.Tensor:
        """Asynchronously encode memory content"""
        loop = asyncio.get_event_loop()
        embedding = await loop.run_in_executor(
            self.executor,
            self._encode_text,
            content
        )
        return torch.tensor(embedding, device=self.device)

    def _encode_text(self, text: str) -> np.ndarray:
        """Encode text using embedder"""
        if self.embedder:
            return self.embedder.encode(text, convert_to_numpy=True)
        else:
            # Fallback: simple hash-based encoding
            import hashlib
            hash_obj = hashlib.md5(text.encode())
            hash_bytes = hash_obj.digest()
            embedding = np.frombuffer(hash_bytes, dtype=np.uint8).astype(np.float32)
            # Pad or truncate to embedding_dim
            if len(embedding) < self.embedding_dim:
                embedding = np.pad(embedding, (0, self.embedding_dim - len(embedding)))
            else:
                embedding = embedding[:self.embedding_dim]
            return embedding / 255.0  # Normalize to [0, 1]

    async def add_memory_torch(self, request: PydanticMemoryRequest) -> Dict[str, Any]:
        """Add memory using PyTorch processing"""
        try:
            # Encode content asynchronously
            embedding = await self.encode_memory_async(request.content)

            # Process through PyTorch model
            with torch.no_grad():
                model_output = self.model(embedding.unsqueeze(0))
                importance_score = model_output['importance_scores'].item()

            # Adjust importance based on request
            final_importance = min(request.importance * importance_score, 1.0)

            memory_data = {
                'content': request.content,
                'embedding': embedding.cpu().numpy(),
                'user_id': request.user_id,
                'agent_id': request.agent_id,
                'app_id': request.app_id,
                'metadata': request.metadata,
                'importance': final_importance,
                'created_at': torch.tensor([]).new_tensor([]).detach().cpu().numpy(),  # Placeholder
                'model_processed': True,
                'device_used': str(self.device)
            }

            return {
                'success': True,
                'memory': memory_data,
                'torch_stats': {
                    'device': str(self.device),
                    'importance_score': importance_score,
                    'embedding_shape': embedding.shape,
                    'final_importance': final_importance
                }
            }

        except Exception as e:
            logger.error(f"Error adding memory with PyTorch: {e}")
            return {'success': False, 'error': str(e)}

    async def search_memory_torch(self, request: PydanticMemorySearch) -> Dict[str, Any]:
        """Search memory using PyTorch similarity"""
        try:
            # Encode query
            query_embedding = await self.encode_memory_async(request.query)

            # This would typically search against a vector database
            # For now, return a placeholder response
            return {
                'success': True,
                'query_embedding_shape': query_embedding.shape,
                'device': str(self.device),
                'results': [],  # Would contain actual search results
                'note': 'Full search implementation requires vector database integration'
            }

        except Exception as e:
            logger.error(f"Error searching memory with PyTorch: {e}")
            return {'success': False, 'error': str(e)}

    async def batch_process_memories(self, requests: List[PydanticMemoryRequest]) -> List[Dict[str, Any]]:
        """Batch process multiple memory requests"""
        tasks = [self.add_memory_torch(request) for request in requests]
        results = await asyncio.gather(*tasks)
        return results

    def get_torch_stats(self) -> Dict[str, Any]:
        """Get PyTorch and GPU statistics"""
        stats = {
            'device': str(self.device),
            'cuda_available': torch.cuda.is_available(),
            'mps_available': torch.backends.mps.is_available(),
            'model_parameters': sum(p.numel() for p in self.model.parameters()),
            'model_trainable_parameters': sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        }

        if torch.cuda.is_available():
            stats.update({
                'gpu_name': torch.cuda.get_device_name(0),
                'gpu_memory_allocated': f"{torch.cuda.memory_allocated(0) / 1024**2:.1f} MB",
                'gpu_memory_reserved': f"{torch.cuda.memory_reserved(0) / 1024**2:.1f} MB",
                'gpu_memory_total': f"{torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB"
            })

        return stats

# Global instance
torch_integration = Mem0TorchIntegration()

# FastAPI integration
from fastapi import FastAPI, BackgroundTasks

app = FastAPI(title="Mem0.ai PyTorch Integration", version="1.0.0")

@app.post("/memory/torch/add")
async def add_memory_torch_endpoint(request: PydanticMemoryRequest):
    return await torch_integration.add_memory_torch(request)

@app.post("/memory/torch/search")
async def search_memory_torch_endpoint(request: PydanticMemorySearch):
    return await torch_integration.search_memory_torch(request)

@app.post("/memory/torch/batch")
async def batch_process_endpoint(requests: List[PydanticMemoryRequest]):
    return await torch_integration.batch_process_memories(requests)

@app.get("/torch/stats")
async def get_torch_stats_endpoint():
    return torch_integration.get_torch_stats()

if __name__ == "__main__":
    import uvicorn
    import os

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "3002"))

    logger.info(f"Starting Mem0.ai PyTorch Integration on {host}:{port}")
    uvicorn.run(app, host=host, port=port)