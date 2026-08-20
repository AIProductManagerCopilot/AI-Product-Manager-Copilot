"""
AI Subsystem Router.
Provides endpoints for Copilot streaming, PRD generation, Theme Intelligence, and RAG-grounded responses.
"""

import json
import logging
import os
from typing import Any, AsyncGenerator, Dict, Optional, List
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from app.ai.context_builder import context_builder
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["AI Subsystem"])

FALLBACK_MODELS: List[str] = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
]


def get_ai_client() -> genai.Client:
    """Instantiates and returns the Google GenAI client using configured credentials."""
    api_key = (
        getattr(settings, "gemini_api_key", None)
        or getattr(settings, "GEMINI_API_KEY", None)
        or os.getenv("GEMINI_API_KEY", "")
    )
    return genai.Client(api_key=api_key)


# Request Schemas
class CopilotQueryRequest(BaseModel):
    """Incoming query payload from frontend or client."""

    query: str = Field(..., min_length=1, description="User prompt or question")
    prompt_version: Optional[str] = Field(
        default="v1.0", description="Target prompt version"
    )
    analytics_context: Dict[str, Any] = Field(
        default_factory=dict,
        description="Pre-computed analytics KPIs provided by Harshita's service",
    )
    entity_context: Dict[str, Any] = Field(
        default_factory=dict,
        description="Relational database snapshots provided by Madhu/Akhila",
    )


class PRDGenerationRequest(BaseModel):
    feature_name: str = Field(..., example="Automated User Onboarding Flow")
    user_query: str = Field(..., example="Focus on reducing drop-off during step 2")
    category_filter: Optional[str] = Field(None, example="Onboarding")
    limit: int = Field(default=8, ge=1, le=20)


class ThemeIntelligenceRequest(BaseModel):
    cluster_topic: str = Field(..., example="Checkout Payment Gateway Errors")
    category_filter: Optional[str] = Field(None, example="Billing")


async def generate_gemini_stream(
    system_instruction: str, prompt: str
) -> AsyncGenerator[str, None]:
    """
    Asynchronous generator yielding streamed chunks from Google Gemini with model fallback handling.
    Encodes tokens as JSON strings inside SSE data payloads to preserve newlines and whitespace.
    """
    client = get_ai_client()
    primary_model = (
        getattr(settings, "gemini_model", None)
        or getattr(settings, "gemini_api_model", None)
        or os.getenv("GEMINI_API_MODEL", "gemini-3.7-flash")
    ).replace("models/", "")

    candidate_models = [primary_model] + [m for m in FALLBACK_MODELS if m != primary_model]

    for model_name in candidate_models:
        try:
            logger.info(f"Router streaming with model: {model_name}")
            response_stream = await client.aio.models.generate_content_stream(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.2,
                ),
            )

            async for chunk in response_stream:
                if chunk.text:
                    payload = json.dumps({"delta": chunk.text})
                    yield f"data: {payload}\n\n"
            return  # Stream completed successfully

        except Exception as exc:
            err_msg = str(exc)
            logger.warning(f"Model '{model_name}' encountered error ({err_msg}). Falling back...")
            if any(code in err_msg for code in ["503", "429", "RESOURCE_EXHAUSTED", "404", "UNAVAILABLE"]):
                continue
            else:
                err_payload = json.dumps({"error": err_msg})
                yield f"data: {err_payload}\n\n"
                return

    err_payload = json.dumps({"error": "All candidate AI models are currently exhausted or unavailable."})
    yield f"data: {err_payload}\n\n"


