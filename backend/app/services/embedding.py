import os
from typing import List, Optional

from google import genai
from google.genai import types

from app.core.config import settings
from app.core.exceptions import EmbeddingError


class EmbeddingService:
    """
    Centralized service for generating embeddings across
    ingestion and runtime paths.
    """

    def __init__(self, client: Optional[genai.Client] = None):
        if client is not None:
            self.client = client
        else:
            api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY", "")

            if not api_key:
                raise EmbeddingError(
                    "Gemini API key is not configured."
                )

            self.client = genai.Client(api_key=api_key)

    def _normalize_model_name(self, model_name: str) -> str:
        """
        Ensures the configured embedding model has the proper
        'models/' prefix required by the SDK configuration.
        """
        model_name = (model_name or "").strip()

        if not model_name:
            model_name = "text-embedding-004"

        if not model_name.startswith("models/"):
            model_name = f"models/{model_name}"

        return model_name

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate an embedding for the supplied text.

        The output dimensionality is controlled by the project's
        EMBEDDING_DIMENSION configuration and defaults to 768.
        """
        try:
            cleaned_text = (text or "").strip()

            if not cleaned_text:
                raise EmbeddingError(
                    "Cannot generate embedding for empty or whitespace text string."
                )

            target_dim = (
                getattr(settings, "embedding_dimension", 768) or 768
            )

            config = types.EmbedContentConfig(
                output_dimensionality=target_dim
            )

            raw_model = (
                getattr(settings, "embedding_model", None)
                or os.getenv(
                    "EMBEDDING_MODEL",
                    "text-embedding-004",
                )
            )

            embedding_model = self._normalize_model_name(raw_model)

            response = await self.client.aio.models.embed_content(
                model=embedding_model,
                contents=cleaned_text,
                config=config,
            )

            if (
                not response.embeddings
                or not response.embeddings[0].values
            ):
                raise EmbeddingError(
                    "Empty embedding payload returned from Gemini."
                )

            values = response.embeddings[0].values

            if len(values) != target_dim:
                raise EmbeddingError(
                    f"Dimension mismatch: expected {target_dim}, "
                    f"received {len(values)}"
                )

            return values

        except EmbeddingError:
            raise

        except Exception as exc:
            raise EmbeddingError(
                f"Embedding service execution failed: {str(exc)}"
            ) from exc

    async def get_embedding(self, text: str) -> List[float]:
        """
        Legacy alias to support existing router/orchestrator callers.
        """
        return await self.generate_embedding(text)