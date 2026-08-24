"""
PostgreSQL Repository for UserMemory operations.

Async SQLAlchemy repository handling database operations for long-term cross-session memory.
All queries are scoped to user_id to enforce multi-tenant isolation.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_models import UserMemory


class MemoryRepository:
    """Async repository for UserMemory database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_memory(
        self,
        user_id: uuid.UUID,
        fact: str,
        fact_type: str = "project_fact",
        workspace_id: Optional[uuid.UUID] = None,
        source_session_id: Optional[uuid.UUID] = None,
        confidence: float = 1.0,
    ) -> UserMemory:
        """Create and store a new user memory item."""
        memory = UserMemory(
            user_id=user_id,
            workspace_id=workspace_id,
            fact=fact,
            fact_type=fact_type,
            source_session_id=source_session_id,
            confidence=confidence,
        )

        self.db.add(memory)
        await self.db.flush()
        await self.db.refresh(memory)
        return memory

    async def get_memory_by_id(
        self,
        memory_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Optional[UserMemory]:
        """Retrieve a single memory item scoped to user."""
        stmt = select(UserMemory).where(
            UserMemory.id == memory_id,
            UserMemory.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_memories_by_ids(
        self,
        memory_ids: List[uuid.UUID],
        user_id: uuid.UUID,
    ) -> List[UserMemory]:
        """Retrieve multiple memory items by ID list, scoped to user."""
        if not memory_ids:
            return []
        stmt = select(UserMemory).where(
            UserMemory.id.in_(memory_ids),
            UserMemory.user_id == user_id,
            UserMemory.superseded_by == None,  # noqa: E711
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_memories(
        self,
        user_id: uuid.UUID,
        workspace_id: Optional[uuid.UUID] = None,
        fact_type: Optional[str] = None,
        include_superseded: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> List[UserMemory]:
        """List user memories with optional workspace/fact_type filters."""
        skip = max(int(skip), 0)
        limit = max(min(int(limit), 100), 1)

        stmt = select(UserMemory).where(UserMemory.user_id == user_id)

        if workspace_id is not None:
            stmt = stmt.where(UserMemory.workspace_id == workspace_id)

        if fact_type is not None:
            stmt = stmt.where(UserMemory.fact_type == fact_type)

        if not include_superseded:
            stmt = stmt.where(UserMemory.superseded_by == None)  # noqa: E711

        stmt = stmt.order_by(UserMemory.created_at.desc()).offset(skip).limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def update_memory(
        self,
        memory_id: uuid.UUID,
        user_id: uuid.UUID,
        fact: Optional[str] = None,
        fact_type: Optional[str] = None,
        confidence: Optional[float] = None,
        superseded_by: Optional[uuid.UUID] = None,
    ) -> Optional[UserMemory]:
        """Update fields on an existing memory item."""
        memory = await self.get_memory_by_id(memory_id, user_id)
        if memory is None:
            return None

        if fact is not None:
            memory.fact = fact
        if fact_type is not None:
            memory.fact_type = fact_type
        if confidence is not None:
            memory.confidence = confidence
        if superseded_by is not None:
            memory.superseded_by = superseded_by

        memory.last_confirmed_at = datetime.now(timezone.utc)

        await self.db.flush()
        await self.db.refresh(memory)
        return memory

    async def touch_memory(
        self,
        memory_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Optional[UserMemory]:
        """Update last_confirmed_at timestamp when a memory is re-confirmed."""
        memory = await self.get_memory_by_id(memory_id, user_id)
        if memory is None:
            return None

        memory.last_confirmed_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(memory)
        return memory

    async def delete_memory(
        self,
        memory_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> bool:
        """Delete a memory item."""
        memory = await self.get_memory_by_id(memory_id, user_id)
        if memory is None:
            return False

        await self.db.delete(memory)
        await self.db.flush()
        return True
