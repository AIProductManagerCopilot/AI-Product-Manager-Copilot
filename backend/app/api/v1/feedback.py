# backend/app/api/v1/feedback.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
import uuid
from datetime import datetime

from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.services.preprocess import clean_customer_feedback
from app.services.ai_engine import analyze_feedback_themes
from app.core.database import get_db

router = APIRouter(prefix="/projects/{project_id}/feedback", tags=["Feedback Ingestion"])

# ── In-memory store of processed entries per project ──────────────────────────
# This lets the GET endpoint return entries that were submitted via POST in the
# current server session. It is keyed by project_id so multiple projects are
# isolated from each other.
_feedback_store: Dict[str, List[Dict[str, Any]]] = {}


@router.get("/", status_code=status.HTTP_200_OK)
def list_project_feedback(project_id: str, limit: int = 50):
    """
    Returns recently processed feedback entries for a given project.
    Entries are stored in-memory after each POST submission so the frontend
    can display live results without requiring a persistent feedback table.
    """
    entries = _feedback_store.get(project_id, [])
    # Return newest first, capped at `limit`
    return {"project_id": project_id, "entries": entries[-limit:][::-1], "total": len(entries)}


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=FeedbackResponse)
def import_customer_feedback(project_id: str, payload: FeedbackCreate, db: Session = Depends(get_db)):
    """
    Accepts raw multi-channel feedback data payloads, triggers the cleaning
    and preprocessing utility pipeline, passes the text to the Gemini AI engine,
    and prepares records for the analytics engine.
    """
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
        import structlog
        logger = structlog.get_logger(__name__)
        logger.warning("Gemini inference skipped, using fallback heuristics", error=str(e), feedback_id=feedback_id)

    if not ai_metrics or not ai_metrics.get("sentiment"):
        lower = processed_text.lower()
        pos_words = ["fantastic", "love", "awesome", "great", "impressive", "impressed", "excellent", "amazing", "helpful", "smooth", "good", "like", "best", "quick", "intuitive", "clean", "thanks", "thank", "easy", "easier", "saved", "saves"]
        neg_words = ["crash", "crashes", "slow", "delay", "delayed", "error", "bug", "fail", "fails", "freeze", "freezes", "issue", "terrible", "bad", "worst", "frustrating", "horrible", "broken", "lacking", "not worth", "high memory", "high battery", "problem", "poor", "unreliable"]
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
    }

    # 4. Persist to in-memory store so GET /feedback can return it
    if project_id not in _feedback_store:
        _feedback_store[project_id] = []
    _feedback_store[project_id].append(response_payload)

    return response_payload
