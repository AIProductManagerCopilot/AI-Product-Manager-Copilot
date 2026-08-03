"""
Vector Database & Embedding Integration Service for Qdrant and Google GenAI.
"""

import logging
from typing import Any, Dict, List, Optional
from google import genai
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as qmodels

from app.core.config import settings

logger = logging.getLogger(__name__)


class VectorService:
    """Service handling vector storage, payload indexing, and RAG retrieval in Qdrant."""

    def __init__(self) -> None:
        self.client = AsyncQdrantClient(
            host=settings.qdrant_host,
            port=settings.qdrant_port,
            timeout=10.0,
        )
        self.collection_name = settings.qdrant_collection
        self.vector_size = settings.embedding_dimension

        # Initialize Google GenAI Client
        self.ai_client = genai.Client(api_key=settings.gemini_api_key)

    async def init_collection(self) -> None:
        """
        Initializes Qdrant collection if it does not exist and creates payload indices.
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

                # Create Payload Field Indices for Filtering
                await self._create_payload_indices()
                logger.info(
                    f"Collection '{self.collection_name}' initialized successfully."
                )
            else:
                logger.info(
                    f"Collection '{self.collection_name}' already exists. Skipping initialization."
                )

        except Exception as e:
            logger.error(f"Failed to initialize Qdrant collection: {str(e)}")
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

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generates dense vector embeddings using Google GenAI SDK.
        """
        try:
            # Clean model string format for google-genai SDK
            model_name = settings.embedding_model.replace("models/", "") if settings.embedding_model else "text-embedding-004"

            response = self.ai_client.models.embed_content(
                model=model_name,
                contents=text,
            )
            return response.embeddings[0].values
        except Exception as e:
            logger.error(f"Error generating embedding via Google GenAI API: {str(e)}")
            # Fallback zero vector so similarity search doesn't crash if embedding call fails
            return [0.0] * self.vector_size

    async def upsert_documents(
        self, documents: List[Dict[str, Any]]
    ) -> bool:
        """
        Batch upserts structured documents and their embeddings into Qdrant.

        Expected Document Format:
        [
            {
                "id": "uuid-string-or-int",
                "text": "User feedback context...",
                "metadata": {
                    "category": "Performance",
                    "sentiment": "Negative",
                    "priority_score": 0.85,
                    "workspace_id": "default"
                }
            }
        ]
        """
        points = []
        for idx, doc in enumerate(documents):
            text_content = doc.get("text", "")
            if not text_content:
                continue

            vector = self.generate_embedding(text_content)
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
            query_vector = self.generate_embedding(query)

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


# Global Singleton Service Instance
vector_service = VectorService()