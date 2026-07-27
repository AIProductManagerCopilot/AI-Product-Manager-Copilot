# File: backend/app/services/application/project_service.py
import logging
from uuid import uuid4, UUID
from datetime import datetime, timezone
from app.schemas.project import ProjectCreate, ProjectResponse

logger = logging.getLogger("backend.services")


class ProjectService:
    """Orchestrates workspace workflows and enforces business logic rules."""

    def __init__(self, project_repo=None):
        # Abstract repository interface injected for database persistence operations
        self.repo = project_repo

    def orchestrate_creation(self, payload: ProjectCreate, owner_id: str) -> ProjectResponse:
        """Processes project workspace creation and formats the response object."""
        logger.info(f"Orchestrating creation for project workspace: '{payload.title}' by owner '{owner_id}'")

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