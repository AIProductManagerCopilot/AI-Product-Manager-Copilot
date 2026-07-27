# app/ai/streaming/generator.py
"""Async SSE Generator yielding token streams and citation packets.

Repository-compatible implementation for production review.
"""

import json
from typing import Any, AsyncGenerator, Dict, List


class SSEEventBuilder:
    """Formats event payloads into standard SSE text/event-stream data."""

    @staticmethod
    def format_event(event_type: str, data: Dict[str, Any]) -> str:
        return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


async def stream_ai_response(
    gemini_stream: AsyncGenerator[Any, None],
    citations: List[Dict[str, Any]],
) -> AsyncGenerator[str, None]:
    """Yields formatted SSE strings for streaming endpoints."""
    # 1. Emit status event
    yield SSEEventBuilder.format_event("status", {"state": "PROCESSING", "message": "Analyzing context..."})

    # 2. Emit citations payload
    if citations:
        yield SSEEventBuilder.format_event("citation", {"citations": citations})

    # 3. Stream token response from Gemini
    try:
        async for chunk in gemini_stream:
            token_text = getattr(chunk, "text", "")
            if token_text:
                yield SSEEventBuilder.format_event("token", {"delta": token_text})

        # 4. Emit completion status
        yield SSEEventBuilder.format_event("status", {"state": "COMPLETED", "message": "Stream finished."})

    except Exception as exc:
        yield SSEEventBuilder.format_event("error", {"code": "AI_STREAM_ERROR", "detail": str(exc)})