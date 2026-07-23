"""
=========================================================
Enterprise Synthetic Data Generation Engine (ESDGE)
RAG Chunk Generator
=========================================================

Generates Retrieval-Augmented Generation chunks from
customer feedback.

These chunks will later be embedded and inserted
into Qdrant.
"""

from faker import Faker

from dataset_factory.core.id_generator import generate_chunk_id

fake = Faker()


def estimate_tokens(text: str) -> int:
    """
    Simple token estimation.
    Later this can be replaced with tiktoken.
    """
    return max(1, len(text.split()))


def generate_rag_chunks(feedbacks):

    rag_chunks = []

    for feedback in feedbacks:

        text = feedback["feedback_text"]

        rag_chunks.append({

            "chunk_id": generate_chunk_id(),

            "feedback_id": feedback["feedback_id"],

            "project_id": feedback["project_id"],

            "user_id": feedback["user_id"],

            "chunk_index": 1,

            "chunk_text": text,

            "token_count": estimate_tokens(text),

            "embedding_status": "Pending",

            "source_type": "Customer Feedback",

            "created_at": feedback["created_at"]

        })

    return rag_chunks