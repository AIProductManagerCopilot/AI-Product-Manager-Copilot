from sqlalchemy.orm import Session

from app.models.core_models import Project, User
from app.repositories.interfaces import IProjectRepository
from app.schemas.project import ProjectCreate


class ProjectRepository(IProjectRepository):
    """
    PostgreSQL implementation of the Project Repository.
    Responsible for persisting Project entities.
    """

    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        payload: ProjectCreate,
        owner_id: str,
    ) -> Project:
        """
        Persist a project into PostgreSQL.

        Responsibilities:
        - Resolve Firebase UID -> internal User UUID
        - Assign default values
        - Save project
        """

        # Resolve Firebase UID to internal User UUID
        user = (
            self.db.query(User)
            .filter(User.user_code == owner_id)
            .first()
        )

        if user is None:
            raise ValueError(f"User '{owner_id}' not found.")

        project = Project(
            workspace_id=user.workspace_id,
            owner_id=user.id,
            project_name=payload.title,
            description=payload.description,
            project_type="standard",
            status="active",
        )

        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)

        return project