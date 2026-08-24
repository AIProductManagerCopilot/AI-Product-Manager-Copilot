"""
Chat Session & Message ORM Models.

Provides the data model for multi-session chat history, including:
- ChatSession: Independent conversation containers scoped to user/workspace.
- ChatMessage: Individual messages within a session (user, assistant, system).

These models are additive and do not modify any existing tables or relationships.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.core_models import Base


class ChatSession(Base):
    """
    Represents an independent chat conversation.

    Each user can have multiple sessions (e.g., "Build Jira integration",
    "Create onboarding PRD"). Sessions are optionally scoped to a workspace.
    """

    __tablename__ = "sessions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="Unique session identifier (UUID v4)",
    )

    user_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="Owner user ID (not FK-constrained for Firebase auth flexibility)",
    )

    workspace_id = Column(
        UUID(as_uuid=True),
        nullable=True,
        index=True,
        doc="Optional workspace scoping identifier",
    )

    title = Column(
        Text,
        nullable=True,
        doc="Human-readable session title",
    )

    summary = Column(
        Text,
        nullable=True,
        doc="Rolling conversation summary (populated by Phase 3 summarization)",
    )

    summary_token_count = Column(
        Integer,
        default=0,
        server_default="0",
        nullable=False,
        doc="Token count of the current summary text",
    )

    is_archived = Column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
        doc="Soft-archive flag for hiding old sessions",
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="Session creation timestamp",
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        doc="Last activity timestamp",
    )

    # --- Relationships ---
    messages = relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
        lazy="dynamic",
    )

    __table_args__ = (
        Index(
            "idx_sessions_user_workspace",
            "user_id",
            "workspace_id",
            updated_at.desc(),
        ),
    )


class ChatMessage(Base):
    """
    Represents a single message within a chat session.

    Stores the role (user/assistant/system), content, token count,
    and references to any RAG chunks or memories that influenced the response.
    """

    __tablename__ = "messages"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="Unique message identifier (UUID v4)",
    )

    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Parent session this message belongs to",
    )

    role = Column(
        Text,
        nullable=False,
        doc="Message author role: user, assistant, or system",
    )

    content = Column(
        Text,
        nullable=False,
        doc="Message body text",
    )

    token_count = Column(
        Integer,
        nullable=True,
        doc="Token count of content (populated at write-time in Phase 1.5)",
    )

    retrieved_chunk_ids = Column(
        ARRAY(Text),
        nullable=True,
        doc="IDs of RAG chunks that influenced this response (debug/observability)",
    )

    retrieved_memory_ids = Column(
        ARRAY(Text),
        nullable=True,
        doc="IDs of long-term memories that influenced this response (debug/observability)",
    )

    is_summarized = Column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
        doc="Whether this message has been folded into the session summary",
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="Message creation timestamp",
    )

    # --- Relationships ---
    session = relationship(
        "ChatSession",
        back_populates="messages",
    )

    __table_args__ = (
        CheckConstraint(
            "role IN ('user', 'assistant', 'system')",
            name="ck_messages_role",
        ),
        Index(
            "idx_messages_session_time",
            "session_id",
            "created_at",
        ),
    )
