"""
Gemini Service for streaming inference tokens via Google GenAI SDK.
"""

import os
from typing import AsyncGenerator, Optional
from google import genai
from app.core.config import settings
from app.core.exceptions import ModelGenerationError


class GeminiService:
    """Handles LLM generation and SSE streaming operations."""

    def __init__(self, client: Optional[genai.Client] = None):
        if client is not None:
            self.client = client
        else:
            api_key = (
                getattr(settings, "gemini_api_key", None)
                or getattr(settings, "GEMINI_API_KEY", None)
                or os.getenv("GEMINI_API_KEY", "")
            )
            self.client = genai.Client(api_key=api_key)

    def _normalize_model_name(self, model_name: str) -> str:
        """Sanitizes model name and formats it properly for the SDK."""
        model_name = (model_name or "").strip()
        if not model_name:
            return "gemini-3.6-flash"
        return model_name.replace("models/", "")

    async def stream_generation(self, prompt: str) -> AsyncGenerator[str, None]:
        """Streams response tokens from Gemini models."""
        try:
            raw_model = (
                getattr(settings, "gemini_api_model", None)
                or getattr(settings, "gemini_model", None)
                or os.getenv("GEMINI_API_MODEL", "gemini-3.6-flash")
            )
            model_name = self._normalize_model_name(raw_model)

            response_stream = await self.client.aio.models.generate_content_stream(
                model=model_name,
                contents=prompt
            )
            async for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
        except Exception as exc:
            raise ModelGenerationError(f"Gemini streaming generation failed: {str(exc)}") from exc