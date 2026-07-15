# backend/app/schemas/feedback.py
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class FeedbackCreate(BaseModel):
    content: str = Field(..., min_length=5, description="The raw customer feedback, review, or ticket text.")
    source: str = Field(..., description="Source channel: e.g., 'Web Form', 'Email', 'Slack', 'CSV Upload'")
    priority: Optional[str] = Field("Medium", description="Initial priority tag assigned to the ticket")

class FeedbackResponse(BaseModel):
    id: str
    project_id: str
    source: str
    content: str = Field(..., description="The original raw feedback text.")
    cleaned_content: str = Field(..., description="The preprocessed, tag-free feedback text.")
    status: str = "Processed"
    ai_insights: Optional[Dict[str, Any]] = Field(None, description="Structured intelligence insights returned by Gemini API.")

    class Config:
        from_attributes = True