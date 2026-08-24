"""
API Endpoints for Long-Term Cross-Session Memory Management.

Provides full CRUD operations for inspecting, creating, updating, and deleting
long-term user/project memories. All operations are scoped to the authenticated user.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.core_models import User
from app.repositories.memory_repository import MemoryRepository
from app.schemas.memory import (
    MemoryCreate,
    MemoryListResponse,
    MemoryResponse,
    MemoryUpdate,
)
from app.services.vector_service import vector_service

router = APIRouter(
    prefix="/memory",
    tags=["Long-Term Memory"],
)


# -------------------------------------------------------------------------
# LIST MEMORIES
# -------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[MemoryListResponse],
    summary="List long-term memories",
    description="Retrieves persistent memories for the authenticated user, optionally filtered by workspace or fact type.",
)
async def list_memories(
    workspace_id: Optional[UUID] = Query(None, description="Filter memories by workspace ID"),
    fact_type: Optional[str] = Query(None, description="Filter by memory type (preference, project_fact, decision, constraint, tooling)"),
    include_superseded: bool = Query(False, description="Include memories superseded by newer facts"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[MemoryListResponse]:
    repo = MemoryRepository(db)
    memories = await repo.list_memories(
        user_id=current_user.id,
        workspace_id=workspace_id,
        fact_type=fact_type,
        include_superseded=include_superseded,
        skip=skip,
        limit=limit,
    )
    return [MemoryListResponse.model_validate(m) for m in memories]


# -------------------------------------------------------------------------
# GET SINGLE MEMORY
# -------------------------------------------------------------------------

@router.get(
    "/{memory_id}",
    response_model=MemoryResponse,
    summary="Get single memory item",
    description="Retrieves a single memory item by ID for the authenticated user.",
)
async def get_memory(
    memory_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MemoryResponse:
    repo = MemoryRepository(db)
    memory = await repo.get_memory_by_id(memory_id, current_user.id)
    if memory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Memory item '{memory_id}' not found.",
        )
    return MemoryResponse.model_validate(memory)


# -------------------------------------------------------------------------
# CREATE MEMORY
# -------------------------------------------------------------------------

@router.post(
    "",
    response_model=MemoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create explicit long-term memory",
    description="Creates a new persistent memory item in SQL database and Qdrant vector database.",
)
async def create_memory(
    payload: MemoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MemoryResponse:
    repo = MemoryRepository(db)
    db_memory = await repo.create_memory(
        user_id=current_user.id,
        fact=payload.fact,
        fact_type=payload.fact_type,
        workspace_id=payload.workspace_id,
        source_session_id=payload.source_session_id,
        confidence=payload.confidence,
    )

    # Sync to Qdrant memory collection
    await vector_service.upsert_memory_point(
        memory_id=str(db_memory.id),
        fact_text=db_memory.fact,
        user_id=str(current_user.id),
        workspace_id=str(db_memory.workspace_id) if db_memory.workspace_id else None,
        fact_type=db_memory.fact_type,
        superseded=False,
    )

    return MemoryResponse.model_validate(db_memory)


# -------------------------------------------------------------------------
# UPDATE MEMORY
# -------------------------------------------------------------------------

@router.patch(
    "/{memory_id}",
    response_model=MemoryResponse,
    summary="Update memory item",
    description="Updates the fact text, classification, or superseded status of a memory item.",
)
async def update_memory(
    memory_id: UUID,
    payload: MemoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MemoryResponse:
    repo = MemoryRepository(db)
    updated_memory = await repo.update_memory(
        memory_id=memory_id,
        user_id=current_user.id,
        fact=payload.fact,
        fact_type=payload.fact_type,
        confidence=payload.confidence,
        superseded_by=payload.superseded_by,
    )

    if updated_memory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Memory item '{memory_id}' not found.",
        )

    # Update in Qdrant memory collection
    await vector_service.upsert_memory_point(
        memory_id=str(updated_memory.id),
        fact_text=updated_memory.fact,
        user_id=str(current_user.id),
        workspace_id=str(updated_memory.workspace_id) if updated_memory.workspace_id else None,
        fact_type=updated_memory.fact_type,
        superseded=bool(updated_memory.superseded_by is not None),
    )

    return MemoryResponse.model_validate(updated_memory)


# -------------------------------------------------------------------------
# DELETE MEMORY
# -------------------------------------------------------------------------

@router.delete(
    "/{memory_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete memory item",
    description="Deletes a memory item from SQL database and Qdrant vector collection.",
)
async def delete_memory(
    memory_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    repo = MemoryRepository(db)
    success = await repo.delete_memory(memory_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Memory item '{memory_id}' not found.",
        )

    # Delete from Qdrant
    await vector_service.delete_memory_point(str(memory_id))
