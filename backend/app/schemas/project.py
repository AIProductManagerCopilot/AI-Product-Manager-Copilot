# File: backend/app/schemas/project.py
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, StringConstraints
from typing_extensions import Annotated

# We enforce clean strings by stripping whitespace and setting explicit limits
CleanStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=100)]
LongCleanStr = Annotated[str, StringConstraints(strip_whitespace=True, max_length=1000)]

class ProjectBase(BaseModel):
    """Shared fields for all project entities."""
    title: CleanStr = Field(description="The unique title of the product workspace.")
    description: Optional[LongCleanStr] = Field(None, description="Detailed objective statement.")
    target_audience: List[CleanStr] = Field(..., description="Target user segments.")

class ProjectCreate(ProjectBase):
    """Blueprint for incoming creation payloads. Fully retry-safe (idempotent ready)."""
    client_mutation_id: Optional[UUID] = Field(
        None, 
        description="Optional unique identifier supplied by client to prevent duplicate request processing."
    )

class ProjectResponse(ProjectBase):
    """Deterministic serialization format returned to the public client layer."""
    id: UUID
    status: str = Field(..., description="Current state machine value (e.g., 'draft', 'active').")
    created_at: datetime
    owner_id: str = Field(..., description="Firebase unique UID reference string.")

    class Config:
        # Pydantic v2 configuration to ensure ORM models convert seamlessly to JSON
        from_attributes = True