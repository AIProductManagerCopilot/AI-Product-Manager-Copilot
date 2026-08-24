"""
PostgreSQL Repository for Chat Session & Message operations.

Async SQLAlchemy repository handling all database operations for sessions
and messages. All queries are scoped to user_id to prevent cross-user access.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional, Union

from sqlalchemy import select, update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_models import ChatMessage, ChatSession


class ChatRepository:
    """
    Async repository for ChatSession and ChatMessage database operations.

    All session queries are scoped to the authenticated user's ID.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    # -----------------------------------------------------------------
    # SESSION — CREATE
    # -----------------------------------------------------------------

    async def create_session(
        self,
        user_id: uuid.UUID,
        title: Optional[str] = None,
        workspace_id: Optional[uuid.UUID] = None,
    ) -> ChatSession:
        """Create a new chat session for the given user."""

        session = ChatSession(
            user_id=user_id,
            workspace_id=workspace_id,
            title=title,
        )

        self.db.add(session)
        await self.db.flush()
        await self.db.refresh(session)

        return session

    # -----------------------------------------------------------------
    # SESSION — LIST BY USER
    # -----------------------------------------------------------------

    async def get_sessions_by_user(
        self,
        user_id: uuid.UUID,
        include_archived: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> List[ChatSession]:
        """
        Retrieve chat sessions for a user, ordered by most recently updated.
        """

        skip = max(int(skip), 0)
        limit = max(min(int(limit), 100), 1)

        stmt = select(ChatSession).where(
            ChatSession.user_id == user_id,
        )

        if not include_archived:
            stmt = stmt.where(ChatSession.is_archived == False)  # noqa: E712

        stmt = (
            stmt
            .order_by(ChatSession.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    # -----------------------------------------------------------------
    # SESSION — GET ONE
    # -----------------------------------------------------------------

    async def get_session_by_id(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Optional[ChatSession]:
        """Retrieve a single session, scoped to user ownership."""

        stmt = select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id,
        )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    # -----------------------------------------------------------------
    # SESSION — UPDATE
    # -----------------------------------------------------------------

    async def update_session(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        title: Optional[str] = None,
        is_archived: Optional[bool] = None,
    ) -> Optional[ChatSession]:
        """Update session title and/or archive status."""

        session = await self.get_session_by_id(session_id, user_id)

        if session is None:
            return None

        if title is not None:
            session.title = title

        if is_archived is not None:
            session.is_archived = is_archived

        session.updated_at = datetime.now(timezone.utc)

        await self.db.flush()
        await self.db.refresh(session)

        return session

    # -----------------------------------------------------------------
    # SESSION — DELETE
    # -----------------------------------------------------------------

    async def delete_session(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> bool:
        """Delete a session and all its messages (CASCADE)."""

        session = await self.get_session_by_id(session_id, user_id)

        if session is None:
            return False

        await self.db.delete(session)
        await self.db.flush()

        return True

    # -----------------------------------------------------------------
    # MESSAGES — LIST
    # -----------------------------------------------------------------

    async def get_messages(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> Optional[List[ChatMessage]]:
        """
        Retrieve messages for a session, ordered chronologically.
        Returns None if the session doesn't belong to the user.
        """

        # Verify session ownership first
        session = await self.get_session_by_id(session_id, user_id)
        if session is None:
            return None

        skip = max(int(skip), 0)
        limit = max(min(int(limit), 200), 1)

        stmt = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
            .offset(skip)
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    # -----------------------------------------------------------------
    # MESSAGES — CREATE
    # -----------------------------------------------------------------

    async def create_message(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        role: str,
        content: str,
    ) -> Optional[ChatMessage]:
        """
        Add a message to a session.
        Returns None if the session doesn't belong to the user.
        """

        # Verify session ownership first
        session = await self.get_session_by_id(session_id, user_id)
        if session is None:
            return None

        message = ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
        )

        self.db.add(message)

        # Touch session updated_at to bubble it up in list ordering
        session.updated_at = datetime.now(timezone.utc)

        await self.db.flush()
        await self.db.refresh(message)

        return message
