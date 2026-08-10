
"""
Standard API Request & Response Pydantic Models.

Defines standardized success envelopes, error responses, pagination models,
health check endpoints, and reusable field validation components across the application.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict, Field, model_validator

# Generic payload type variables
DataT = TypeVar("DataT")
T = DataT  # Alias for backward compatibility across generic signatures


# ------------------------------------------------------------------------------
# Metadata & Validation Error Schemas
# ------------------------------------------------------------------------------

class ErrorDetail(BaseModel):
    """Detailed metadata regarding specific parameter, field, or validation failures."""

    model_config = ConfigDict(from_attributes=True)

    field: Optional[str] = Field(
        default=None,
        description="Target field or payload path causing the error.",
        examples=["user.email"],
    )
    error_code: Optional[str] = Field(
        default=None,
        description="Specific error code classification.",
        examples=["UNAUTHORIZED_ACCESS"],
    )
    type: Optional[str] = Field(
        default=None,
        description="Internal exception or validation error type.",
        examples=["value_error"],
    )
    message: str = Field(
        ...,
        description="Human-readable error explanation.",
        examples=["Invalid or expired authentication credentials."],
    )


class PaginationMeta(BaseModel):
    """Metadata describing paginated dataset attributes."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    page: int = Field(
        ..., ge=1, description="Current page number (1-indexed).", examples=[1]
    )
    page_size: int = Field(
        ..., ge=1, le=500, description="Number of items per page.", examples=[20]
    )
    total_items: int = Field(
        ..., ge=0, description="Total count of matching records.", examples=[100]
    )
    total_pages: int = Field(
        ..., ge=0, description="Total number of available pages.", examples=[5]
    )
    has_next: bool = Field(
        ..., description="Flag indicating if a subsequent page exists."
    )
    has_previous: bool = Field(
        default=False, description="Flag indicating if a prior page exists."
    )
    has_prev: bool = Field(
        default=False, description="Alias for has_previous for backward compatibility."
    )

    @model_validator(mode="before")
    @classmethod
    def sync_prev_flags(cls, data: Any) -> Any:
        """Synchronizes has_prev and has_previous to guarantee compatibility."""
        if isinstance(data, dict):
            if "has_prev" in data and "has_previous" not in data:
                data["has_previous"] = data["has_prev"]
            elif "has_previous" in data and "has_prev" not in data:
                data["has_prev"] = data["has_previous"]
        elif hasattr(data, "__dict__"):
            has_prev = getattr(data, "has_prev", None)
            has_previous = getattr(data, "has_previous", None)
            if has_prev is not None and has_previous is None:
                setattr(data, "has_previous", has_prev)
            elif has_previous is not None and has_prev is None:
                setattr(data, "has_prev", has_previous)
        return data


# ------------------------------------------------------------------------------
# Standard API Envelope Schemas
# ------------------------------------------------------------------------------

class APISuccessResponse(BaseModel, Generic[DataT]):
    """Standardized success response wrapper for single entity API endpoints."""

    model_config = ConfigDict(from_attributes=True)

    status: str = Field(
        default="success",
        description="Response status string.",
        examples=["success"],
    )
    success: bool = Field(
        default=True,
        description="Operation success status flag.",
    )
    message: str = Field(
        default="Operation completed successfully.",
        description="Human-readable outcome summary.",
    )
    data: Optional[DataT] = Field(
        default=None,
        description="Primary payload data.",
    )
    meta: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Supplementary contextual metadata.",
    )
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp of response generation.",
    )
    request_id: Optional[str] = Field(
        default=None,
        description="Unique request tracing identifier.",
        examples=["req_9f8b2c1a"],
    )


# Alias for backward compatibility across modules
APIResponse = APISuccessResponse


class PaginatedResponse(BaseModel, Generic[DataT]):
    """Standardized wrapper for paginated dataset results."""

    model_config = ConfigDict(from_attributes=True)

    status: str = Field(
        default="success",
        description="Response status string.",
        examples=["success"],
    )
    success: bool = Field(
        default=True,
        description="Operation success status flag.",
    )
    message: str = Field(
        default="Records retrieved successfully.",
        description="Human-readable outcome summary.",
    )
    data: List[DataT] = Field(
        default_factory=list,
        description="List of records for the current page.",
    )
    meta: PaginationMeta = Field(
        ...,
        description="Pagination metadata including counts and navigation flags.",
    )
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp of response generation.",
    )
    request_id: Optional[str] = Field(
        default=None,
        description="Unique request tracing identifier.",
        examples=["req_9f8b2c1a"],
    )


class APIErrorResponse(BaseModel):
    """Standardized error response structure returned across all API endpoints."""

    model_config = ConfigDict(from_attributes=True)

    success: bool = Field(
        default=False,
        description="Operation success status flag.",
    )
    error_code: str = Field(
        ...,
        description="High-level string error identifier.",
        examples=["ENTITY_NOT_FOUND"],
    )
    message: str = Field(
        ...,
        description="Human-readable summary message.",
        examples=["Workspace with ID '123' was not found."],
    )
    details: List[ErrorDetail] = Field(
        default_factory=list,
        description="Granular parameter or field-level validation errors.",
    )
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp when the error occurred.",
    )
    request_id: Optional[str] = Field(
        default=None,
        description="Unique request tracing identifier.",
        examples=["req_9f8b2c1a"],
    )


# ------------------------------------------------------------------------------
# System & Health Schemas
# ------------------------------------------------------------------------------

class HealthCheckResponse(BaseModel):
    """Response schema for operational status and liveness endpoints."""

    model_config = ConfigDict(from_attributes=True)

    status: str = Field(
        default="healthy",
        description="System operational state ('healthy', 'degraded')",
    )
    service: str = Field(description="Name of the service reporting status")
    version: str = Field(description="Active semantic version string")
    environment: str = Field(description="Target deployment environment stage")
    dependencies: Dict[str, str] = Field(
        default_factory=dict,
        description="Health status of downstream resources (e.g. database, redis, qdrant)",
    )