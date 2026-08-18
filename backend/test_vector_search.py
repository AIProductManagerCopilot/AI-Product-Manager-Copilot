import asyncio
from app.services.embedding import EmbeddingService
from app.services.vector_db import VectorService


async def test():
    query = "What features have highest demand?"
    print(f"Querying vector database for: '{query}'")
    
    embedding_svc = EmbeddingService()
    vector_svc = VectorService()
    
    emb = await embedding_svc.get_embedding(query)
    res = await vector_svc.search_similar_chunks(emb, top_k=3)
    
    print(f"\n[OK] Chunks retrieved: {len(res)}")
    for idx, r in enumerate(res, 1):
        print(f"\n--- Result #{idx} (Score: {r['score']:.4f}) ---")
        print(f"Chunk ID : {r.get('chunk_id')}")
        print(f"Content  : {r.get('content')}")
        print(f"Metadata : {r.get('metadata')}")


if __name__ == "__main__":
    asyncio.run(test())