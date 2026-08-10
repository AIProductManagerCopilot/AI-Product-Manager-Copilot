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
            api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY", "")
            self.client = genai.Client(api_key=api_key)

    def _normalize_model_name(self, model_name: str) -> str:
        """Ensures the model name is sanitized and formatted without duplicate 'models/' prefixes."""
        model_name = (model_name or "").strip()
        if not model_name:
            return "gemini-3.5-flash"
        return model_name.replace("models/", "")

    async def stream_generation(self, prompt: str) -> AsyncGenerator[str, None]:
        """Streams response tokens from Gemini models."""
        try:
            raw_model = getattr(settings, "gemini_api_model", None) or os.getenv("GEMINI_API_MODEL", "gemini-3.5-flash")
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