"""
RAG Chunks Ingestion Script for Qdrant Vector Store.

Reads raw CSV chunks, generates embeddings,
and safely handles both AsyncQdrantClient and Sync QdrantClient upserts.
"""

import asyncio
import csv
import inspect
import os
import sys
import uuid
from typing import Any, Dict, List

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.embedding import EmbeddingService
from app.services.vector_db import VectorService
from qdrant_client.http import models

CSV_PATH = os.path.join("..", "dataset_factory", "output", "raw", "rag_chunks.csv")
COLLECTION_NAME = "feedback_clusters"
BATCH_SIZE = 100


async def run_ingestion():
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV file not found at {CSV_PATH}")
        return

    embedding_svc = EmbeddingService()
    vector_svc = VectorService()

    rows: List[Dict[str, Any]] = []
    with open(CSV_PATH, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    total_records = len(rows)
    print(f"Total chunks to ingest: {total_records}")

    for i in range(0, total_records, BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        texts = [b.get("chunk_text", "") for b in batch]

        # Generate embeddings in batch
        embeddings = await embedding_svc.get_embeddings_batch(texts)

        points = []
        for item, vector in zip(batch, embeddings):
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, item["chunk_id"]))
            points.append(
                models.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "chunk_id": item.get("chunk_id"),
                        "feedback_id": item.get("feedback_id"),
                        "project_id": item.get("project_id"),
                        "user_id": item.get("user_id"),
                        "chunk_index": item.get("chunk_index"),
                        "chunk_text": item.get("chunk_text"),
                        "token_count": item.get("token_count"),
                        "source_type": item.get("source_type"),
                        "created_at": item.get("created_at"),
                    },
                )
            )

        # Handle both AsyncQdrantClient and Sync QdrantClient gracefully
        upsert_res = vector_svc.client.upsert(
            collection_name=COLLECTION_NAME,
            points=points,
        )
        if inspect.isawaitable(upsert_res):
            await upsert_res

        print(f"Ingested chunks {i + 1} to {min(i + BATCH_SIZE, total_records)} / {total_records}")

    # Fetch collection statistics safely
    info_res = vector_svc.client.get_collection(collection_name=COLLECTION_NAME)
    if inspect.isawaitable(info_res):
        info = await info_res
    else:
        info = info_res

    print(f"\n[DONE] Ingestion Complete! Verified points in Qdrant '{COLLECTION_NAME}': {info.points_count}")


if __name__ == "__main__":
    asyncio.run(run_ingestion())