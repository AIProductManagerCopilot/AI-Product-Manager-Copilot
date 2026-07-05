# backend/app/api/v1/endpoints.py
import uuid
from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from backend.app.api.v1.schemas import FeedbackUploadRequest, FeedbackResponse
from backend.app.services.text_processor import TextProcessorService
from backend.app.models.core_models import FeedbackItem, Project
from backend.app.core.database import get_db
from datetime import datetime

router = APIRouter()

@router.post("/feedback/ingest", status_code=status.HTTP_201_CREATED, response_model=FeedbackResponse)
async def ingest_feedback(payload: FeedbackUploadRequest, db: Session = Depends(get_db)):
    """
    Ingests multi-channel text feedback, extracts NLP metadata, 
    and writes the transaction persistently to the PostgreSQL database layer.
    
    Includes robust database constraint handling for production readiness.
    """
    # 1. Execute our text-cleaning routines
    cleaned = TextProcessorService.clean_text(payload.raw_text)
    sanitized = TextProcessorService.mask_pii(cleaned)
    calculated_sentiment = TextProcessorService.compute_mock_sentiment(sanitized)
    
    # 2. Check if the target project exists to prevent foreign key constraint crashes
    project_exists = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target Project with ID {payload.project_id} does not exist. Please create the project context first."
        )
    
    # 3. Map fields directly into our SQLAlchemy ORM structure
    db_feedback = FeedbackItem(
        id=uuid.uuid4(),
        project_id=payload.project_id,
        raw_text=payload.raw_text,
        cleaned_text=sanitized,
        sentiment_score=calculated_sentiment,
        source=payload.source,
        created_at=datetime.utcnow()
    )
    
    # 4. Save the entry to PostgreSQL persistently with atomic transaction safety
    try:
        db.add(db_feedback)
        db.commit()
        db.refresh(db_feedback)
        return db_feedback
    except IntegrityError as e:
        db.rollback()  # Revert the database state immediately on failure
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity violation encountered during transactional ingestion mapping."
        )