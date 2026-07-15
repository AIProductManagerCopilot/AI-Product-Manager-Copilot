# backend/app/api/v1/feedback.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json
import uuid

from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.services.preprocess import clean_customer_feedback
from app.services.ai_engine import analyze_feedback_themes
from app.core.database import get_db

router = APIRouter(prefix="/projects/{project_id}/feedback", tags=["Feedback Ingestion"])

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
        
    # 2. Trigger the live Gemini Theme Ingestion Engine wrapper
    try:
        ai_raw_json = analyze_feedback_themes(processed_text)
        ai_metrics = json.loads(ai_raw_json)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gemini Inference Layer processing crashed: {str(e)}"
        )
        
    feedback_id = str(uuid.uuid4())
    
    # 3. Consolidate our database entry structure mapping
    response_payload = {
        "id": feedback_id,
        "project_id": project_id,
        "content": payload.content,            # Original raw tracking logs
        "cleaned_content": processed_text,     # Cleaned data input
        "source": payload.source,
        "status": "Processed",
        "ai_insights": ai_metrics              # Structured insights from Gemini
    }
    
    return response_payload