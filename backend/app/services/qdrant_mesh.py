import os
import asyncio
from typing import List
import structlog
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from qdrant_client.http.exceptions import UnexpectedResponse

from app.services.schemas import VectorPayloadModel, RAGContextSnippet, RAGContextResponse

logger = structlog.get_logger(__name__)

class QdrantVectorMeshClient:
    def __init__(self):
        self.url = os.environ.get("QDRANT_URL", "./qdrant_db")
        self.collection_name = os.environ.get("QDRANT_COLLECTION", "product_context")
        self.api_key = os.environ.get("QDRANT_API_KEY")
        self.allow_init = os.environ.get("ALLOW_QDRANT_INIT", "true").lower() == "true"
        
        # Updated dimension constraint to match Gemini gemini-embedding-001 model output
        self.target_dimension = 3072  
        
        # Handle in-memory fallback, remote HTTP, and local directory paths explicitly
        if self.url == ":memory:":
            logger.info("Initializing in-memory Qdrant Client instance")
            self.client = QdrantClient(location=":memory:")
            self.allow_init = True
        elif self.url.startswith("http://") or self.url.startswith("https://"):
            logger.info("Connecting to remote Qdrant cluster instance", url=self.url)
            self.client = QdrantClient(url=self.url, api_key=self.api_key, timeout=10.0)
        else:
            logger.info("Connecting to local disk-persisted Qdrant storage", path=self.url)
            self.client = QdrantClient(path=self.url)
            self.allow_init = True
            
        self._ensure_collection_bootstrapped()

    def _ensure_collection_bootstrapped(self) -> None:
        """Idempotent baseline index health and validation operational sequence."""
        log = logger.bind(collection=self.collection_name)
        try:
            exists = self.client.collection_exists(collection_name=self.collection_name)
            if not exists:
                if self.allow_init:
                    log.info("Target vector cluster partition absent. Bootstrapping collection layout.")
                    self.client.create_collection(
                        collection_name=self.collection_name,
                        vectors_config=qmodels.VectorParams(
                            size=self.target_dimension,
                            distance=qmodels.Distance.COSINE
                        )
                    )
                else:
                    raise RuntimeError(f"Qdrant index space cluster '{self.collection_name}' uninitialized.")
            else:
                log.debug("Vector mesh index footprint validation verified successfully")
        except UnexpectedResponse as err:
            log.error("Network initialization communication barrier on vector cluster setup", error=str(err))
            raise

    async def query_semantic_context(
        self, 
        vector: List[float], 
        workspace_id: str, 
        correlation_id: str
    ) -> RAGContextResponse:
        """Executes a tenant-isolated top-K vector query with strict structural validation bounds."""
        log = logger.bind(correlation_id=correlation_id, workspace_id=workspace_id)
        
        if len(vector) != self.target_dimension:
            log.error(
                "Vector write operations barred due to dimension mismatch", 
                engine_dim=len(vector), 
                expected=self.target_dimension
            )
            raise ValueError("Provided semantic search payload dimensions fail layout compatibility rules")

        log.debug("Executing isolated semantic search over vector partition space")
        
        # Scrape data records inside target worker execution thread contexts
        try:
            search_result = await asyncio.to_thread(
                self.client.search,
                collection_name=self.collection_name,
                query_vector=vector,
                query_filter=qmodels.Filter(
                    must=[
                        qmodels.FieldCondition(
                            key="workspace_id",
                            match=qmodels.MatchValue(value=workspace_id)
                        )
                    ]
                ),
                limit=5, # Strict structural Top-5 constraint ceiling
                with_payload=True
            )
            
            snippets = []
            for hit in search_result:
                payload_data = hit.payload or {}
                
                # Map payload safely with fallback for keys populated by seeding scripts
                text_content = payload_data.get("text_chunk") or payload_data.get("text", "")
                
                validated_payload = VectorPayloadModel(
                    text_chunk=text_content,
                    source_id=payload_data.get("source_id", ""),
                    document_id=payload_data.get("document_id", ""),
                    chunk_index=payload_data.get("chunk_index", 0),
                    source_type=payload_data.get("source_type", "ticket"),
                    sentiment=payload_data.get("sentiment", "neutral"),
                    created_at=payload_data.get("created_at", None),
                    workspace_id=payload_data.get("workspace_id", workspace_id)
                )
                
                snippets.append(
                    RAGContextSnippet(
                        text=validated_payload.text_chunk,
                        score=hit.score,
                        payload=validated_payload
                    )
                )
            
            log.info("Vector retrieval execution complete", matched_records=len(snippets))
            return RAGContextResponse(snippets=snippets)
            
        except Exception as exc:
            log.error("Database search operation failed inside Qdrant framework mesh", error=str(exc))
            raise