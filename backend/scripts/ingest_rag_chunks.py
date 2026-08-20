"""
RAG Chunks Ingestion Script for Qdrant Vector Store.

Ensures the 'feedback_clusters' collection exists, reads raw CSV chunks,
generates 768-dim embeddings, and batch-upserts points into Qdrant.
"""

import os
import sys
import csv
import uuid
import inspect
import asyncio
from typing import List, Dict, Any

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.services.embedding import EmbeddingService
from app.services.vector_db import VectorService
from qdrant_client.http import models

CSV_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../dataset_factory/output/raw/rag_chunks.csv")
)
COLLECTION_NAME = "feedback_clusters"
BATCH_SIZE = 100
VECTOR_SIZE = 768


async def ensure_collection(vector_svc: VectorService):
    """Checks if the Qdrant collection exists and creates it if missing."""
    client = vector_svc.client

    # Check existence safely for both AsyncQdrantClient and Sync QdrantClient
    if hasattr(client, "collection_exists"):
        res = client.collection_exists(collection_name=COLLECTION_NAME)
        exists = await res if inspect.isawaitable(res) else res
    else:
        res = client.get_collections()
        colls = await res if inspect.isawaitable(res) else res
        exists = any(c.name == COLLECTION_NAME for c in colls.collections)

    if not exists:
        print(f"Collection '{COLLECTION_NAME}' not found in Qdrant. Creating collection...")
        create_res = client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=VECTOR_SIZE,
                distance=models.Distance.COSINE,
            ),
        )
        if inspect.isawaitable(create_res):
            await create_res
        print(f"Collection '{COLLECTION_NAME}' created successfully.")
    else:
        print(f"Collection '{COLLECTION_NAME}' exists and is ready.")


async def run_ingestion():
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV file not found at {CSV_PATH}")
        return

    embedding_svc = EmbeddingService()
    vector_svc = VectorService()

    # Step 1: Ensure collection is initialized
    await ensure_collection(vector_svc)

    # Step 2: Read CSV rows
    rows: List[Dict[str, Any]] = []
    with open(CSV_PATH, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    total_records = len(rows)
    print(f"Total chunks to ingest: {total_records}")

    # Step 3: Batch generation and upsert
    for i in range(0, total_records, BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        texts = [b.get("chunk_text", "").strip() for b in batch]

        # Generate embeddings in batch
        embeddings = await embedding_svc.get_embeddings_batch(texts)

        points = []
        for item, vector in zip(batch, embeddings):
            chunk_id = item.get("chunk_id") or str(uuid.uuid4())
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, str(chunk_id)))

            payload = {
                "chunk_id": chunk_id,
                "feedback_id": item.get("feedback_id", ""),
                "project_id": item.get("project_id", ""),
                "user_id": item.get("user_id", ""),
                "chunk_index": item.get("chunk_index", 0),
                "chunk_text": item.get("chunk_text", ""),
                "token_count": item.get("token_count", 0),
                "source_type": item.get("source_type", "customer_feedback"),
                "theme": item.get("theme", item.get("category", "General")),
                "sentiment": item.get("sentiment", "Neutral"),
                "priority": item.get("priority", "P1"),
                "created_at": item.get("created_at", ""),
                "workspace_id": item.get("workspace_id", "default"),
            }

            points.append(
                models.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload,
                )
            )

        # Upsert batch into Qdrant
        upsert_res = vector_svc.client.upsert(
            collection_name=COLLECTION_NAME,
            points=points,
        )
        if inspect.isawaitable(upsert_res):
            await upsert_res

        print(f"Ingested chunks {i + 1} to {min(i + BATCH_SIZE, total_records)} / {total_records}")

    # Step 4: Verify points count
    info_res = vector_svc.client.get_collection(collection_name=COLLECTION_NAME)
    info = await info_res if inspect.isawaitable(info_res) else info_res

    print(f"\n[DONE] Ingestion Complete! Verified points in Qdrant '{COLLECTION_NAME}': {info.points_count}")


if __name__ == "__main__":
    asyncio.run(run_ingestion())