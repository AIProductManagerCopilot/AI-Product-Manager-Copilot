import asyncio
from typing import AsyncGenerator, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
import structlog

from app.services.schemas import AIInferenceInternalContract
from app.services.ai_engine import AIEngine, GeminiOrchestrationEngine

import uuid
from app.core.database import get_db
from app.api.deps import get_current_user
from app.repositories.chat_repository import ChatRepository
from app.models.core_models import User
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/copilot", tags=["AI Copilot"])


def get_ai_engine() -> AIEngine:
    """Dependency provider for the AI Orchestration Engine."""
    return AIEngine()


async def stream_copilot_response(
    request_payload: AIInferenceInternalContract,
    http_request: Optional[Request],
    ai_engine: AIEngine,
    db: Optional[AsyncSession] = None,
    current_user: Optional[User] = None,
) -> AsyncGenerator[str, None]:
    """
    Executes real-time SSE streaming for AI Copilot queries.
    Passes user prompt, sliding-window conversation history, and context directly into the RAG engine.
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
        session_id_str = getattr(request_payload, "session_id", None)

        user_id_str = str(current_user.id) if current_user else None

        recent_messages = None
        session_summary = None
        session_uuid = None
        if session_id_str and db and current_user:
            try:
                session_uuid = uuid.UUID(session_id_str)
                repo = ChatRepository(db)
                session_obj = await repo.get_session_by_id(session_uuid, current_user.id)
                if session_obj and session_obj.summary:
                    session_summary = session_obj.summary

                recent_messages = await repo.get_recent_messages(
                    session_id=session_uuid,
                    user_id=current_user.id,
                    max_tokens=3000,
                )
            except Exception as err:
                logger.warning("failed_to_fetch_recent_context_for_session", error=str(err))

        async for chunk in ai_engine.generate_inference_stream(
            prompt=user_prompt,
            query=user_prompt,
            correlation_id=correlation_id,
            workspace_id=workspace_id,
            user_id=user_id_str,
            request=http_request,
            payload=request_payload,
            recent_messages=recent_messages,
            session_summary=session_summary,
        ):
            yield chunk

        # Background long-term memory extraction trigger after response completion
        if session_uuid and db and current_user and recent_messages:
            try:
                from app.services.memory_extractor import MemoryExtractorService
                extractor = MemoryExtractorService()
                workspace_uuid = None
                if workspace_id and workspace_id != "default_workspace":
                    try:
                        workspace_uuid = uuid.UUID(workspace_id)
                    except ValueError:
                        pass
                await extractor.extract_and_store_memories(
                    db=db,
                    user_id=current_user.id,
                    session_id=session_uuid,
                    recent_messages=recent_messages,
                    workspace_id=workspace_uuid,
                )
            except Exception as extract_err:
                logger.warning("background_memory_extraction_failed", error=str(extract_err))


    except Exception as e:
        logger.error("stream_generation_failed", error=str(e))
        yield 'event: error\ndata: {"detail": "Internal streaming error occurred."}\n\n'


@router.post("/stream", response_class=StreamingResponse)
async def stream_inference(
    request_payload: AIInferenceInternalContract,
    http_request: Request,
    ai_engine: AIEngine = Depends(get_ai_engine),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Server-Sent Events (SSE) endpoint for Copilot natural language product queries.
    """
    return StreamingResponse(
        stream_copilot_response(request_payload, http_request, ai_engine, db=db, current_user=current_user),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )