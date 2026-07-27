from abc import ABC, abstractmethod

from app.models.core_models import Project
from app.schemas.project import ProjectCreate


class IProjectRepository(ABC):
    """
    Abstract repository contract for Project persistence.
    Every repository implementation must follow this interface.
    """

    @abstractmethod
    def create(
        self,
        payload: ProjectCreate,
        owner_id: str,
    ) -> Project:
        """
        Persist a new project and return the SQLAlchemy ORM object.
        """
        pass
    