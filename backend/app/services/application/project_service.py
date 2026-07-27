# File: backend/app/services/application/project_service.py
import logging
from backend.app.schemas.project import ProjectCreate, ProjectResponse
from backend.app.repositories.interfaces import IProjectRepository

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

        # 2. Serialize the SQLAlchemy ORM instance directly into a standard ProjectResponse
        # (Relies on model_config = ConfigDict(from_attributes=True) defined in your schema)
        return ProjectResponse.model_validate(db_project)