# backend/app/ai/rag/retriever.py
"""RAG retrieval logic, embedding generator, and document chunking pipelines.

Repository-compatible implementation for production review.
"""

from typing import Any, Dict, List, Optional
from google import genai
from pydantic import BaseModel, Field
from app.ai.vector_store.collections import CollectionName, QdrantManager


class TextChunk(BaseModel):
    """Model representing a text chunk ready for vector indexing."""

    chunk_id: str
    doc_id: str
    content: str
    source_type: str
    title: str


class HybridRetriever:
    """Orchestrates embedding generation via Gemini and retrieval via Qdrant."""

    def __init__(
        self,
        gemini_client: genai.Client,
        qdrant_manager: QdrantManager,
        embedding_model: str = "text-embedding-004",
    ):
        self.gemini_client = gemini_client
        self.qdrant_manager = qdrant_manager
        self.embedding_model = embedding_model

    async def generate_embedding(self, text: str) -> List[float]:
        """Generate vector embedding for a query or text chunk."""
        response = self.gemini_client.models.embed_content(
            model=self.embedding_model,
            contents=text,
        )
        return response.embedding.values

    async def retrieve_context_chunks(
        self,
        query: str,
        collection_name: CollectionName = CollectionName.PRODUCT_DOCS,
        source_type_filter: Optional[str] = None,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Embed query and search vector store for matching context chunks."""
        query_vector = await self.generate_embedding(query)

        results = await self.qdrant_manager.search_similar_chunks(
            collection_name=collection_name,
            query_vector=query_vector,
            source_type_filter=source_type_filter,
            limit=top_k,
        )
        return results