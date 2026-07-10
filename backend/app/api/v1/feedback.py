# backend/app/api/v1/feedback.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from app.schemas.feedback import FeedbackCreate
from app.services.preprocess import clean_customer_feedback
from app.core.database import get_db

router = APIRouter(prefix="/projects/{project_id}/feedback", tags=["Feedback Ingestion"])

@router.post("/", status_code=status.HTTP_201_CREATED)
def import_customer_feedback(project_id: str, payload: FeedbackCreate, db: Session = Depends(get_db)):
    """
    Accepts raw multi-channel feedback data payloads, triggers the cleaning 
    and preprocessing utility pipeline, and prepares records for the analytics engine.
    """
    # Run the text cleaning routine
    processed_text = clean_customer_feedback(payload.content)
    
    if not processed_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Feedback text became empty after preprocessing data cleaning step."
        )
        
    # Mock database record generation mapping out our data schema boundaries
    feedback_id = str(uuid.uuid4())
    
    # This structure mirrors the table entities listed in your architecture diagram
    response_payload = {
        "id": feedback_id,
        "project_id": project_id,
        "content": payload.content,            # Original raw tracking logs
        "cleaned_content": processed_text,     # Input ready for Qdrant/Chroma vectorizations
        "source": payload.source,
        "status": "Processed"
    }
    
    return response_payload