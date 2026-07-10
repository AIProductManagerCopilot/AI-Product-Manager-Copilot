# backend/app/schemas/feedback.py
from pydantic import BaseModel, Field
from typing import Optional

class FeedbackCreate(BaseModel):
    content: str = Field(..., min_length=5, description="The raw customer feedback, review, or ticket text.")
    source: str = Field(..., description="Source channel: e.g., 'Web Form', 'Email', 'Slack', 'CSV Upload'")
    priority: Optional[str] = Field("Medium", description="Initial priority tag assigned to the ticket")

class FeedbackResponse(BaseModel):
    id: str
    project_id: str
    content: str
    cleaned_content: str
    source: str
    status: str

    class Config:
        from_attributes = True