"""
API Endpoints for Project Workspaces (Single Product Manager Context).
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundException
from app.models.user import User
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import (
    ErrorResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.application.project_service import ProjectService


router = APIRouter(
    prefix="/projects",
    tags=["Projects Workspace Management"],
)


def get_project_service(
    db: AsyncSession = Depends(get_db),
) -> ProjectService:
    """
    Dependency provider for ProjectService.

    Uses the application's AsyncSession and injects the
    PostgreSQL project repository.
    """
    repository = ProjectRepository(db)
    return ProjectService(repository)


def get_owner_id(current_user: User) -> str:
    """
    Extract the internal User UUID from the authenticated user.

    The projects.owner_id column directly references users.id,
    so the internal authenticated user ID is the correct value
    to pass to the project service/repository.
    """

    user_id = getattr(current_user, "id", None)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user identifier is missing.",
        )

    return str(user_id)


# -------------------------------------------------------------------------
# LIST PROJECTS
# -------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[ProjectResponse],
    summary="List active workspaces",
    description=(
        "Retrieves all active project workspaces owned by "
        "the authenticated Product Manager."
    ),
    responses={
        401: {
            "model": ErrorResponse,
            "description": "Unauthorized / Invalid Token",
        },
    },
)
async def list_projects(
    service: ProjectService = Depends(get_project_service),
    current_user: User = Depends(get_current_user),
) -> List[ProjectResponse]:
    """
    Retrieve all project workspaces owned by the authenticated
    Product Manager.
    """

    owner_id = get_owner_id(current_user)

    return await service.get_projects_by_owner(
        owner_id=owner_id,
    )


# -------------------------------------------------------------------------
# CREATE PROJECT
# -------------------------------------------------------------------------

@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new AI Product Workspace",
    description=(
        "Validates incoming payload parameters, verifies "
        "single PM authorization, and initializes the workspace."
    ),
    responses={
        400: {
            "model": ErrorResponse,
            "description": "Bad Request / Validation Failure",
        },
        401: {
            "model": ErrorResponse,
            "description": "Unauthorized / Invalid Token",
        },
    },
)
async def create_project(
    payload: ProjectCreate,
    service: ProjectService = Depends(get_project_service),
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    """
    Create a new project workspace.
    """

    owner_id = get_owner_id(current_user)

    return await service.orchestrate_creation(
        payload=payload,
        owner_id=owner_id,
    )


# -------------------------------------------------------------------------
# GET SINGLE PROJECT
# -------------------------------------------------------------------------

@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get project workspace details",
    description=(
        "Retrieves metadata for a specific project workspace "
        "owned by the Product Manager."
    ),
    responses={
        401: {
            "model": ErrorResponse,
            "description": "Unauthorized / Invalid Token",
        },
        404: {
            "model": ErrorResponse,
            "description": "Resource Not Found",
        },
    },
)
async def get_project(
    project_id: str,
    service: ProjectService = Depends(get_project_service),
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    """
    Retrieve a single project workspace by ID.
    """

    owner_id = get_owner_id(current_user)

    project = await service.get_project_by_id(
        project_id=project_id,
        owner_id=owner_id,
    )

    if project is None:
        raise ResourceNotFoundException(
            error_code="RESOURCE_NOT_FOUND",
            message=(
                f"Project workspace '{project_id}' "
                "was not found or is inaccessible."
            ),
        )

    return project


# -------------------------------------------------------------------------
# UPDATE PROJECT
# -------------------------------------------------------------------------

@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update project workspace",
    description="Updates metadata for an existing project workspace.",
    responses={
        400: {
            "model": ErrorResponse,
            "description": "Bad Request / Validation Failure",
        },
        401: {
            "model": ErrorResponse,
            "description": "Unauthorized / Invalid Token",
        },
        404: {
            "model": ErrorResponse,
            "description": "Resource Not Found",
        },
    },
)
async def update_project(
    project_id: str,
    payload: ProjectUpdate,
    service: ProjectService = Depends(get_project_service),
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    """
    Update an existing project workspace.
    """

    owner_id = get_owner_id(current_user)

    updated_project = await service.update_project(
        project_id=project_id,
        payload=payload,
        owner_id=owner_id,
    )

    if updated_project is None:
        raise ResourceNotFoundException(
            error_code="RESOURCE_NOT_FOUND",
            message=(
                f"Project workspace '{project_id}' "
                "was not found or could not be updated."
            ),
        )

    return updated_project


# -------------------------------------------------------------------------
# DELETE PROJECT
# -------------------------------------------------------------------------

@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete project workspace",
    description=(
        "Deletes a project workspace owned by the Product Manager."
    ),
    responses={
        401: {
            "model": ErrorResponse,
            "description": "Unauthorized / Invalid Token",
        },
        404: {
            "model": ErrorResponse,
            "description": "Resource Not Found",
        },
    },
)
async def delete_project(
    project_id: str,
    service: ProjectService = Depends(get_project_service),
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete a project workspace.
    """

    owner_id = get_owner_id(current_user)

    deleted = await service.delete_project(
        project_id=project_id,
        owner_id=owner_id,
    )

    if not deleted:
        raise ResourceNotFoundException(
            error_code="RESOURCE_NOT_FOUND",
            message=(
                f"Project workspace '{project_id}' "
                "was not found or could not be deleted."
            ),
        )

    return None