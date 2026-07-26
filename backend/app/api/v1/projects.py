# File: backend/app/api/v1/projects.py
from fastapi import APIRouter, Depends, status
from backend.app.schemas.project import ProjectCreate, ProjectResponse, ErrorResponse
from backend.app.auth.rbac import RoleChecker
from backend.app.services.application.project_service import ProjectService

router = APIRouter(
    prefix="/projects",
    tags=["Projects Workspace Management"]
)


# Shared factory pattern to cleanly deliver our app service boundary
def get_project_service() -> ProjectService:
    """Dependency provider for ProjectService."""
    return ProjectService()


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new AI Product Workspace",
    description="Validates incoming payload parameters, verifies Firebase authorization, enforces role validation, and initializes the workspace.",
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request / Validation Failure"},
        401: {"model": ErrorResponse, "description": "Unauthorized / Invalid Token"},
        403: {"model": ErrorResponse, "description": "Forbidden / Insufficient Role Scope"},
    }
)
def create_project(
    payload: ProjectCreate,
    service: ProjectService = Depends(get_project_service),
    current_user_claims: dict = Depends(RoleChecker(["product_manager", "admin"]))
) -> ProjectResponse:
    """Processes workspace creation request through the application service tier."""
    # Extract structural identity values cleanly from security claims
    owner_id: str = current_user_claims.get("uid", "anonymous")

    # Process transactional execution strictly through the business service tier
    return service.orchestrate_creation(payload=payload, owner_id=owner_id)