"""
Pydantic V2 Schemas for Feedback Resource Operations and Intelligence Analytics.
"""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class FeedbackCreate(BaseModel):
    """Schema for ingesting a new feedback entry."""

    content: str = Field(
        ...,
        min_length=1,
        description="The raw customer feedback, review, or ticket text.",
        json_schema_extra={"example": "Great application, but loading speed could be improved."}
    )
    source: Optional[str] = Field(
        default="user_submission",
        description="Source channel: e.g., 'Web Form', 'Email', 'Slack', 'CSV Upload', 'in_app', 'manual'",
        json_schema_extra={"example": "in_app"}
    )
    priority: Optional[str] = Field(
        default="Medium",
        description="Initial priority tag assigned to the ticket.",
        json_schema_extra={"example": "Medium"}
    )
    workspace_id: Optional[str] = Field(
        default=None,
        description="Associated workspace identifier.",
        json_schema_extra={"example": "ws_12345"}
    )
    project_id: Optional[str] = Field(
        default=None,
        description="Associated project identifier.",
        json_schema_extra={"example": "proj_67890"}
    )

    model_config = ConfigDict(from_attributes=True)


class FeedbackResponse(BaseModel):
    """Schema for feedback API response payloads."""

    id: str = Field(
        ...,
        description="Unique feedback identifier.",
        json_schema_extra={"example": "fb_12345678"}
    )
    source: str = Field(
        default="user_submission",
        description="Source origin channel."
    )
    content: str = Field(
        ...,
        description="The original raw feedback text."
    )
    cleaned_content: Optional[str] = Field(
        default="",
        description="The preprocessed, tag-free feedback text."
    )
    status: str = Field(
        default="Processed",
        description="Processing status of the feedback entry."
    )
    priority: Optional[str] = Field(
        default="Medium",
        description="Priority level assigned to the feedback item."
    )
    project_id: Optional[str] = Field(
        default=None,
        description="Associated project identifier."
    )
    workspace_id: Optional[str] = Field(
        default=None,
        description="Associated workspace identifier."
    )
    ai_insights: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Structured intelligence insights returned by Gemini AI engine."
    )
    submitted_at: Optional[str] = Field(
        default=None,
        description="ISO 8601 formatted timestamp string when feedback was submitted."
    )
    created_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp datetime object when feedback was ingested."
    )
    user_id: Optional[str] = Field(
        default=None,
        description="Identifier of the user who submitted or owns the feedback item."
    )

    model_config = ConfigDict(from_attributes=True)