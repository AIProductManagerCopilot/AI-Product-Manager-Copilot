import asyncio
from typing import AsyncGenerator, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
import structlog

from app.services.schemas import AIInferenceInternalContract
from app.services.ai_engine import AIEngine, GeminiOrchestrationEngine

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/copilot", tags=["AI Copilot"])


def get_ai_engine() -> AIEngine:
    """Dependency provider for the AI Orchestration Engine."""
    return AIEngine()


async def stream_copilot_response(
    request_payload: AIInferenceInternalContract,
    http_request: Optional[Request],
    ai_engine: AIEngine,
) -> AsyncGenerator[str, None]:
    """
    Executes real-time SSE streaming for AI Copilot queries.
    Passes user prompt and telemetry context directly into the 4-stage RAG engine.
    """
    try:
        correlation_id = (
            getattr(request_payload, "correlation_id", None)
            or "stream-corr-id"
        )
        workspace_id = (
            getattr(request_payload, "workspace_id", None)
            or "default_workspace"
        )
        user_prompt = (
            getattr(request_payload, "prompt", "")
            or getattr(request_payload, "query", "")
            or ""
        )

        async for chunk in ai_engine.generate_inference_stream(
            prompt=user_prompt,
            query=user_prompt,
            correlation_id=correlation_id,
            workspace_id=workspace_id,
            request=http_request,
            payload=request_payload,
        ):
            yield chunk

    except Exception as e:
        logger.error("stream_generation_failed", error=str(e))
        yield 'event: error\ndata: {"detail": "Internal streaming error occurred."}\n\n'


@router.post("/stream", response_class=StreamingResponse)
async def stream_inference(
    request_payload: AIInferenceInternalContract,
    http_request: Request,
    ai_engine: AIEngine = Depends(get_ai_engine),
):
    """
    Server-Sent Events (SSE) endpoint for Copilot natural language product queries.
    """
    return StreamingResponse(
        stream_copilot_response(request_payload, http_request, ai_engine),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )