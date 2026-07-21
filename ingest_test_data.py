import sys
from pathlib import Path
import os
import uuid

# Push backend folder onto python path
sys.path.append(str(Path(__file__).parent / "backend"))

import asyncio
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
from app.services.ai_engine import GeminiOrchestrationEngine

async def main():
    print("🌱 Seeding APM & Support Ticket vectors into Qdrant...")
    
    collection_name = os.getenv("QDRANT_COLLECTION", "product_context")
    qdrant_url = os.getenv("QDRANT_URL", "./qdrant_db")
    
    from app.services.embedding import EmbeddingService
    from app.services.vector_db import VectorService
    from app.services.prompt_builder import PromptBuilder
    from app.services.gemini import GeminiService

    ai_engine = GeminiOrchestrationEngine(
        embedding_service=EmbeddingService(),
        vector_service=VectorService(),
        prompt_builder=PromptBuilder(),
        gemini_service=GeminiService()
    )
    
    # Initialize client based on URL type
    if qdrant_url == ":memory:":
        qdrant_client = AsyncQdrantClient(location=":memory:")
    elif qdrant_url.startswith("http://") or qdrant_url.startswith("https://"):
        qdrant_client = AsyncQdrantClient(url=qdrant_url)
    else:
        qdrant_client = AsyncQdrantClient(path=qdrant_url)
    
    # Check collections and recreate if vector size mismatched
    collections = await qdrant_client.get_collections()
    existing_names = [c.name for c in collections.collections]
    
    if collection_name in existing_names:
        print(f"Re-creating collection '{collection_name}' to update vector dimensions to 3072...")
        await qdrant_client.delete_collection(collection_name=collection_name)

    print(f"Creating vector collection '{collection_name}' with 3072 dimensions...")
    await qdrant_client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=3072, distance=Distance.COSINE)
    )

    sample_docs = [
        "TICKET-101: Users report bulk CSV export on `/api/v1/analytics` takes over 30 seconds and causes a 504 Gateway Timeout on datasets exceeding 10,000 rows.",
        "TICKET-102: The main dashboard query triggers an N+1 database fetching issue, pushing P95 load latency up to 4.2 seconds during peak hours.",
        "TICKET-103: Global search bar lacks frontend debouncing; every keystroke triggers an unindexed text query in PostgreSQL, causing typing lag."
    ]
    
    points = []
    for idx, doc in enumerate(sample_docs):
        embedding = await ai_engine.generate_embedding_vector(doc, correlation_id=f"seed-{idx}")
        
        point = PointStruct(
            id=str(uuid.uuid4()),
            vector=embedding,
            payload={
                "text": doc,
                "source_id": f"ticket-10{idx+1}",
                "workspace_id": "workspace-alpha-99"
            }
        )
        points.append(point)
        print(f"✅ Generated vector ({len(embedding)} dims) for Ticket {idx+1}")

    await qdrant_client.upsert(
        collection_name=collection_name,
        points=points
    )
    print("\n🎉 Seeding complete! All 3 ticket vectors are persisted in local Qdrant storage.")

if __name__ == "__main__":
    asyncio.run(main())