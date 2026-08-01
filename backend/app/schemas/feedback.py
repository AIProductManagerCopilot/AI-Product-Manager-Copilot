"""
Pydantic Schemas for Feedback Resource Operations.
"""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class FeedbackCreate(BaseModel):
    """Schema for ingesting a new feedback entry."""

    content: str = Field(
        ..., min_length=5, description="The raw customer feedback, review, or ticket text."
    )
    source: Optional[str] = Field(
        default="manual",
        description="Source channel: e.g., 'Web Form', 'Email', 'Slack', 'CSV Upload', 'Zendesk', 'Intercom', 'AppStore', 'manual'",
    )
    priority: Optional[str] = Field(
        default="Medium", description="Initial priority tag assigned to the ticket."
    )
    workspace_id: Optional[str] = Field(
        default=None, description="Associated workspace identifier."
    )
    project_id: Optional[str] = Field(
        default=None, description="Associated project identifier."
    )


class FeedbackResponse(BaseModel):
    """Schema for feedback API response payloads."""

    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Unique feedback identifier.")
    source: str = Field(..., description="Source origin channel.")
    content: str = Field(..., description="The original raw feedback text.")
    cleaned_content: Optional[str] = Field(
        default="", description="The preprocessed, tag-free feedback text."
    )
    status: str = Field(
        default="Processed", description="Processing status of the feedback entry."
    )
    project_id: Optional[str] = Field(
        default=None, description="Associated project identifier."
    )
    workspace_id: Optional[str] = Field(
        default=None, description="Associated workspace identifier."
    )
    ai_insights: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Structured intelligence insights returned by Gemini API.",
    )
    created_at: Optional[datetime] = Field(
        default=None, description="Timestamp when feedback was ingested."
    )