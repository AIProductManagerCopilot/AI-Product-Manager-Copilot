import os
from typing import List, Dict, Any, Optional
from qdrant_client import AsyncQdrantClient, models
from app.core.config import settings
from app.core.exceptions import VectorDimensionMismatchError, VectorSearchError


class VectorService:
    """Manages Qdrant vector operations with automated schema validation and 3072-dim support."""

    def __init__(self, client: Optional[AsyncQdrantClient] = None):
        if client is not None:
            self.client = client
        else:
            api_key = (
                getattr(settings, "qdrant_api_key", None)
                or getattr(settings, "qdrant_key", None)
                or os.getenv("QDRANT_API_KEY", "")
            ) or None

            self.client = AsyncQdrantClient(
                url=settings.qdrant_url,
                api_key=api_key
            )

    async def ensure_collection_exists(self) -> None:
        """Ensures the vector collection is created and configured for 3072-dimensional embeddings."""
        try:
            collections = await self.client.get_collections()
            existing_names = [c.name for c in collections.collections]

            if settings.qdrant_collection not in existing_names:
                await self.client.create_collection(
                    collection_name=settings.qdrant_collection,
                    vectors_config=models.VectorParams(
                        size=settings.embedding_dimension,  # Enforced 3072
                        distance=models.Distance.COSINE
                    )
                )
        except Exception as exc:
            raise VectorSearchError(f"Failed to ensure vector collection state: {str(exc)}") from exc

    async def validate_collection_schema(self) -> None:
        """Validates that the active Qdrant collection vector size matches application settings."""
        try:
            await self.ensure_collection_exists()
            collection_info = await self.client.get_collection(settings.qdrant_collection)
            expected_dim = settings.embedding_dimension
            
            # Extract dimensionality from vector params
            vectors_config = collection_info.config.params.vectors
            if isinstance(vectors_config, models.VectorParams):
                actual_dim = vectors_config.size
            else:
                actual_dim = None

            if actual_dim and actual_dim != expected_dim:
                raise VectorDimensionMismatchError(
                    f"Qdrant collection dimension mismatch: expected={expected_dim}, actual={actual_dim}"
                )
        except Exception as exc:
            if isinstance(exc, VectorDimensionMismatchError):
                raise exc
            raise VectorSearchError(f"Failed to validate collection schema: {str(exc)}") from exc

    async def search_similar_chunks(
        self, 
        query_vector: List[float], 
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """Validates dimension alignment before querying Qdrant vector mesh."""
        if len(query_vector) != settings.embedding_dimension:
            raise VectorDimensionMismatchError(
                f"Query vector dimension mismatch: vector={len(query_vector)}, expected={settings.embedding_dimension}"
            )

        await self.validate_collection_schema()

        try:
            results = await self.client.search(
                collection_name=settings.qdrant_collection,
                query_vector=query_vector,
                limit=top_k
            )

            retrieved = []
            for point in results:
                payload = point.payload or {}
                retrieved.append({
                    "ticket_id": payload.get("ticket_id", str(point.id)),
                    "content": payload.get("text") or payload.get("content", ""),
                    "score": point.score,
                    "metadata": payload
                })

            return retrieved
        except Exception as exc:
            if isinstance(exc, VectorDimensionMismatchError):
                raise exc
            raise VectorSearchError(f"Qdrant vector query failed: {str(exc)}") from exc

    async def upsert_points(self, points: List[models.PointStruct]) -> None:
        """Upserts a set of vector points into the target collection."""
        try:
            await self.ensure_collection_exists()
            await self.client.upsert(
                collection_name=settings.qdrant_collection,
                points=points
            )
        except Exception as exc:
            raise VectorSearchError(f"Failed to upsert points into Qdrant: {str(exc)}") from exc