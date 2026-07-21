import os
import json
import asyncio
import time
from typing import AsyncGenerator, List, Dict, Any, Optional
import structlog
from pydantic import BaseModel, Field
from fastapi import Request
from google import genai
from google.genai import types

from app.core.config import settings
from app.core.exceptions import (
    AIEngineError,
    EmbeddingError,
    VectorSearchError,
    ContextAssemblyError,
    ModelGenerationError,
)
from app.services.embedding import EmbeddingService
from app.services.vector_db import VectorService
from app.services.prompt_builder import PromptBuilder
from app.services.gemini import GeminiService

logger = structlog.get_logger(__name__)


# ==========================================
# SECTION 1: PRESERVED UTILITY SCHEMAS & HELPERS
# ==========================================

class ExtractedThemeSchema(BaseModel):
    theme: str = Field(
        ..., 
        description="The primary topic/category (e.g., 'UI/UX', 'Bug Fix', 'Feature Request', 'Performance', 'Authentication')"
    )
    summary: str = Field(
        ..., 
        description="A 1-sentence engineering summary of the user's true problem statement."
    )
    sentiment: str = Field(
        ..., 
        description="Sentiment score: POSITIVE, NEUTRAL, or NEGATIVE"
    )
    urgency_score: int = Field(
        ..., 
        description="Priority tier weight mapped from 1 (Low) to 5 (Critical)"
    )


def clean_environment_token(raw_token: str) -> str:
    """Extracts raw API key token, stripping accidental terminal command duplication noise."""
    if not raw_token:
        return ""
    cleaned = raw_token.strip()
    if "set GEMINI_API_KEY=" in cleaned:
        cleaned = cleaned.split("set GEMINI_API_KEY=")[-1].strip()
    return cleaned


def analyze_feedback_themes(cleaned_text: str) -> dict:
    """Triggers static semantic pattern processing for feedback analysis."""
    api_key = clean_environment_token(
        os.getenv("GEMINI_API_KEY", getattr(settings, "gemini_api_key", ""))
    )
    model_env = os.getenv("GEMINI_API_MODEL", "gemini-2.0-flash")
    model_target = model_env if model_env.startswith("models/") else f"models/{model_env}"
    
    client = genai.Client(api_key=api_key)
    
    system_prompt = (
        "You are an expert Principal AI Product Manager. Your task is to analyze raw "
        "customer reviews, support tickets, and features requests. You must categorize "
        "the text and provide deep insights strictly following the requested JSON schema."
    )
    
    response = client.models.generate_content(
        model=model_target,
        contents=f"Analyze this customer workspace input token block: '{cleaned_text}'",
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            response_schema=ExtractedThemeSchema,
            temperature=0.2
        )
    )
    
    if response.text:
        return json.loads(response.text)
    return {}


# ==========================================
# SECTION 2: PRODUCTION ORCHESTRATOR ENGINE
# ==========================================

