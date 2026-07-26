# File: backend/app/schemas/project.py
from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4
from pydantic import BaseModel, Field, StringConstraints, ConfigDict
from typing_extensions import Annotated

# Strict String Constraints for Inputs (strips whitespace & enforces length bounds)
CleanStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=100)]
LongCleanStr = Annotated[str, StringConstraints(strip_whitespace=True, max_length=1000)]


class ProjectBase(BaseModel):
    """Shared entity attributes across project workflows."""
    title: CleanStr = Field(..., description="The unique title of the product workspace.")
    description: Optional[LongCleanStr] = Field(None, description="Detailed objective statement.")
    target_audience: List[CleanStr] = Field(..., description="Target user segments for the product.")


class ProjectCreate(ProjectBase):
    """Payload schema for initializing a project workspace (Idempotent ready)."""
    client_mutation_id: Optional[UUID] = Field(
        None, 
        description="Optional unique idempotency token supplied by the client to prevent duplicate creation."
    )


class ProjectResponse(ProjectBase):
    """Public serialized data shape returned to API clients."""
    id: UUID
    status: str = Field(..., description="Lifecycle status of the project (e.g., 'draft', 'active', 'archived').")
    created_at: datetime
    owner_id: str = Field(..., description="Firebase unique user identifier (UID).")

    # Pydantic v2 configuration to ensure ORM models convert seamlessly to JSON
    model_config = ConfigDict(from_attributes=True)


class ErrorResponse(BaseModel):
    """Standardized exception payload across all backend endpoints."""
    error_code: str = Field(..., description="Machine-readable error identifier.")
    message: str = Field(..., description="Human-readable error description.")
    correlation_id: str = Field(..., description="Unique request tracing correlation ID.")