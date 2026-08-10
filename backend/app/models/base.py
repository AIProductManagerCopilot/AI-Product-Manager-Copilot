"""
Base ORM Model Mixins & Common SQLAlchemy Utilities.

Provides reusable mixins for primary keys (UUID), timestamp tracking,
soft deletion, and dictionary serialization across all ORM models.
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy import Boolean, DateTime, UUID, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UUIDPrimaryKeyMixin:
    """Mixin that adds a UUID v4 primary key column."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        doc="Unique identifier (UUID v4)",
    )


class TimestampMixin:
    """Mixin that adds created_at and updated_at timezone-aware timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="Timestamp when record was created",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="Timestamp when record was last updated",
    )


class SoftDeleteMixin:
    """Mixin that provides soft-deletion capability for entities."""

    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        doc="Flag indicating if record is soft-deleted",
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
        doc="Timestamp when record was soft-deleted",
    )

    def soft_delete(self) -> None:
        """Marks entity as deleted and sets timestamp."""
        self.is_deleted = True
        self.deleted_at = datetime.now(timezone.utc)

    def restore(self) -> None:
        """Restores a soft-deleted entity."""
        self.is_deleted = False
        self.deleted_at = None


class AuditMixin:
    """Mixin adding tracking fields for entity creator and last updater."""

    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        doc="UUID of the user who created this record",
    )
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        doc="UUID of the user who last modified this record",
    )


class BaseModelMixin(UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Abstract base mixin combining UUID primary key and timestamp tracking.
    Also provides dict serialization and readable __repr__ output.
    """

    def to_dict(self) -> Dict[str, Any]:
        """Converts model table column attributes into a python dictionary."""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }

    def __repr__(self) -> str:
        model_id = getattr(self, "id", None)
        return f"<{self.__class__.__name__}(id={model_id})>"