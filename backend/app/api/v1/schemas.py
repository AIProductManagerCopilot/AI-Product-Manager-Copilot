"""
API V1 Schema Models & Standardized Envelopes.
"""

from datetime import datetime
from typing import Any, Dict, Generic, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


# ── Generic API Request & Response Envelopes ──────────────────────────────────

class RequestEnvelope(BaseModel, Generic[T]):
    """Standardized request envelope wrapper for payload inputs."""

    payload: T


class ResponseEnvelope(BaseModel, Generic[T]):
    """Standardized response envelope wrapper for API outputs."""

    status: str = Field("success", json_schema_extra={"example": "success"})
    data: T
    meta: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional metadata such as pagination or context information."
    )


# ── Feedback Ingestion & Processing Schemas ───────────────────────────────────

class FeedbackUploadRequest(BaseModel):
    """Payload schema for uploading raw customer feedback items."""

    project_id: UUID = Field(
        ...,
        description="Target project unique identifier."
    )
    raw_text: str = Field(
        ...,
        min_length=10,
        description="The raw unstructured product feedback.",
        json_schema_extra={"example": "The app crashes every time I try to export a PDF report."}
    )
    source: str = Field(
        default="csv",
        description="The intake delivery mechanism channel.",
        json_schema_extra={"example": "csv"}
    )

    model_config = ConfigDict(from_attributes=True)


class FeedbackResponse(BaseModel):
    """Response schema for processed feedback items."""

    id: UUID = Field(..., description="Unique feedback record identifier.")
    project_id: UUID = Field(..., description="Associated project identifier.")
    raw_text: str = Field(..., description="Original raw feedback text.")
    cleaned_text: Optional[str] = Field(
        default=None,
        description="Preprocessed tag-free feedback text."
    )
    sentiment_score: float = Field(
        ...,
        description="Calculated sentiment numerical score (-1.0 to 1.0)."
    )
    source: str = Field(..., description="Source origin channel.")
    created_at: datetime = Field(..., description="Creation UTC timestamp.")

    model_config = ConfigDict(from_attributes=True)