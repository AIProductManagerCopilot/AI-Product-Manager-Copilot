"""
LLM Streaming Generation Service supporting Google GenAI (Gemini) and Groq API.
"""

import json
import os
from typing import AsyncGenerator, Optional
import httpx
import structlog

from google import genai
from app.core.config import settings
from app.core.exceptions import ModelGenerationError

logger = structlog.get_logger(__name__)


class GeminiService:
    """Handles LLM generation and SSE streaming operations for Gemini or Groq."""

    def __init__(self, client: Optional[genai.Client] = None):
        self.use_groq = os.getenv("USE_GROQ", "true").lower() in ("true", "1", "yes")
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")
        self.groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

        if client is not None:
            self.client = client
        else:
            api_key = (
                getattr(settings, "gemini_api_key", None)
                or getattr(settings, "GEMINI_API_KEY", None)
                or os.getenv("GEMINI_API_KEY", "")
            )
            try:
                self.client = genai.Client(api_key=api_key)
            except Exception:
                self.client = None

    def _normalize_model_name(self, model_name: str) -> str:
        """Sanitizes model name and formats it properly for the SDK."""
        model_name = (model_name or "").strip()
        if not model_name:
            return "gemini-3.6-flash"
        return model_name.replace("models/", "")

    async def _stream_groq(self, prompt: str) -> AsyncGenerator[str, None]:
        """Streams response tokens from Groq API via httpx SSE."""
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.groq_model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are AI Product Manager Copilot, an elite AI assistant for product managers. "
                        "Always structure your answers cleanly into distinct paragraphs, clear section headings (##, ###), "
                        "bulleted lists, and bold key terms. Avoid unformatted text or raw squished tables. "
                        "Always conclude with a dedicated '💡 Strategic Remarks & Action Plan' block."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.7,
            "stream": True,
        }
        logger.info("Initiating Groq LLM token stream", model=self.groq_model)
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        raise Exception(f"Groq API HTTP {response.status_code}: {error_text.decode('utf-8')}")

                    async for line in response.aiter_lines():
                        if line.startswith("data: ") and line != "data: [DONE]":
                            try:
                                data = json.loads(line[6:])
                                choices = data.get("choices", [])
                                if choices:
                                    delta = choices[0].get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        yield content
                            except Exception:
                                pass
        except Exception as exc:
            logger.error("Groq streaming failed", error=str(exc))
            raise ModelGenerationError(f"Groq streaming generation failed: {str(exc)}") from exc

    async def stream_generation(self, prompt: str) -> AsyncGenerator[str, None]:
        """Streams response tokens from Groq or Gemini depending on configuration."""
        if self.use_groq and self.groq_api_key:
            async for token in self._stream_groq(prompt):
                yield token
            return

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