@router.post(
    "/stream",
    summary="Stream AI Copilot Response over SSE",
    response_class=StreamingResponse,
)
async def stream_copilot_response(request: CopilotQueryRequest):
    """Endpoint for streaming general AI Copilot responses with vector RAG retrieval."""
    try:
        # Retrieve vector feedback evidence matching user query
        retrieved_docs = await context_builder._fetch_vector_chunks(
            query=request.query, limit=8
        )
        evidence_text = context_builder.format_retrieved_evidence(retrieved_docs)

        system_instruction = (
            "You are the AI Product Manager Copilot — an executive-level product management assistant. "
            "Your answers must be deeply analytical, rigorous, and directly grounded in the provided customer feedback "
            "evidence and product analytics data.\n\n"
            "CRITICAL FORMATTING RULES:\n"
            "1. Always include blank lines before and after every markdown heading (##, ###).\n"
            "2. Always include blank lines before and after every Markdown Table.\n"
            "3. Format all tables with clean spacing:\n"
            "   | Metric / Feature | Baseline | Target Impact | Primary Evidence |\n"
            "   | :--- | :--- | :--- | :--- |\n"
            "4. Structure your response into these distinct sections:\n"
            "   - **Executive Summary**\n"
            "   - **Customer Evidence & Friction Breakdown** (Include Table)\n"
            "   - **Product Metrics & Churn Impact**\n"
            "   - **Prioritized Strategic Recommendations (P0 / P1 / P2)**\n"
            "5. Quote user feedback explicitly using italicized quotes."
        )

        analytics_info = (
            str(request.analytics_context)
            if request.analytics_context
            else "MAU: 42.3K | Avg Session: 4.2m | Feature Adoption: 61% | Churn Rate: 2.4%"
        )
        entity_info = (
            str(request.entity_context)
            if request.entity_context
            else "Workspace: SaaS Core | Feedback Records: 15,000 | Active Clusters: 6"
        )

        prompt = (
            f"## User Question\n"
            f"{request.query}\n\n"
            f"## Customer Feedback Evidence (Qdrant Vector DB):\n"
            f"{evidence_text}\n\n"
            f"## Analytics Context:\n"
            f"{analytics_info}\n\n"
            f"## Workspace Context:\n"
            f"{entity_info}\n\n"
            f"Please generate a complete, well-spaced report addressing the question."
        )

        return StreamingResponse(
            generate_gemini_stream(
                system_instruction=system_instruction,
                prompt=prompt,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    except Exception as exc:
        logger.error(f"AI Stream initialization failed: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Stream initialization failed: {str(exc)}",
        )


@router.post(
    "/generate-prd",
    summary="Generate RAG-Grounded PRD (Streaming)",
    description="Streams a Product Requirement Document generated by Gemini, grounded in Qdrant vector feedback evidence.",
)
async def generate_prd_endpoint(request: PRDGenerationRequest):
    """Generates PRD with real-time SSE streaming."""
    try:
        # Build Grounded Context Prompt
        context_data = await context_builder.build_prd_prompt(
            feature_name=request.feature_name,
            user_query=request.user_query,
            category_filter=request.category_filter,
            limit=request.limit,
        )

        return StreamingResponse(
            generate_gemini_stream(
                system_instruction=context_data["system_instruction"],
                prompt=context_data["prompt"],
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    except Exception as e:
        logger.error(f"PRD Generation Endpoint Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PRD: {str(e)}",
        )


@router.post(
    "/theme-insights",
    summary="Generate Theme Intelligence Memo",
    description="Analyzes feedback cluster topics and produces strategic recommendations.",
)
async def theme_insights_endpoint(request: ThemeIntelligenceRequest):
    """Generates strategic theme intelligence memo."""
    try:
        context_data = await context_builder.build_theme_intelligence_prompt(
            cluster_topic=request.cluster_topic,
            category_filter=request.category_filter,
        )

        client = get_ai_client()
        primary_model = (
            getattr(settings, "gemini_model", None)
            or getattr(settings, "gemini_api_model", None)
            or os.getenv("GEMINI_API_MODEL", "gemini-3.7-flash")
        ).replace("models/", "")

        response = await client.aio.models.generate_content(
            model=primary_model,
            contents=context_data["prompt"],
            config=types.GenerateContentConfig(
                system_instruction=context_data["system_instruction"],
                temperature=0.3,
            ),
        )

        return {
            "status": "success",
            "cluster_topic": request.cluster_topic,
            "evidence_count": context_data["evidence_count"],
            "insights": response.text,
        }

    except Exception as e:
        logger.error(f"Theme Insights Endpoint Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate theme insights: {str(e)}",
        )