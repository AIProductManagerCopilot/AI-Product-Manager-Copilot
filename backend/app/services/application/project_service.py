"""
Application service for Project Workspace operations.
"""

import logging
from typing import List, Optional

from app.repositories.interfaces import IProjectRepository
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)


# Maintained exact logging namespace from Milestone 1.
logger = logging.getLogger("backend.services")


class ProjectService:
    """
    Application service for Product Manager project/workspace operations.

    Responsibilities:
    - Coordinate project creation
    - Retrieve projects
    - Retrieve a single project
    - Update projects
    - Delete projects
    - Convert ORM objects into API response schemas
    - Keep business logic out of API and repository layers
    """

    def __init__(self, repo: IProjectRepository):
        """
        Inject the project repository.
        """
        self.repo = repo

    # ---------------------------------------------------------------------
    # CREATE
    # ---------------------------------------------------------------------

    async def orchestrate_creation(
        self,
        payload: ProjectCreate,
        owner_id: str,
    ) -> ProjectResponse:
        """
        Process project workspace creation and format the response.
        """

        logger.info(
            "Orchestrating creation for project workspace: '%s' "
            "by owner '%s'",
            payload.title,
            owner_id,
        )

        db_project = await self.repo.create(
            payload=payload,
            owner_id=owner_id,
        )

        return self._to_response(db_project)

    # ---------------------------------------------------------------------
    # LIST
    # ---------------------------------------------------------------------

    async def get_projects_by_owner(
        self,
        owner_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ProjectResponse]:
        """
        Retrieve projects belonging to the authenticated Product Manager.
        """

        logger.info(
            "Retrieving projects for owner '%s' "
            "(skip=%s, limit=%s)",
            owner_id,
            skip,
            limit,
        )

        # Defensive pagination validation.
        skip = max(skip, 0)
        limit = max(min(limit, 100), 1)

        db_projects = await self.repo.get_by_owner(
            owner_id=owner_id,
            skip=skip,
            limit=limit,
        )

        return [
            self._to_response(project)
            for project in db_projects
        ]

    # ---------------------------------------------------------------------
    # GET ONE
    # ---------------------------------------------------------------------

    async def get_project_by_id(
        self,
        project_id: str,
        owner_id: str,
    ) -> Optional[ProjectResponse]:
        """
        Retrieve a single project belonging to the authenticated owner.
        """

        logger.info(
            "Retrieving project '%s' for owner '%s'",
            project_id,
            owner_id,
        )

        db_project = await self.repo.get_by_id(
            project_id=project_id,
            owner_id=owner_id,
        )

        if db_project is None:
            return None

        return self._to_response(db_project)

    # ---------------------------------------------------------------------
    # UPDATE
    # ---------------------------------------------------------------------

    async def update_project(
        self,
        project_id: str,
        payload: ProjectUpdate,
        owner_id: str,
    ) -> Optional[ProjectResponse]:
        """
        Update a project belonging to the authenticated owner.
        """

        logger.info(
            "Updating project '%s' for owner '%s'",
            project_id,
            owner_id,
        )

        db_project = await self.repo.update(
            project_id=project_id,
            payload=payload,
            owner_id=owner_id,
        )

        if db_project is None:
            return None

        return self._to_response(db_project)

    # ---------------------------------------------------------------------
    # DELETE
    # ---------------------------------------------------------------------

    async def delete_project(
        self,
        project_id: str,
        owner_id: str,
    ) -> bool:
        """
        Delete a project belonging to the authenticated owner.
        """

        logger.info(
            "Deleting project '%s' for owner '%s'",
            project_id,
            owner_id,
        )

        return await self.repo.delete(
            project_id=project_id,
            owner_id=owner_id,
        )

    # ---------------------------------------------------------------------
    # RESPONSE MAPPING
    # ---------------------------------------------------------------------

    @staticmethod
    def _to_response(db_project) -> ProjectResponse:
        """
        Convert a SQLAlchemy Project ORM object into ProjectResponse.

        Handles data normalizations:
        - Ensures target_audience is always a list (even if database column has NULL/None)
        - Safely extracts project_code and status
        """
        raw_audience = getattr(db_project, "target_audience", None)
        if raw_audience is None:
            target_audience = []
        elif isinstance(raw_audience, list):
            target_audience = raw_audience
        elif isinstance(raw_audience, str):
            target_audience = [raw_audience]
        else:
            target_audience = list(raw_audience)

        return ProjectResponse(
            id=str(db_project.id),
            project_code=getattr(db_project, "project_code", ""),
            title=getattr(db_project, "project_name", getattr(db_project, "title", "")),
            description=getattr(db_project, "description", None),
            target_audience=target_audience,
            owner_id=str(db_project.owner_id) if getattr(db_project, "owner_id", None) else None,
            status=getattr(db_project, "status", "active"),
            created_at=getattr(db_project, "created_at", None),
            updated_at=getattr(db_project, "updated_at", None),
        )