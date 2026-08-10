"""
User and Authentication ORM Database Models.

Defines SQLAlchemy 2.0 entities for Product Manager account management
and JWT Refresh Token tracking without RBAC complexity.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import BaseModelMixin, SoftDeleteMixin


class User(Base, BaseModelMixin, SoftDeleteMixin):
    """Product Manager account entity storing credentials, flags, and profile details."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False, doc="PM primary email address"
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255), nullable=False, doc="Bcrypt password hash"
    )
    full_name: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, doc="Full display name"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, doc="Flag indicating if account is active"
    )
    is_superuser: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, doc="Flag indicating admin access"
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, doc="Flag indicating email verification"
    )

    # Relationships
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )


class RefreshToken(Base, BaseModelMixin):
    """ORM Model tracking issued JWT refresh tokens for session management and revocation."""

    __tablename__ = "refresh_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False, doc="Cryptographic hash of refresh token"
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, doc="Expiration timestamp"
    )
    is_revoked: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, doc="Revocation status flag"
    )

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="refresh_tokens")