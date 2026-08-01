
"""
Standard API Response Envelopes for Consistent Frontend Consumption.
"""

from datetime import datetime, timezone
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    """Detailed metadata regarding specific parameter or validation failures."""

    field: Optional[str] = Field(
        default=None, description="Target field causing the error"
    )
    message: str = Field(..., description="Human-readable error detail")


class APIErrorResponse(BaseModel):
    """Standardized error response structure returned across all API endpoints."""

    success: bool = Field(default=False)
    error_code: str = Field(
        ..., json_schema_extra={"example": "ENTITY_NOT_FOUND"}
    )
    message: str = Field(
        ...,
        json_schema_extra={"example": "Workspace with ID '123' was not found."},
    )
    details: List[ErrorDetail] = Field(default_factory=list)
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    request_id: Optional[str] = Field(
        default=None, json_schema_extra={"example": "req_9f8b2c1a"}
    )


class APISuccessResponse(BaseModel, Generic[T]):
    """Standardized success response wrapper for all endpoint responses."""

    success: bool = Field(default=True)
    message: str = Field(default="Operation completed successfully.")
    data: Optional[T] = Field(default=None)
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    request_id: Optional[str] = Field(
        default=None, json_schema_extra={"example": "req_9f8b2c1a"}
    )