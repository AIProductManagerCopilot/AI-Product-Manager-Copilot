"""
Repository interfaces for project persistence.
"""

from abc import ABC, abstractmethod
from typing import List, Optional

from app.models.core_models import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


class IProjectRepository(ABC):
    """
    Abstract repository contract for Project persistence.

    The application uses SQLAlchemy AsyncSession, therefore all
    repository operations are asynchronous.
    """

    # ---------------------------------------------------------------------
    # CREATE
    # ---------------------------------------------------------------------

    @abstractmethod
    async def create(
        self,
        payload: ProjectCreate,
        owner_id: str,
    ) -> Project:
        """
        Persist a new project and return the SQLAlchemy ORM object.
        """
        raise NotImplementedError

    # ---------------------------------------------------------------------
    # LIST
    # ---------------------------------------------------------------------

    @abstractmethod
    async def get_by_owner(
        self,
        owner_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Project]:
        """
        Retrieve projects belonging to the specified Product Manager.
        """
        raise NotImplementedError

    # ---------------------------------------------------------------------
    # GET ONE
    # ---------------------------------------------------------------------

    @abstractmethod
    async def get_by_id(
        self,
        project_id: str,
        owner_id: str,
    ) -> Optional[Project]:
        """
        Retrieve one project belonging to the specified owner.
        """
        raise NotImplementedError

    # ---------------------------------------------------------------------
    # UPDATE
    # ---------------------------------------------------------------------

    @abstractmethod
    async def update(
        self,
        project_id: str,
        payload: ProjectUpdate,
        owner_id: str,
    ) -> Optional[Project]:
        """
        Update a project belonging to the specified owner.
        """
        raise NotImplementedError

    # ---------------------------------------------------------------------
    # DELETE
    # ---------------------------------------------------------------------

    @abstractmethod
    async def delete(
        self,
        project_id: str,
        owner_id: str,
    ) -> bool:
        """
        Delete a project belonging to the specified owner.

        Returns:
            True when a project was deleted.
            False when the project was not found or not owned
            by the specified user.
        """
        raise NotImplementedError