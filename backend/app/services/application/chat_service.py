"""
Application Service for Chat Session & Message operations.

Coordinates between the API layer and the ChatRepository,
converting ORM objects into Pydantic response schemas.
"""

import uuid
import logging
from typing import List, Optional

from app.repositories.chat_repository import ChatRepository
from app.schemas.chat import (
    MessageCreate,
    MessageResponse,
    SessionCreate,
    SessionListResponse,
    SessionResponse,
    SessionUpdate,
)


logger = logging.getLogger("backend.services")


class ChatService:
    """
    Application service for chat session and message workflows.

    Follows the same pattern as ProjectService:
    - Delegates persistence to the repository
    - Converts ORM models → Pydantic responses
    - Validates ownership via user_id scoping in the repository
    """

    def __init__(self, repo: ChatRepository):
        self.repo = repo

    # -----------------------------------------------------------------
    # SESSION — CREATE
    # -----------------------------------------------------------------

    async def create_session(
        self,
        user_id: uuid.UUID,
        payload: SessionCreate,
        workspace_id: Optional[uuid.UUID] = None,
    ) -> SessionResponse:
        """Create a new chat session."""

        logger.info(
            "Creating chat session for user '%s', title='%s'",
            user_id,
            payload.title,
        )

        db_session = await self.repo.create_session(
            user_id=user_id,
            title=payload.title,
            workspace_id=workspace_id,
        )

        return SessionResponse.model_validate(db_session)

    # -----------------------------------------------------------------
    # SESSION — LIST
    # -----------------------------------------------------------------

    async def list_sessions(
        self,
        user_id: uuid.UUID,
        include_archived: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> List[SessionListResponse]:
        """List sessions for a user, returning thin representations."""

        logger.info(
            "Listing sessions for user '%s' (skip=%s, limit=%s, archived=%s)",
            user_id,
            skip,
            limit,
            include_archived,
        )

        db_sessions = await self.repo.get_sessions_by_user(
            user_id=user_id,
            include_archived=include_archived,
            skip=skip,
            limit=limit,
        )

        return [
            SessionListResponse.model_validate(s)
            for s in db_sessions
        ]

    # -----------------------------------------------------------------
    # SESSION — GET ONE
    # -----------------------------------------------------------------

    async def get_session(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Optional[SessionResponse]:
        """Retrieve a single session with full details."""

        logger.info(
            "Retrieving session '%s' for user '%s'",
            session_id,
            user_id,
        )

        db_session = await self.repo.get_session_by_id(
            session_id=session_id,
            user_id=user_id,
        )

        if db_session is None:
            return None

        return SessionResponse.model_validate(db_session)

    # -----------------------------------------------------------------
    # SESSION — UPDATE
    # -----------------------------------------------------------------

    async def update_session(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        payload: SessionUpdate,
    ) -> Optional[SessionResponse]:
        """Update session title and/or archive status."""

        logger.info(
            "Updating session '%s' for user '%s'",
            session_id,
            user_id,
        )

        db_session = await self.repo.update_session(
            session_id=session_id,
            user_id=user_id,
            title=payload.title,
            is_archived=payload.is_archived,
        )

        if db_session is None:
            return None

        return SessionResponse.model_validate(db_session)

    # -----------------------------------------------------------------
    # SESSION — DELETE
    # -----------------------------------------------------------------

    async def delete_session(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> bool:
        """Delete a session and all its messages."""

        logger.info(
            "Deleting session '%s' for user '%s'",
            session_id,
            user_id,
        )

        return await self.repo.delete_session(
            session_id=session_id,
            user_id=user_id,
        )

    # -----------------------------------------------------------------
    # MESSAGES — LIST
    # -----------------------------------------------------------------

    async def list_messages(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> Optional[List[MessageResponse]]:
        """
        List messages in a session chronologically.
        Returns None if session doesn't exist or doesn't belong to user.
        """

        logger.info(
            "Listing messages for session '%s', user '%s'",
            session_id,
            user_id,
        )

        db_messages = await self.repo.get_messages(
            session_id=session_id,
            user_id=user_id,
            skip=skip,
            limit=limit,
        )

        if db_messages is None:
            return None

        return [
            MessageResponse.model_validate(m)
            for m in db_messages
        ]

    # -----------------------------------------------------------------
    # MESSAGES — SLIDING WINDOW RECENT MESSAGES
    # -----------------------------------------------------------------

    async def get_recent_messages(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        max_tokens: int = 3000,
    ) -> List[MessageResponse]:
        """Retrieve recent unsummarized messages for sliding window context."""

        logger.info(
            "Retrieving recent sliding window messages for session '%s', user '%s' (max_tokens=%s)",
            session_id,
            user_id,
            max_tokens,
        )

        db_messages = await self.repo.get_recent_messages(
            session_id=session_id,
            user_id=user_id,
            max_tokens=max_tokens,
        )

        return [
            MessageResponse.model_validate(m)
            for m in db_messages
        ]


    # -----------------------------------------------------------------
    # MESSAGES — CREATE
    # -----------------------------------------------------------------

    async def create_message(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        payload: MessageCreate,
    ) -> Optional[MessageResponse]:
        """
        Add a message to a session.
        Returns None if session doesn't exist or doesn't belong to user.
        """

        logger.info(
            "Creating message in session '%s' for user '%s' (role=%s)",
            session_id,
            user_id,
            payload.role,
        )

        db_message = await self.repo.create_message(
            session_id=session_id,
            user_id=user_id,
            role=payload.role,
            content=payload.content,
        )

        if db_message is None:
            return None

        return MessageResponse.model_validate(db_message)
