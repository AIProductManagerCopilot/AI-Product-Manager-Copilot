"""
API Endpoints for Chat Session Management & Message History.

Provides full CRUD for chat sessions and message posting/listing.
All operations are scoped to the authenticated user.
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.core_models import User
from app.repositories.chat_repository import ChatRepository
from app.schemas.chat import (
    MessageCreate,
    MessageResponse,
    SessionCreate,
    SessionListResponse,
    SessionResponse,
    SessionUpdate,
)
from app.services.application.chat_service import ChatService


router = APIRouter(
    prefix="/sessions",
    tags=["Chat Sessions"],
)


def get_chat_service(
    db: AsyncSession = Depends(get_db),
) -> ChatService:
    """Dependency provider for ChatService."""
    repository = ChatRepository(db)
    return ChatService(repository)


# -------------------------------------------------------------------------
# CREATE SESSION
# -------------------------------------------------------------------------

@router.post(
    "",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new chat session",
    description="Creates a new independent chat conversation for the authenticated user.",
)
async def create_session(
    payload: SessionCreate,
    service: ChatService = Depends(get_chat_service),
    current_user: User = Depends(get_current_user),
) -> SessionResponse:
    """Create a new chat session."""

    workspace_id = getattr(current_user, "workspace_id", None)

    return await service.create_session(
        user_id=current_user.id,
        payload=payload,
        workspace_id=workspace_id,
    )


# -------------------------------------------------------------------------
# LIST SESSIONS
# -------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[SessionListResponse],
    summary="List chat sessions",
    description="Retrieves all chat sessions for the authenticated user, ordered by most recent activity.",
)
async def list_sessions(
    include_archived: bool = Query(False, description="Include archived sessions"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(50, ge=1, le=100, description="Maximum sessions to return"),
    service: ChatService = Depends(get_chat_service),
    current_user: User = Depends(get_current_user),
) -> List[SessionListResponse]:
    """List all sessions for the current user."""

    return await service.list_sessions(
        user_id=current_user.id,
        include_archived=include_archived,
        skip=skip,
        limit=limit,
    )


# -------------------------------------------------------------------------
# GET SINGLE SESSION
# -------------------------------------------------------------------------

@router.get(
    "/{session_id}",
    response_model=SessionResponse,
    summary="Get session details",
    description="Retrieves full details for a specific chat session including summary.",
)
async def get_session(
    session_id: UUID,
    service: ChatService = Depends(get_chat_service),
    current_user: User = Depends(get_current_user),
) -> SessionResponse:
    """Get a single session by ID."""

    result = await service.get_session(
        session_id=session_id,
        user_id=current_user.id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found or access denied.",
        )

    return result


# -------------------------------------------------------------------------
# UPDATE SESSION
# -------------------------------------------------------------------------

@router.patch(
    "/{session_id}",
    response_model=SessionResponse,
    summary="Update a chat session",
    description="Updates the title or archive status of an existing chat session.",
)
async def update_session(
    session_id: UUID,
    payload: SessionUpdate,
    service: ChatService = Depends(get_chat_service),
    current_user: User = Depends(get_current_user),
) -> SessionResponse:
    """Update session title or archive status."""

    result = await service.update_session(
        session_id=session_id,
        user_id=current_user.id,
        payload=payload,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found or access denied.",
        )

    return result


# -------------------------------------------------------------------------
# DELETE SESSION
# -------------------------------------------------------------------------

@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a chat session",
    description="Permanently deletes a chat session and all its messages.",
)
async def delete_session(
    session_id: UUID,
    service: ChatService = Depends(get_chat_service),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a session and all its messages."""

    deleted = await service.delete_session(
        session_id=session_id,
        user_id=current_user.id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found or access denied.",
        )

    return None


# -------------------------------------------------------------------------
# LIST MESSAGES
# -------------------------------------------------------------------------

@router.get(
    "/{session_id}/messages",
    response_model=List[MessageResponse],
    summary="List messages in a session",
    description="Retrieves all messages in a chat session, ordered chronologically.",
)
async def list_messages(
    session_id: UUID,
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(100, ge=1, le=200, description="Maximum messages to return"),
    service: ChatService = Depends(get_chat_service),
    current_user: User = Depends(get_current_user),
) -> List[MessageResponse]:
    """List messages in a session."""

    result = await service.list_messages(
        session_id=session_id,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found or access denied.",
        )

    return result


# -------------------------------------------------------------------------
# CREATE MESSAGE
# -------------------------------------------------------------------------

@router.post(
    "/{session_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Post a message to a session",
    description="Adds a new message to an existing chat session.",
)
async def create_message(
    session_id: UUID,
    payload: MessageCreate,
    service: ChatService = Depends(get_chat_service),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """Add a message to a session."""

    result = await service.create_message(
        session_id=session_id,
        user_id=current_user.id,
        payload=payload,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found or access denied.",
        )

    return result
