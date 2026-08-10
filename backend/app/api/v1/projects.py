"""
API Endpoints for Project Workspaces (Single Product Manager Context).
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundException
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ErrorResponse
from app.services.application.project_service import ProjectService
from app.repositories.project_repository import ProjectRepository

router = APIRouter(
    prefix="/projects",
    tags=["Projects Workspace Management"]
)


def get_project_service(
    db: Session = Depends(get_db),
) -> ProjectService:
    """
    Dependency provider for ProjectService with PostgreSQL repository injection.
    """
    repository = ProjectRepository(db)
    return ProjectService(repository)


@router.get(
    "",
    response_model=List[ProjectResponse],
    summary="List active workspaces",
    description="Retrieves all active project workspaces owned by the authenticated Product Manager.",
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized / Invalid Token"},
    }
)
def list_projects(
    service: ProjectService = Depends(get_project_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> List[ProjectResponse]:
    """Retrieves all project workspaces owned by the current Product Manager."""
    owner_id: str = current_user.get("uid", "anonymous")
    return service.get_projects_by_owner(owner_id=owner_id)


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new AI Product Workspace",
    description="Validates incoming payload parameters, verifies single PM authorization, and initializes the workspace.",
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request / Validation Failure"},
        401: {"model": ErrorResponse, "description": "Unauthorized / Invalid Token"},
    }
)
def create_project(
    payload: ProjectCreate,
    service: ProjectService = Depends(get_project_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> ProjectResponse:
    """Processes workspace creation request through the application service tier."""
    owner_id: str = current_user.get("uid", "anonymous")
    return service.orchestrate_creation(payload=payload, owner_id=owner_id)


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get project workspace details",
    description="Retrieves metadata for a specific project workspace owned by the Product Manager.",
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized / Invalid Token"},
        404: {"model": ErrorResponse, "description": "Resource Not Found"},
    }
)
def get_project(
    project_id: str,
    service: ProjectService = Depends(get_project_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> ProjectResponse:
    """Retrieves a single project workspace by ID."""
    owner_id: str = current_user.get("uid", "anonymous")
    project = service.get_project_by_id(project_id=project_id, owner_id=owner_id)
    if not project:
        raise ResourceNotFoundException(
            error_code="RESOURCE_NOT_FOUND",
            message=f"Project workspace '{project_id}' was not found or is inaccessible."
        )
    return project


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update project workspace",
    description="Updates metadata for an existing project workspace.",
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request / Validation Failure"},
        401: {"model": ErrorResponse, "description": "Unauthorized / Invalid Token"},
        404: {"model": ErrorResponse, "description": "Resource Not Found"},
    }
)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    service: ProjectService = Depends(get_project_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> ProjectResponse:
    """Updates an existing project workspace."""
    owner_id: str = current_user.get("uid", "anonymous")
    updated_project = service.update_project(project_id=project_id, payload=payload, owner_id=owner_id)
    if not updated_project:
        raise ResourceNotFoundException(
            error_code="RESOURCE_NOT_FOUND",
            message=f"Project workspace '{project_id}' was not found or could not be updated."
        )
    return updated_project


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete project workspace",
    description="Deletes a project workspace owned by the Product Manager.",
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized / Invalid Token"},
        404: {"model": ErrorResponse, "description": "Resource Not Found"},
    }
)
def delete_project(
    project_id: str,
    service: ProjectService = Depends(get_project_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> None:
    """Deletes a project workspace."""
    owner_id: str = current_user.get("uid", "anonymous")
    deleted = service.delete_project(project_id=project_id, owner_id=owner_id)
    if not deleted:
        raise ResourceNotFoundException(
            error_code="RESOURCE_NOT_FOUND",
            message=f"Project workspace '{project_id}' was not found or could not be deleted."
        )
    return None