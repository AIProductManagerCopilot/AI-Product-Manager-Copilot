"""
Pydantic Schemas for Long-Term Memory API endpoints.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MemoryCreate(BaseModel):
    """Request body for creating a new memory item."""

    fact: str = Field(
        ...,
        min_length=1,
        description="Fact statement, requirement, preference, decision, or constraint.",
    )
    fact_type: str = Field(
        default="project_fact",
        pattern="^(preference|project_fact|decision|constraint|tooling)$",
        description="Memory type classification.",
    )
    workspace_id: Optional[UUID] = Field(
        None,
        description="Optional workspace identifier.",
    )
    source_session_id: Optional[UUID] = Field(
        None,
        description="Session ID where memory originated.",
    )
    confidence: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Confidence weight score between 0.0 and 1.0.",
    )


class MemoryUpdate(BaseModel):
    """Request body for updating an existing memory item."""

    fact: Optional[str] = Field(
        None,
        min_length=1,
        description="Updated fact statement.",
    )
    fact_type: Optional[str] = Field(
        None,
        pattern="^(preference|project_fact|decision|constraint|tooling)$",
        description="Updated memory classification.",
    )
    confidence: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Updated confidence score.",
    )
    superseded_by: Optional[UUID] = Field(
        None,
        description="UUID of replacing memory.",
    )


class MemoryResponse(BaseModel):
    """Full representation of a memory item."""

    id: UUID
    user_id: UUID
    workspace_id: Optional[UUID] = None
    fact: str
    fact_type: str
    source_session_id: Optional[UUID] = None
    confidence: float = 1.0
    superseded_by: Optional[UUID] = None
    created_at: datetime
    last_confirmed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MemoryListResponse(BaseModel):
    """Thin representation of memory for listing."""

    id: UUID
    user_id: UUID
    workspace_id: Optional[UUID] = None
    fact: str
    fact_type: str
    confidence: float = 1.0
    created_at: datetime
    last_confirmed_at: datetime

    model_config = ConfigDict(from_attributes=True)
