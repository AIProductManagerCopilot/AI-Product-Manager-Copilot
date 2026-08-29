"""
Vector Database & Embedding Integration Service for Qdrant and Google GenAI.
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional
from google import genai
from google.genai import types
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as qmodels

from app.core.config import settings

logger = logging.getLogger(__name__)


class VectorService:
    """Service handling vector storage, payload indexing, and RAG retrieval in Qdrant."""

    def __init__(self) -> None:
        # Dynamically resolve Qdrant endpoint parameters and credentials
        qdrant_url = getattr(settings, "qdrant_url", None) or getattr(settings, "QDRANT_URL", None)
        qdrant_api_key = getattr(settings, "qdrant_api_key", None) or getattr(settings, "QDRANT_API_KEY", None)

        if qdrant_url and str(qdrant_url).startswith("http"):
            self.client = AsyncQdrantClient(
                url=str(qdrant_url),
                api_key=qdrant_api_key,
                timeout=10.0,
            )
        else:
            host = str(settings.qdrant_host).replace("https://", "").replace("http://", "")
            self.client = AsyncQdrantClient(
                host=host,
                port=settings.qdrant_port,
                api_key=qdrant_api_key,
                timeout=10.0,
            )

        self.collection_name = settings.qdrant_collection
        self.memory_collection_name = getattr(settings, "qdrant_memory_collection", "user_memory")
        self.vector_size = settings.embedding_dimension

        # Initialize Google GenAI Client
        self.ai_client = genai.Client(api_key=settings.gemini_api_key)

    async def init_collection(self) -> None:
        """
        Initializes Qdrant domain & memory collections if they do not exist and creates payload indices.
        """
        try:
            collections_response = await self.client.get_collections()
            existing_collections = [
                col.name for col in collections_response.collections
            ]

            if self.collection_name not in existing_collections:
                logger.info(
                    f"Creating Qdrant collection '{self.collection_name}' with dimension {self.vector_size}"
                )
                await self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=qmodels.VectorParams(
                        size=self.vector_size,
                        distance=qmodels.Distance.COSINE,
                    ),
                )
                await self._create_payload_indices()

            if self.memory_collection_name not in existing_collections:
                logger.info(
                    f"Creating Qdrant memory collection '{self.memory_collection_name}' with dimension {self.vector_size}"
                )
                await self.client.create_collection(
                    collection_name=self.memory_collection_name,
                    vectors_config=qmodels.VectorParams(
                        size=self.vector_size,
                        distance=qmodels.Distance.COSINE,
                    ),
                )
                await self._create_memory_payload_indices()

            logger.info("Qdrant collections initialized successfully.")

        except Exception as e:
            logger.error(f"Failed to initialize Qdrant collections: {str(e)}")
            raise e

    async def _create_payload_indices(self) -> None:
        """Creates payload indices for optimized metadata filtering."""
        index_fields = [
            ("category", qmodels.PayloadSchemaType.KEYWORD),
            ("sentiment", qmodels.PayloadSchemaType.KEYWORD),
            ("workspace_id", qmodels.PayloadSchemaType.KEYWORD),
            ("priority_score", qmodels.PayloadSchemaType.FLOAT),
        ]

        for field_name, field_type in index_fields:
            await self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name=field_name,
                field_schema=field_type,
            )

    async def _create_memory_payload_indices(self) -> None:
        """Creates payload indices for long-term memory collection."""
        index_fields = [
            ("user_id", qmodels.PayloadSchemaType.KEYWORD),
            ("workspace_id", qmodels.PayloadSchemaType.KEYWORD),
            ("fact_type", qmodels.PayloadSchemaType.KEYWORD),
            ("superseded", qmodels.PayloadSchemaType.KEYWORD),
        ]

        for field_name, field_type in index_fields:
            await self.client.create_payload_index(
                collection_name=self.memory_collection_name,
                field_name=field_name,
                field_schema=field_type,
            )

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generates dense vector embeddings using Google GenAI SDK enforced to target dimensions asynchronously.
        """
        return await asyncio.to_thread(self._generate_embedding_sync, text)

    def _generate_embedding_sync(self, text: str) -> List[float]:
        try:
            # Clean model string format for google-genai SDK
            model_name = (
                settings.embedding_model.replace("models/", "")
                if settings.embedding_model
                else "text-embedding-004"
            )

            # Pass output_dimensionality=768 so the vector matches the Qdrant schema
            response = self.ai_client.models.embed_content(
                model=model_name,
                contents=text,
                config=types.EmbedContentConfig(
                    output_dimensionality=self.vector_size
                ),
            )
            return response.embeddings[0].values
        except Exception as e:
            logger.error(f"Error generating embedding via Google GenAI API: {str(e)}")
            # Fallback zero vector matching target dimension so similarity search does not crash
            return [0.0] * self.vector_size

    async def upsert_documents(
        self, documents: List[Dict[str, Any]]
    ) -> bool:
        """
        Batch upserts structured documents and their embeddings into Qdrant.
        """
        points = []
        for idx, doc in enumerate(documents):
            text_content = doc.get("text", "")
            if not text_content:
                continue

            vector = await self.generate_embedding(text_content)
            point_id = doc.get("id", idx)
            payload = doc.get("metadata", {})
            payload["text_content"] = text_content

            points.append(
                qmodels.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload,
                )
            )

        if points:
            await self.client.upsert(
                collection_name=self.collection_name,
                points=points,
            )
            logger.info(f"Successfully upserted {len(points)} vector points.")
            return True
        return False

    async def search_similar_context(
        self,
        query: str,
        limit: int = 5,
        category_filter: Optional[str] = None,
        min_priority_score: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """
        Executes semantic vector similarity search with optional payload filters.
        """
        try:
            query_vector = await self.generate_embedding(query)

            must_conditions = []
            if category_filter:
                must_conditions.append(
                    qmodels.FieldCondition(
                        key="category",
                        match=qmodels.MatchValue(value=category_filter),
                    )
                )

            if min_priority_score is not None:
                must_conditions.append(
                    qmodels.FieldCondition(
                        key="priority_score",
                        range=qmodels.Range(gte=min_priority_score),
                    )
                )

            query_filter = (
                qmodels.Filter(must=must_conditions)
                if must_conditions
                else None
            )

            search_results = await self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                query_filter=query_filter,
                limit=limit,
            )

            retrieved_docs = []
            for hit in search_results:
                retrieved_docs.append(
                    {
                        "score": hit.score,
                        "text": hit.payload.get("text_content", ""),
                        "metadata": hit.payload,
                    }
                )

            return retrieved_docs

        except Exception as e:
            logger.error(f"Error executing vector similarity search: {str(e)}")
            return []

    async def search_similar_chunks(
        self,
        query_vector: List[float],
        top_k: int = 5,
        min_score: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """Searches main domain collection by vector with optional min_score threshold."""
        try:
            search_results = await self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=top_k,
            )

            retrieved_docs = []
            for hit in search_results:
                if min_score is not None and hit.score < min_score:
                    continue
                payload = hit.payload or {}
                chunk_text = (
                    payload.get("chunk_text")
                    or payload.get("text_content")
                    or payload.get("text")
                    or payload.get("content")
                    or payload.get("feedback_text")
                    or ""
                )
                chunk_id = (
                    payload.get("chunk_id")
                    or payload.get("feedback_id")
                    or payload.get("ticket_id")
                    or str(hit.id)
                )

                retrieved_docs.append(
                    {
                        "ticket_id": chunk_id,
                        "chunk_id": chunk_id,
                        "content": chunk_text,
                        "text": chunk_text,
                        "score": hit.score,
                        "payload": payload,
                        "metadata": payload,
                    }
                )

            return retrieved_docs
        except Exception as e:
            logger.error(f"Error executing search_similar_chunks: {str(e)}")
            return []

    # -------------------------------------------------------------------------
    # LONG-TERM USER MEMORY QDRANT OPERATIONS
    # -------------------------------------------------------------------------

    async def upsert_memory_point(
        self,
        memory_id: str,
        fact_text: str,
        user_id: str,
        workspace_id: Optional[str] = None,
        fact_type: str = "project_fact",
        superseded: bool = False,
    ) -> bool:
        """Upserts a long-term user memory point into Qdrant 'user_memory' collection."""
        try:
            vector = await self.generate_embedding(fact_text)
            payload = {
                "memory_id": memory_id,
                "fact_text": fact_text,
                "user_id": user_id,
                "workspace_id": workspace_id or "",
                "fact_type": fact_type,
                "superseded": str(superseded).lower(),
            }

            point = qmodels.PointStruct(
                id=memory_id,
                vector=vector,
                payload=payload,
            )

            await self.client.upsert(
                collection_name=self.memory_collection_name,
                points=[point],
            )
            logger.info(f"Upserted user memory point '{memory_id}' into Qdrant collection '{self.memory_collection_name}'.")
            return True
        except Exception as e:
            logger.error(f"Failed to upsert memory point to Qdrant: {str(e)}")
            return False

    async def search_user_memories(
        self,
        user_id: str,
        query: str,
        workspace_id: Optional[str] = None,
        limit: int = 5,
        min_score: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """
        Searches 'user_memory' collection filtered strictly by user_id, workspace_id, and superseded='false'.
        """
        try:
            query_vector = await self.generate_embedding(query)

            must_conditions = [
                qmodels.FieldCondition(
                    key="user_id",
                    match=qmodels.MatchValue(value=str(user_id)),
                ),
                qmodels.FieldCondition(
                    key="superseded",
                    match=qmodels.MatchValue(value="false"),
                ),
            ]

            if workspace_id:
                must_conditions.append(
                    qmodels.FieldCondition(
                        key="workspace_id",
                        match=qmodels.MatchValue(value=str(workspace_id)),
                    )
                )

            query_filter = qmodels.Filter(must=must_conditions)

            search_results = await self.client.search(
                collection_name=self.memory_collection_name,
                query_vector=query_vector,
                query_filter=query_filter,
                limit=limit,
            )

            retrieved_memories = []
            for hit in search_results:
                if hit.score >= min_score:
                    retrieved_memories.append(
                        {
                            "score": hit.score,
                            "memory_id": hit.payload.get("memory_id", str(hit.id)),
                            "fact": hit.payload.get("fact_text", ""),
                            "fact_type": hit.payload.get("fact_type", "project_fact"),
                            "metadata": hit.payload,
                        }
                    )

            return retrieved_memories
        except Exception as e:
            logger.error(f"Error searching user memory in Qdrant: {str(e)}")
            return []

    async def delete_memory_point(self, memory_id: str) -> bool:
        """Deletes a memory point from Qdrant by ID."""
        try:
            await self.client.delete(
                collection_name=self.memory_collection_name,
                points_selector=qmodels.PointIdsList(points=[memory_id]),
            )
            logger.info(f"Deleted memory point '{memory_id}' from Qdrant.")
            return True
        except Exception as e:
            logger.error(f"Failed to delete memory point from Qdrant: {str(e)}")
            return False


# Global Singleton Service Instance
vector_service = VectorService()