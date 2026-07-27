# app/ai/vector_store/collections.py
"""Qdrant collection management and payload schema definitions.

Repository-compatible implementation for production review.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PayloadSchemaType,
    FieldCondition,
    Filter,
    MatchValue,
)


class CollectionName(str, Enum):
    PRODUCT_DOCS = "product_documentation"
    USER_FEEDBACK = "user_feedback"
    FEATURE_SPECS = "feature_specifications"


class DocumentChunkPayload(BaseModel):
    """Payload schema for indexed document chunks in Qdrant."""

    doc_id: str = Field(..., description="Unique ID of the parent document")
    chunk_id: str = Field(..., description="Unique ID of the chunk")
    content: str = Field(..., description="Raw text chunk content")
    title: str = Field(..., description="Document title")
    source_type: str = Field(..., description="PRD, User Story, Feedback, Ticket")
    created_at: str = Field(..., description="ISO 8601 timestamp")
    metadata: Dict[str, Any] = Field(default_factory=dict)


class QdrantManager:
    """Manages collection lifecycle, payload indexing, and search in Qdrant."""

    def __init__(self, client: AsyncQdrantClient, vector_size: int = 768):
        self.client = client
        self.vector_size = vector_size

    async def initialize_collections(self) -> None:
        """Create required collections and payload indexes if they do not exist."""
        for collection in CollectionName:
            exists = await self.client.collection_exists(collection_name=collection.value)
            if not exists:
                await self.client.create_collection(
                    collection_name=collection.value,
                    vectors_config=VectorParams(
                        size=self.vector_size,
                        distance=Distance.COSINE,
                    ),
                )
                # Create indexes for metadata filtering
                await self.client.create_payload_index(
                    collection_name=collection.value,
                    field_name="doc_id",
                    field_schema=PayloadSchemaType.KEYWORD,
                )
                await self.client.create_payload_index(
                    collection_name=collection.value,
                    field_name="source_type",
                    field_schema=PayloadSchemaType.KEYWORD,
                )

    async def search_similar_chunks(
        self,
        collection_name: CollectionName,
        query_vector: List[float],
        source_type_filter: Optional[str] = None,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """Retrieve top-k similar chunks with optional metadata filtering."""
        query_filter = None
        if source_type_filter:
            query_filter = Filter(
                must=[
                    FieldCondition(
                        key="source_type",
                        match=MatchValue(value=source_type_filter),
                    )
                ]
            )

        response = await self.client.search(
            collection_name=collection_name.value,
            query_vector=query_vector,
            query_filter=query_filter,
            limit=limit,
        )

        return [
            {
                "score": point.score,
                "payload": point.payload,
            }
            for point in response
        ]