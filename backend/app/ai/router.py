# backend/app/ai/router.py
"""FastAPI router exposing AI streaming endpoints.

Repository-compatible implementation for production review.
This file provides endpoints that Madhu (Backend Lead) can mount into main.py.
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.ai.context.builder import ContextPayload
from app.ai.prompts.registry import PromptRegistry, PromptVersion
from app.ai.streaming.generator import stream_ai_response


# CHANGE THIS:
# router = APIRouter(prefix="/ai", tags=["AI Copilot"])

# TO THIS:
router = APIRouter(tags=["AI Subsystem"])


class CopilotQueryRequest(BaseModel):
    """Incoming query payload from frontend or client."""

    query: str = Field(..., min_length=1, description="User prompt or question")
    prompt_version: Optional[PromptVersion] = Field(
        default=PromptVersion.V1_0, description="Target prompt version"
    )
    analytics_context: Dict[str, Any] = Field(
        default_factory=dict,
        description="Pre-computed analytics KPIs provided by Harshita's service",
    )
    entity_context: Dict[str, Any] = Field(
        default_factory=dict,
        description="Relational database snapshots provided by Madhu/Akhila",
    )


@router.post(
    "/stream",
    summary="Stream AI Copilot Response over SSE",
    response_class=StreamingResponse,
)
async def stream_copilot_response(
    request: CopilotQueryRequest,
    # Dependencies like Gemini Client or Vector Store can be injected via FastAPI Depends
):
    """Endpoint for streaming AI responses over Server-Sent Events (SSE)."""
    try:
        # 1. Fetch system prompt from registry
        registry = PromptRegistry()
        system_prompt = registry.get_prompt("copilot_assistant", version=request.prompt_version)

        # 2. Assemble Context Window
        context_payload = ContextPayload(
            query=request.query,
            vector_citations=[],  # Injected via retriever in live workflow
            analytics_evidence=request.analytics_context,
            entity_snapshots=request.entity_context,
            system_instructions=system_prompt.template,
        )

        formatted_prompt = context_payload.build_formatted_prompt()

        # Mock async generator for stream demonstration until Gemini API key is configured
        async def mock_gemini_stream():
            mock_tokens = ["Analyzing ", "your ", "product ", "metrics... ", "All ", "systems ", "optimal."]
            for token in mock_tokens:
                yield type("Chunk", (), {"text": token})()

        # 3. Stream SSE response using generator
        return StreamingResponse(
            stream_ai_response(
                gemini_stream=mock_gemini_stream(),
                citations=context_payload.vector_citations,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Stream initialization failed: {str(exc)}",
        )
