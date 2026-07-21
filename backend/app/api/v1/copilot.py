import asyncio
from typing import AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import structlog

from app.services.schemas import AIInferenceInternalContract
from app.services.ai_engine import GeminiOrchestrationEngine
from app.services.qdrant_mesh import QdrantVectorMeshClient

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/copilot", tags=["AI Copilot"])

def get_ai_engine() -> GeminiOrchestrationEngine:
    return GeminiOrchestrationEngine()

def get_vector_client() -> QdrantVectorMeshClient:
    return QdrantVectorMeshClient()

async def stream_copilot_response(
    request: AIInferenceInternalContract,
    ai_engine: GeminiOrchestrationEngine,
    vector_client: QdrantVectorMeshClient
) -> AsyncGenerator[str, None]:
    try:
        context_docs = []
        correlation_id = request.correlation_id or "stream-corr-id"
        workspace_id = request.workspace_id or "default_workspace"
        
        # 1. Generate Query Vector Embedding fallback
        query_vector = [0.0] * 768
        
        # 2. Query Tenant-Isolated Vector Mesh Space
        try:
            rag_response = await vector_client.query_semantic_context(
                vector=query_vector,
                workspace_id=workspace_id,
                correlation_id=correlation_id
            )
            context_docs = getattr(rag_response, "snippets", [])
        except Exception as e:
            logger.error("vector_context_retrieval_failed", error=str(e))

        # 3. Process Content Snippets into Context String
        context_str = ""
        if context_docs:
            context_str = "\n".join([doc.text for doc in context_docs if getattr(doc, "text", None)])

        # 4. Stream Tokens from Orchestration Engine
        # Perfectly matches: (self, contract, context_text, action, route)
        async for chunk in ai_engine.generate_inference_stream(
            contract=request,
            context_text=context_str,
            action="generation",
            route="copilot-stream"
        ):
            yield f"data: {chunk}\n\n"
            
    except Exception as e:
        logger.error("stream_generation_failed", error=str(e))
        yield "event: error\ndata: {\"detail\": \"Internal streaming error occurred.\"}\n\n"

@router.post("/stream", response_class=StreamingResponse)
async def stream_inference(
    request: AIInferenceInternalContract,
    ai_engine: GeminiOrchestrationEngine = Depends(get_ai_engine),
    vector_client: QdrantVectorMeshClient = Depends(get_vector_client)
):
    return StreamingResponse(
        stream_copilot_response(request, ai_engine, vector_client),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )