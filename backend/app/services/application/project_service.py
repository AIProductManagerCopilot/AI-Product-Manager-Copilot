# File: backend/app/services/application/project_service.py
import logging
from app.schemas.project import ProjectCreate, ProjectResponse
from app.repositories.interfaces import IProjectRepository

# Maintained exact logging namespace from Milestone 1
logger = logging.getLogger("backend.services")


class ProjectService:
    """Orchestrates workspace workflows and enforces business logic rules."""

    def __init__(self, repo: IProjectRepository):
        # Concrete database repository injected for persistence operations
        self.repo = repo

    def orchestrate_creation(self, payload: ProjectCreate, owner_id: str) -> ProjectResponse:
        """Processes project workspace creation and formats the response object."""
        logger.info(f"Orchestrating creation for project workspace: '{payload.title}' by owner '{owner_id}'")

        # 1. Pass the validated Pydantic payload and Firebase UID down to the repository tier
        # The repository handles the UUID lookup, project_code generation, and default status
        db_project = self.repo.create(payload=payload, owner_id=owner_id)

        # 2. Construct the ProjectResponse explicitly to bridge schema field names (e.g. project_name -> title)
        # and ensure type conversions (e.g. UUID -> str for owner_id) pass validation cleanly
        return ProjectResponse(
            id=str(db_project.id),
            title=db_project.project_name,
            description=db_project.description,
            target_audience=payload.target_audience,
            owner_id=str(db_project.owner_id),
            status=db_project.status,
            created_at=db_project.created_at,
            updated_at=db_project.updated_at,
        )