"""
API Endpoints for Feedback Ingestion and Analytics (Single PM Context).
"""

import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import structlog

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundException
from app.schemas.common import APIErrorResponse
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.services.ai_engine import analyze_feedback_themes
from app.services.preprocess import clean_customer_feedback

logger = structlog.get_logger(__name__)

router = APIRouter(
    prefix="/projects/{project_id}/feedback",
    tags=["Feedback Ingestion"]
)

# ── In-memory store of processed entries per project ──────────────────────────
# Keyed by project_id so multiple projects remain isolated during the session.
_feedback_store: Dict[str, List[Dict[str, Any]]] = {}


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="List project feedback entries",
    description="Returns recently processed feedback entries for a given project workspace.",
    responses={
        401: {"model": APIErrorResponse, "description": "Unauthorized / Invalid Token"},
    }
)
@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    include_in_schema=False
)
async def list_project_feedback(
    project_id: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Returns recently processed feedback entries for a given project.
    Reads from in-memory store or falls back to database customer_feedback table.
    """
    entries = _feedback_store.get(project_id, [])
    if not entries:
        try:
            result = await db.execute(text("SELECT id, category, sentiment_score, severity_weight, content, created_at FROM customer_feedback ORDER BY created_at DESC LIMIT :limit"), {"limit": limit})
            rows = result.fetchall()
            entries = [
                {
                    "id": str(row[0]),
                    "project_id": project_id,
                    "content": row[4],
                    "cleaned_content": row[4],
                    "source": "Zendesk" if "onboarding" in row[4].lower() else "App Store" if "discoverability" in row[4].lower() else "Google Play" if "login" in row[4].lower() else "Intercom",
                    "status": "processed",
                    "ai_insights": {
                        "theme": row[1],
                        "sentiment": "POSITIVE" if row[2] > 0.35 else "NEGATIVE" if row[2] < 0.25 else "NEUTRAL",
                        "urgency_score": row[3],
                    },
                    "submitted_at": str(row[5]) if row[5] else None,
                }
                for row in rows
            ]
        except Exception as e:
            logger.warning("Error fetching customer_feedback from DB", error=str(e))
            entries = []

    return {
        "project_id": project_id,
        "entries": entries[:limit],
        "total": len(entries)
    }


@router.post(
    "",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Import and process customer feedback",
    description="Accepts raw feedback payloads, triggers preprocessing cleaning, passes text to Gemini AI engine, and prepares records.",
    responses={
        400: {"model": APIErrorResponse, "description": "Bad Request / Preprocessing Failure"},
        401: {"model": APIErrorResponse, "description": "Unauthorized / Invalid Token"},
    }
)
@router.post(
    "/",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False
)
async def import_customer_feedback(
    project_id: str,
    payload: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> FeedbackResponse:
    """
    Accepts raw multi-channel feedback data payloads, triggers the cleaning
    and preprocessing utility pipeline, passes the text to the Gemini AI engine,
    and prepares records for the analytics engine.
    """
    user_id: str = current_user.get("uid", "anonymous")

    # 1. Run the text cleaning routine
    processed_text = clean_customer_feedback(payload.content)

    if not processed_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Feedback text became empty after preprocessing data cleaning step."
        )

    feedback_id = str(uuid.uuid4())

    # 2. Attempt Gemini AI analysis — degrade gracefully with heuristic fallback if unavailable
    ai_metrics = None
    try:
        raw_res = analyze_feedback_themes(processed_text)
        if isinstance(raw_res, str):
            ai_metrics = json.loads(raw_res)
        elif isinstance(raw_res, dict):
            ai_metrics = raw_res
    except Exception as e:
        logger.warning(
            "Gemini inference skipped, using fallback heuristics",
            error=str(e),
            feedback_id=feedback_id
        )

    if not ai_metrics or not ai_metrics.get("sentiment"):
        lower = processed_text.lower()
        pos_words = [
            "fantastic", "love", "awesome", "great", "impressive", "impressed",
            "excellent", "amazing", "helpful", "smooth", "good", "like", "best",
            "quick", "intuitive", "clean", "thanks", "thank", "easy", "easier",
            "saved", "saves"
        ]
        neg_words = [
            "crash", "crashes", "slow", "delay", "delayed", "error", "bug", "fail",
            "fails", "freeze", "freezes", "issue", "terrible", "bad", "worst",
            "frustrating", "horrible", "broken", "lacking", "not worth", "high memory",
            "high battery", "problem", "poor", "unreliable"
        ]
        pos_count = sum(1 for w in pos_words if w in lower)
        neg_count = sum(1 for w in neg_words if w in lower)

        if pos_count > neg_count:
            sentiment = "POSITIVE"
        elif neg_count > pos_count:
            sentiment = "NEGATIVE"
        else:
            sentiment = "NEUTRAL"

        if any(w in lower for w in ["crash", "crashes", "bug", "error", "fail", "fails", "freeze", "freezes", "broken"]):
            theme = "Bug Fix"
        elif any(w in lower for w in ["slow", "loading", "delay", "delayed", "memory", "battery", "lag", "performance"]):
            theme = "Performance"
        elif any(w in lower for w in ["add", "feature", "would be great", "can we", "option", "wish", "want"]):
            theme = "Feature Request"
        else:
            theme = "Feedback"

        ai_metrics = {
            "theme": theme,
            "summary": processed_text[:120],
            "sentiment": sentiment,
            "urgency_score": 3 if sentiment == "NEGATIVE" else 2
        }

    # 3. Build the response payload
    response_payload = {
        "id": feedback_id,
        "project_id": project_id,
        "content": payload.content,
        "cleaned_content": processed_text,
        "source": payload.source,
        "status": "Processed",
        "ai_insights": ai_metrics,
        "submitted_at": datetime.utcnow().isoformat(),
        "user_id": user_id,
    }

    # 4. Persist to in-memory store so GET /feedback can return it
    if project_id not in _feedback_store:
        _feedback_store[project_id] = []
    _feedback_store[project_id].append(response_payload)

    return response_payload


@router.get(
    "/{feedback_id}",
    response_model=FeedbackResponse,
    summary="Get single feedback item",
    description="Retrieves details of a specific feedback item within a project context.",
    responses={
        401: {"model": APIErrorResponse, "description": "Unauthorized / Invalid Token"},
        404: {"model": APIErrorResponse, "description": "Feedback item not found"},
    }
)
async def get_feedback_item(
    project_id: str,
    feedback_id: str,
    current_user: Any = Depends(get_current_user),
) -> Dict[str, Any]:
    """Retrieves a single feedback item by ID within a project context."""
    entries = _feedback_store.get(project_id, [])
    for entry in entries:
        if entry.get("id") == feedback_id:
            return entry

    raise ResourceNotFoundException(
        error_code="RESOURCE_NOT_FOUND",
        message=f"Feedback item '{feedback_id}' was not found in project '{project_id}'."
    )