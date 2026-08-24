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


from app.core.tokenizer import count_tokens
from app.services.summarizer import SessionSummarizerService


logger = logging.getLogger("backend.services")


class ChatService:
    """
    Application service for chat session and message workflows.

    Follows the same pattern as ProjectService:
    - Delegates persistence to the repository
    - Converts ORM models → Pydantic responses
    - Validates ownership via user_id scoping in the repository
    """

    def __init__(
        self,
        repo: ChatRepository,
        summarizer: Optional[SessionSummarizerService] = None,
    ):
        self.repo = repo
        self.summarizer = summarizer or SessionSummarizerService()


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

        # Automatically check if session unsummarized tokens exceed threshold
        await self.maybe_summarize(
            session_id=session_id,
            user_id=user_id,
            max_raw_tokens=4000,
            keep_last_n=6,
        )

        return MessageResponse.model_validate(db_message)

    # -----------------------------------------------------------------
    # SESSION SUMMARIZATION WORKFLOW
    # -----------------------------------------------------------------

    async def maybe_summarize(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        max_raw_tokens: int = 4000,
        keep_last_n: int = 6,
    ) -> Optional[str]:
        """
        Calculates unsummarized token usage in a session and triggers LLM summarization
        if total tokens exceed max_raw_tokens threshold.

        - Keeps the most recent keep_last_n messages unsummarized.
        - Folds older messages into session.summary.
        - Updates sessions.summary, sessions.summary_token_count, and marks old messages as is_summarized.
        """
        unsummarized_tokens = await self.repo.get_unsummarized_token_count(session_id, user_id)
        logger.info(
            "Checking session '%s' unsummarized token usage: %s (max_raw_tokens=%s)",
            session_id,
            unsummarized_tokens,
            max_raw_tokens,
        )

        if unsummarized_tokens <= max_raw_tokens:
            session = await self.repo.get_session_by_id(session_id, user_id)
            return session.summary if session else None

        # Get older unsummarized messages to fold into summary
        messages_to_fold = await self.repo.get_messages_for_summarization(
            session_id=session_id,
            user_id=user_id,
            keep_last_n=keep_last_n,
        )

        if not messages_to_fold:
            session = await self.repo.get_session_by_id(session_id, user_id)
            return session.summary if session else None

        session = await self.repo.get_session_by_id(session_id, user_id)
        existing_summary = session.summary if session else None

        logger.info(
            "Triggering session summarization for session '%s': folding %s messages",
            session_id,
            len(messages_to_fold),
        )

        new_summary = await self.summarizer.summarize_session(
            existing_summary=existing_summary,
            messages_to_fold=messages_to_fold,
        )

        summary_tokens = count_tokens(new_summary)

        # Update database session summary and mark folded messages as summarized
        await self.repo.update_session_summary(
            session_id=session_id,
            user_id=user_id,
            summary=new_summary,
            summary_token_count=summary_tokens,
        )

        await self.repo.mark_messages_as_summarized([msg.id for msg in messages_to_fold])

        logger.info("Session summarization complete for session '%s'", session_id)
        return new_summary

