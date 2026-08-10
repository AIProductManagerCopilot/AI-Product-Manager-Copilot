"""
Product Manager Domain Database Models.

Defines SQLAlchemy 2.0 entities for Products, Features, Specifications (PRDs),
and Roadmap Items/Milestones.
"""

import enum
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, String, Text, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import BaseModelMixin, SoftDeleteMixin


class FeatureStatus(str, enum.Enum):
    """Lifecycle status for a feature."""

    BACKLOG = "backlog"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class FeaturePriority(str, enum.Enum):
    """Priority levels for feature backlog sorting."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Product(Base, BaseModelMixin, SoftDeleteMixin):
    """Core Product entity representing a software product or service."""

    __tablename__ = "products"

    name: Mapped[str] = mapped_column(
        String(255), nullable=False, index=True, doc="Product name"
    )
    slug: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True, doc="URL-friendly slug"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, doc="Product overview and vision statement"
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    features: Mapped[List["Feature"]] = relationship(
        "Feature", back_populates="product", cascade="all, delete-orphan"
    )
    specifications: Mapped[List["Specification"]] = relationship(
        "Specification", back_populates="product", cascade="all, delete-orphan"
    )
    roadmap_items: Mapped[List["RoadmapItem"]] = relationship(
        "RoadmapItem", back_populates="product", cascade="all, delete-orphan"
    )


class Feature(Base, BaseModelMixin, SoftDeleteMixin):
    """Feature entity detailing functional deliverables within a product."""

    __tablename__ = "features"

    title: Mapped[str] = mapped_column(
        String(255), nullable=False, doc="Feature title"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, doc="Detailed description or user story"
    )
    status: Mapped[FeatureStatus] = mapped_column(
        SQLEnum(FeatureStatus), default=FeatureStatus.BACKLOG, nullable=False
    )
    priority: Mapped[FeaturePriority] = mapped_column(
        SQLEnum(FeaturePriority), default=FeaturePriority.MEDIUM, nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    product: Mapped[Product] = relationship("Product", back_populates="features")


class Specification(Base, BaseModelMixin, SoftDeleteMixin):
    """Product Requirement Document (PRD) or spec attached to a product."""

    __tablename__ = "specifications"

    title: Mapped[str] = mapped_column(
        String(255), nullable=False, doc="Specification document title"
    )
    content: Mapped[str] = mapped_column(
        Text, nullable=False, doc="Markdown content of PRD"
    )
    version: Mapped[str] = mapped_column(
        String(50), default="1.0.0", nullable=False, doc="Semantic versioning tag"
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    product: Mapped[Product] = relationship("Product", back_populates="specifications")


class RoadmapItem(Base, BaseModelMixin, SoftDeleteMixin):
    """High-level roadmap initiative or milestone."""

    __tablename__ = "roadmap_items"

    title: Mapped[str] = mapped_column(
        String(255), nullable=False, doc="Milestone title"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, doc="Milestone details"
    )
    target_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, doc="Target release date"
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    product: Mapped[Product] = relationship("Product", back_populates="roadmap_items")