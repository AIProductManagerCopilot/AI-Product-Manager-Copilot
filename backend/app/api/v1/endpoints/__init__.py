# backend/app/api/v1/endpoints/__init__.py
import uuid
from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.api.v1.schemas import FeedbackUploadRequest, FeedbackResponse
from app.services.text_processor import TextProcessorService
from app.models.core_models import Feedback, Project
from app.core.database import get_db
from datetime import datetime

router = APIRouter()

@router.post("/feedback/ingest", status_code=status.HTTP_201_CREATED, response_model=FeedbackResponse)
async def ingest_feedback(payload: FeedbackUploadRequest, db: Session = Depends(get_db)):
    """
    Ingests multi-channel text feedback, extracts NLP metadata, 
    and writes the transaction persistently to the PostgreSQL database layer.
    """
    cleaned = TextProcessorService.clean_text(payload.raw_text)
    sanitized = TextProcessorService.mask_pii(cleaned)
    calculated_sentiment = TextProcessorService.compute_mock_sentiment(sanitized)
    
    project_exists = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target Project with ID {payload.project_id} does not exist. Please create the project context first."
        )
    
    db_feedback = Feedback(
        id=uuid.uuid4(),
        feedback_code=f"FB-{uuid.uuid4().hex[:6]}",
        project_id=payload.project_id,
        feedback_type="User Feedback",
        feedback_text=sanitized,
        priority="Medium",
        sentiment=str(calculated_sentiment),
        channel=payload.source,
        created_at=datetime.utcnow()
    )
    
    try:
        db.add(db_feedback)
        db.commit()
        db.refresh(db_feedback)
        return db_feedback
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity violation encountered during transactional ingestion mapping."
        )
