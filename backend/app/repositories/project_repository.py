"""
PostgreSQL repository implementation for Project Workspace operations.

This repository uses SQLAlchemy AsyncSession because the application's
database dependency is asynchronous.
"""

import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.core_models import Project, User
from app.repositories.interfaces import IProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectRepository(IProjectRepository):
    """
    PostgreSQL implementation of the Project Repository.

    Responsibilities:
    - Resolve authenticated owner to the database User
    - Create projects
    - List projects owned by the authenticated Product Manager
    - Retrieve one project
    - Update projects
    - Delete projects

    Important:
    The application supplies the authenticated owner's UUID as owner_id
    in the current development/authentication flow.

    The repository therefore resolves owner_id primarily through
    User.id rather than incorrectly treating a UUID as User.user_code.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    # ---------------------------------------------------------------------
    # OWNER RESOLUTION
    # ---------------------------------------------------------------------

    async def _resolve_owner(self, owner_id: str) -> Optional[User]:
        """
        Resolve the external owner identifier to the business User ORM row.

        Current authentication flow supplies the User UUID.

        For compatibility, if owner_id is not a valid UUID, we also
        support lookup by user_code.
        """

        # -------------------------------------------------------------
        # First: try owner_id as a UUID.
        # -------------------------------------------------------------

        try:
            owner_uuid = uuid.UUID(str(owner_id))
        except (ValueError, TypeError, AttributeError):
            owner_uuid = None

        if owner_uuid is not None:
            result = await self.db.execute(
                select(User).where(
                    User.id == owner_uuid
                )
            )

            user = result.scalar_one_or_none()

            if user is not None:
                return user

        # -------------------------------------------------------------
        # Compatibility fallback: user_code.
        # -------------------------------------------------------------

        result = await self.db.execute(
            select(User).where(
                User.user_code == str(owner_id)
            )
        )

        return result.scalar_one_or_none()

    # ---------------------------------------------------------------------
    # CREATE
    # ---------------------------------------------------------------------

    async def create(
        self,
        payload: ProjectCreate,
        owner_id: str,
    ) -> Project:
        """
        Persist a new project.

        Steps:
        1. Resolve authenticated owner.
        2. Obtain the owner's workspace.
        3. Generate project_code.
        4. Create the Project ORM object.
        5. Flush so PostgreSQL assigns generated values.
        6. Refresh the object.
        7. Return the persisted object.

        Transaction commit is intentionally handled by get_db().
        """

        user = await self._resolve_owner(owner_id)

        if user is None:
            raise ValueError(
                f"User '{owner_id}' not found."
            )

        # Generate a unique project code.
        project_code = (
            getattr(payload, "project_code", None)
            or f"prj_{uuid.uuid4().hex[:8]}"
        )

        project = Project(
            project_code=project_code,
            workspace_id=user.workspace_id,
            owner_id=user.id,
            project_name=payload.title,
            description=payload.description,
            target_audience=payload.target_audience,
            project_type="standard",
            status="active",
        )

        self.db.add(project)

        # Flush sends INSERT to PostgreSQL without committing the
        # request transaction. This lets us obtain generated values.
        await self.db.flush()

        # Load generated database values such as id/created_at.
        await self.db.refresh(project)

        return project

    # ---------------------------------------------------------------------
    # LIST BY OWNER
    # ---------------------------------------------------------------------

    async def get_by_owner(
        self,
        owner_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Project]:
        """
        Retrieve projects belonging to the authenticated Product Manager.

        This intentionally queries Project.owner_id directly after
        resolving the authenticated user.

        This preserves the successful GET behavior already demonstrated
        by the application.
        """

        user = await self._resolve_owner(owner_id)

        if user is None:
            raise ValueError(
                f"User '{owner_id}' not found."
            )

        # Defensive pagination.
        skip = max(int(skip), 0)
        limit = max(min(int(limit), 100), 1)

        result = await self.db.execute(
            select(Project)
            .where(
                Project.owner_id == user.id
            )
            .order_by(
                Project.created_at.desc()
            )
            .offset(skip)
            .limit(limit)
        )

        projects = result.scalars().all()

        return list(projects)

    # ---------------------------------------------------------------------
    # GET ONE
    # ---------------------------------------------------------------------

    async def get_by_id(
        self,
        project_id: str,
        owner_id: str,
    ) -> Optional[Project]:
        """
        Retrieve one project belonging to the authenticated owner.

        Returns None when:
        - the owner does not exist
        - the project does not exist
        - the project belongs to another owner
        """

        user = await self._resolve_owner(owner_id)

        if user is None:
            return None

        # Validate the project UUID before querying PostgreSQL.
        try:
            project_uuid = uuid.UUID(str(project_id))
        except (ValueError, TypeError, AttributeError):
            return None

        result = await self.db.execute(
            select(Project).where(
                Project.id == project_uuid,
                Project.owner_id == user.id,
            )
        )

        return result.scalar_one_or_none()

    # ---------------------------------------------------------------------
    # UPDATE
    # ---------------------------------------------------------------------

    async def update(
        self,
        project_id: str,
        payload: ProjectUpdate,
        owner_id: str,
    ) -> Optional[Project]:
        """
        Update an existing project owned by the authenticated user.

        Only fields supplied by the request are updated.
        """

        project = await self.get_by_id(
            project_id=project_id,
            owner_id=owner_id,
        )

        if project is None:
            return None

        # Pydantic v2.
        update_data = payload.model_dump(
            exclude_unset=True,
            exclude_none=False,
        )

        # -------------------------------------------------------------
        # API -> database field mapping
        # -------------------------------------------------------------

        if "title" in update_data:
            project.project_name = update_data.pop("title")

        # -------------------------------------------------------------
        # Fields that exist in the current Project ORM model.
        # -------------------------------------------------------------

        allowed_fields = {
            "description",
            "target_audience",
            "technology_stack",
            "status",
            "budget_usd",
            "start_date",
            "end_date",
            "project_type",
        }

        for field_name, value in update_data.items():
            if field_name in allowed_fields:
                setattr(
                    project,
                    field_name,
                    value,
                )

        await self.db.flush()
        await self.db.refresh(project)

        return project

    # ---------------------------------------------------------------------
    # DELETE
    # ---------------------------------------------------------------------

    async def delete(
        self,
        project_id: str,
        owner_id: str,
    ) -> bool:
        """
        Delete a project belonging to the authenticated owner.

        Returns:
            True  -> project was found and deleted.
            False -> project was not found/inaccessible.
        """

        project = await self.get_by_id(
            project_id=project_id,
            owner_id=owner_id,
        )

        if project is None:
            return False

        await self.db.delete(project)

        # Flush the deletion but leave transaction commit to get_db().
        await self.db.flush()

        return True