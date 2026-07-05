# backend/app/api/v1/endpoints.py
import uuid
from fastapi import APIRouter, status, BackgroundTasks
from backend.app.api.v1.schemas import FeedbackUploadRequest, FeedbackResponse
from backend.app.services.text_processor import TextProcessorService
from datetime import datetime

router = APIRouter()

@router.post("/feedback/ingest", status_code=status.HTTP_202_ACCEPTED, response_model=FeedbackResponse)
async def ingest_feedback(payload: FeedbackUploadRequest, background_tasks: BackgroundTasks):
    """
    Accepts raw customer input feedback, passes it safely through the clean 
    processing pipeline, filters out sensitive markers, and calculates metadata.
    """
    # 1. Clean extra spaces and structural formatting issues
    cleaned = TextProcessorService.clean_text(payload.raw_text)
    
    # 2. Scrub sensitive data markers safely
    sanitized = TextProcessorService.mask_pii(cleaned)
    
    # 3. Calculate internal sentiment scores
    calculated_sentiment = TextProcessorService.compute_mock_sentiment(sanitized)
    
    # 4. Return an structured tracking payload
    return FeedbackResponse(
        id=uuid.uuid4(),
        project_id=payload.project_id,
        raw_text=payload.raw_text,
        cleaned_text=sanitized,
        sentiment_score=calculated_sentiment,
        source=payload.source,
        created_at=datetime.utcnow()
    )