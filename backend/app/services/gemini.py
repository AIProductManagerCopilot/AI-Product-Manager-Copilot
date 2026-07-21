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

    async def stream_generation(self, prompt: str) -> AsyncGenerator[str, None]:
        """Streams response tokens from Gemini 2.0 Flash."""
        try:
            response_stream = await self.client.aio.models.generate_content_stream(
                model=settings.gemini_api_model,
                contents=prompt
            )
            async for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
        except Exception as exc:
            raise ModelGenerationError(f"Gemini streaming generation failed: {str(exc)}") from exc