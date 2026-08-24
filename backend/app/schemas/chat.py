"""
Pydantic Schemas for Chat Session & Message API endpoints.

Provides request/response models for:
- Session CRUD (create, list, get, update, delete)
- Message posting and listing within sessions
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Session Schemas
# ---------------------------------------------------------------------------

class SessionCreate(BaseModel):
    """Request body for creating a new chat session."""

    title: Optional[str] = Field(
        None,
        max_length=500,
        description="Human-readable session title. Auto-generated if omitted.",
    )


class SessionUpdate(BaseModel):
    """Request body for updating an existing chat session."""

    title: Optional[str] = Field(
        None,
        max_length=500,
        description="Updated session title.",
    )
    is_archived: Optional[bool] = Field(
        None,
        description="Set to true to archive the session.",
    )


class SessionResponse(BaseModel):
    """Full session representation returned by GET /sessions/:id."""

    id: UUID
    user_id: UUID
    workspace_id: Optional[UUID] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    summary_token_count: int = 0
    is_archived: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionListResponse(BaseModel):
    """Thin session representation for list views (no summary)."""

    id: UUID
    title: Optional[str] = None
    is_archived: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Message Schemas
# ---------------------------------------------------------------------------

class MessageCreate(BaseModel):
    """Request body for posting a message to a session."""

    content: str = Field(
        ...,
        min_length=1,
        description="Message text content.",
    )
    role: str = Field(
        default="user",
        pattern="^(user|assistant|system)$",
        description="Message author role: user, assistant, or system.",
    )


class MessageResponse(BaseModel):
    """Message representation returned by the API."""

    id: UUID
    session_id: UUID
    role: str
    content: str
    token_count: Optional[int] = None
    is_summarized: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