class AIEngine:
    """
    Service Orchestrator that coordinates:
    1. Query Embedding Generation (3072-dim via EmbeddingService)
    2. Context Retrieval & Schema Validation (VectorService)
    3. Prompt Assembly (PromptBuilder)
    4. Real-time Token Streaming (GeminiService)
    """

    def __init__(
        self,
        embedding_service: Optional[EmbeddingService] = None,
        vector_service: Optional[VectorService] = None,
        prompt_builder: Optional[PromptBuilder] = None,
        gemini_service: Optional[GeminiService] = None,
    ):
        self.embedding_service = embedding_service or EmbeddingService()
        self.vector_service = vector_service or VectorService()
        self.prompt_builder = prompt_builder or PromptBuilder()
        self.gemini_service = gemini_service or GeminiService()

    # --- Backward Compatibility Helpers & Routing Wrappers ---

    async def generate_embedding_vector(
        self, text: str, correlation_id: Optional[str] = None
    ) -> List[float]:
        """Wrapper providing backward compatibility for ingestion scripts and legacy calls."""
        return await self.embedding_service.generate_embedding(text)

    async def generate_embedding(self, text: str) -> List[float]:
        """Alias for embedding generation."""
        return await self.embedding_service.generate_embedding(text)

    async def search_similar_chunks(
        self, query_vector: List[float], top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """Delegates similarity search to VectorService."""
        return await self.vector_service.search_similar_chunks(query_vector, top_k=top_k)

    async def generate_inference_stream(
        self, 
        prompt: Optional[str] = None, 
        query: Optional[str] = None,
        correlation_id: str = "default-corr-id",
        workspace_id: Optional[str] = None,
        request: Optional[Request] = None,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """
        Legacy/Route-compatible wrapper expected by app/api/v1/copilot.py.
        Delegates directly to the 4-stage RAG SSE pipeline.
        """
        # Safely extract user query across various route payload structures
        user_query = prompt or query or kwargs.get("user_query") or ""
        
        # If kwargs contains a Pydantic contract object (e.g. payload=...)
        if not user_query and "payload" in kwargs:
            payload_obj = kwargs["payload"]
            user_query = getattr(payload_obj, "prompt", getattr(payload_obj, "query", ""))

        if not user_query.strip():
            user_query = "What are the common issues users are reporting with authentication?"

        async for sse_chunk in self.execute_rag_stream(
            user_query=user_query,
            correlation_id=correlation_id,
            request=request
        ):
            yield sse_chunk

    async def stream_inference(
        self, prompt: str, correlation_id: str = "default-corr-id", **kwargs
    ) -> AsyncGenerator[str, None]:
        """Alternative router method alias."""
        async for sse_chunk in self.generate_inference_stream(
            prompt=prompt, correlation_id=correlation_id, **kwargs
        ):
            yield sse_chunk

    async def stream_rag_response(
        self, user_query: str, top_k: int = 3
    ) -> AsyncGenerator[str, None]:
        """Simplified stream generator for backward compatibility."""
        query_vector = await self.embedding_service.generate_embedding(user_query)
        context_chunks = await self.vector_service.search_similar_chunks(query_vector, top_k=top_k)
        formatted_prompt = self.prompt_builder.build_rag_prompt(user_query, context_chunks)

        async for chunk in self.gemini_service.stream_generation(formatted_prompt):
            yield chunk

    # --- Core SSE Pipeline Method ---

    async def execute_rag_stream(
        self, 
        user_query: str, 
        correlation_id: str,
        request: Optional[Request] = None
    ) -> AsyncGenerator[str, None]:
        """
        Executes the 4-stage RAG inference pipeline and yields Server-Sent Event (SSE) chunks.
        """
        log = logger.bind(correlation_id=correlation_id)
        start_time = time.perf_counter()

        try:
            # Stage 1: Generate Embedding Vector (Enforced 3072 Dimensions)
            log.info("STAGE_1_START: Generating Query Embedding Vector")
            query_vector = await self.embedding_service.generate_embedding(user_query)
            log.info("STAGE_1_COMPLETE: Vector Generated", vector_dim=len(query_vector))

            # Stage 2: Vector Search & Schema Validation
            log.info("STAGE_2_START: Querying Qdrant Vector Mesh")
            retrieved_chunks = await self.vector_service.search_similar_chunks(
                query_vector=query_vector, 
                top_k=3
            )
            log.info("STAGE_2_COMPLETE: Context Retrieved", chunks_found=len(retrieved_chunks))

            # Stage 3: Prompt Construction
            log.info("STAGE_3_START: Constructing RAG Prompt")
            full_prompt = self.prompt_builder.build_rag_prompt(
                user_query=user_query, 
                retrieved_chunks=retrieved_chunks
            )
            log.info("STAGE_3_COMPLETE: Prompt Assembly Finished")

            # Stage 4: Generative LLM SSE Streaming
            log.info("STAGE_4_START: Initiating LLM Token Stream")
            chunk_count = 0

            async for text_chunk in self.gemini_service.stream_generation(full_prompt):
                # Check for client disconnect
                if request and await request.is_disconnected():
                    log.warn("Edge client disconnected. Terminating stream execution.")
                    break

                chunk_count += 1
                sse_payload = {
                    "type": "content",
                    "content": text_chunk,
                    "finished": False
                }
                yield f"data: {json.dumps(sse_payload)}\n\n"

            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            log.info(
                "STAGE_4_COMPLETE: Stream Resolved", 
                total_chunks=chunk_count, 
                duration_ms=elapsed_ms
            )

            # Final resolution frame
            resolution_payload = {
                "type": "status",
                "content": "Stream execution resolved",
                "finished": True
            }
            yield f"data: {json.dumps(resolution_payload)}\n\n"

        except AIEngineError as exc:
            log.error("Pipeline domain error captured", error_type=type(exc).__name__, error=str(exc))
            error_payload = {
                "type": "error",
                "content": f"Pipeline failure: {str(exc)}",
                "finished": True
            }
            yield f"data: {json.dumps(error_payload)}\n\n"

        except Exception as exc:
            log.error("Fatal unexpected pipeline error captured", error=str(exc))
            error_payload = {
                "type": "error",
                "content": "Internal service layer pipeline error occurred",
                "finished": True
            }
            yield f"data: {json.dumps(error_payload)}\n\n"


# Backward compatibility aliases for legacy route imports
AIOrchestratorServicePipeline = AIEngine
GeminiOrchestrationEngine = AIEngine