# File: backend/app/services/application/project_service.py
import logging
<<<<<<< HEAD
from app.schemas.project import ProjectCreate, ProjectResponse
from app.repositories.interfaces import IProjectRepository

# Maintained exact logging namespace from Milestone 1
=======
from uuid import uuid4, UUID
from datetime import datetime, timezone
from backend.app.schemas.project import ProjectCreate, ProjectResponse

>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
logger = logging.getLogger("backend.services")


class ProjectService:
    """Orchestrates workspace workflows and enforces business logic rules."""

<<<<<<< HEAD
    def __init__(self, repo: IProjectRepository):
        # Concrete database repository injected for persistence operations
        self.repo = repo
=======
    def __init__(self, project_repo=None):
        # Abstract repository interface injected for database persistence operations
        self.repo = project_repo
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d

    def orchestrate_creation(self, payload: ProjectCreate, owner_id: str) -> ProjectResponse:
        """Processes project workspace creation and formats the response object."""
        logger.info(f"Orchestrating creation for project workspace: '{payload.title}' by owner '{owner_id}'")

<<<<<<< HEAD
        # 1. Pass the validated Pydantic payload and Firebase UID down to the repository tier
        # The repository handles the UUID lookup, project_code generation, and default status
        db_project = self.repo.create(payload=payload, owner_id=owner_id)

        # 2. Construct the ProjectResponse explicitly to bridge schema field names (e.g. project_name -> title)
        # and ensure type conversions (e.g. UUID -> str for owner_id) pass validation cleanly
        return ProjectResponse(
            id=str(db_project.id),
            title=db_project.project_name,
            description=db_project.description,
            target_audience=db_project.target_audience,
            owner_id=str(db_project.owner_id),
            status=db_project.status,
            created_at=db_project.created_at,
            updated_at=db_project.updated_at,
        )
=======
        # Construct standard predictable response schema layer (timezone-aware UTC)
        # Ready to pass to repository persistence layer in future persistence workflows
        project_record = ProjectResponse(
            id=uuid4(),
            title=payload.title,
            description=payload.description,
            target_audience=payload.target_audience,
            status="active",
            created_at=datetime.now(timezone.utc),
            owner_id=owner_id
        )

        return project_record
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
