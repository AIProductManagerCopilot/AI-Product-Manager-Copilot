"""
Embedding Service for generating vector representations of text.

Supports Google GenAI API with fallback deterministic vectors (768 dimensions)
to ensure continuous availability during batch ingestion or rate limit throttles.
"""

import asyncio
import hashlib
import logging
import os
from typing import List, Optional

from google import genai
from google.genai import types
import numpy as np

from app.core.config import settings
from app.core.exceptions import EmbeddingError

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Centralized service for generating 768-dimensional embeddings
    across ingestion and runtime paths.
    """

    def __init__(self, client: Optional[genai.Client] = None):
        self.api_key = (
            getattr(settings, "gemini_api_key", None)
            or getattr(settings, "GEMINI_API_KEY", None)
            or os.getenv("GEMINI_API_KEY", "")
        )
        self.raw_model = (
            getattr(settings, "embedding_model", None)
            or getattr(settings, "EMBEDDING_MODEL", None)
            or os.getenv("EMBEDDING_MODEL", "gemini-embedding-001")
        )
        self.dimension = int(
            getattr(settings, "embedding_dimension", None)
            or getattr(settings, "EMBEDDING_DIMENSION", None)
            or 768
        )

        if client is not None:
            self.client = client
        elif self.api_key and not self.api_key.startswith("AQ."):
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize GenAI client: {e}")
                self.client = None
        else:
            self.client = None

    def _normalize_model_name(self, model_name: str) -> str:
        """
        Ensures the configured embedding model has the proper
        'models/' prefix required by the SDK configuration.
        """
        model_name = (model_name or "").strip()
        if not model_name:
            model_name = "gemini-embedding-001"

        if not model_name.startswith("models/"):
            model_name = f"models/{model_name}"

        return model_name

    def _fallback_embedding(self, text: str) -> List[float]:
        """
        Generate a deterministic 768-dimensional fallback unit vector
        based on a hash of the input text.
        """
        seed = int(hashlib.sha256(text.encode("utf-8")).hexdigest()[:8], 16)
        rng = np.random.default_rng(seed)
        vec = rng.standard_normal(self.dimension)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate an embedding for the supplied text.
        Falls back gracefully to deterministic vectors if API quota is exhausted.
        """
        cleaned_text = (text or "").strip()
        if not cleaned_text:
            return [0.0] * self.dimension

        if self.client:
            try:
                config = types.EmbedContentConfig(
                    output_dimensionality=self.dimension
                )
                embedding_model = self._normalize_model_name(self.raw_model)

                response = await self.client.aio.models.embed_content(
                    model=embedding_model,
                    contents=cleaned_text,
                    config=config,
                )

                if response and response.embeddings and response.embeddings[0].values:
                    values = response.embeddings[0].values
                    if len(values) == self.dimension:
                        return values
            except Exception as exc:
                logger.warning(f"GenAI embedding execution warning: {exc}. Using fallback vector.")

        return self._fallback_embedding(cleaned_text)

    async def get_embedding(self, text: str) -> List[float]:
        """
        Legacy alias to support existing router/orchestrator callers.
        """
        return await self.generate_embedding(text)

    async def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a batch of strings.
        """
        if not texts:
            return []

        # Try native batch embedding if client is active
        if self.client:
            try:
                config = types.EmbedContentConfig(
                    output_dimensionality=self.dimension
                )
                embedding_model = self._normalize_model_name(self.raw_model)

                response = await self.client.aio.models.embed_content(
                    model=embedding_model,
                    contents=texts,
                    config=config,
                )

                if (
                    response
                    and response.embeddings
                    and len(response.embeddings) == len(texts)
                ):
                    return [emb.values for emb in response.embeddings]
            except Exception as exc:
                logger.warning(
                    f"Batch embedding failed: {exc}. Falling back to individual/heuristic embeddings."
                )

        # Fallback to individual retrieval per item
        results = []
        for text in texts:
            emb = await self.generate_embedding(text)
            results.append(emb)
        return results

    async def embed_text(self, text: str) -> List[float]:
        """
        Alias for embed text.
        """
        return await self.generate_embedding(text)

    async def embed_query(self, text: str) -> List[float]:
        """
        Alias for query text embedding.
        """
        return await self.generate_embedding(text)