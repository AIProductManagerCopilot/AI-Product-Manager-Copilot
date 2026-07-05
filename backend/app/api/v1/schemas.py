from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional
from datetime import datetime

class FeedbackUploadRequest(BaseModel):
    project_id: UUID
    raw_text: str = Field(..., min_length=10, description="The raw unstructured product feedback.")
    source: str = Field("csv", description="The intake delivery mechanism channel.")

class FeedbackResponse(BaseModel):
    id: UUID
    project_id: UUID
    raw_text: str
    cleaned_text: Optional[str]
    sentiment_score: float
    source: str
    created_at: datetime

    class Config:
        from_attributes = True