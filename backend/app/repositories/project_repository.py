"""
PostgreSQL repository implementation for Project Workspace operations.

This repository uses SQLAlchemy AsyncSession because the application's
database dependency is asynchronous.
"""

import uuid
from typing import List, Optional

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.core_models import Project, User
from app.repositories.interfaces import IProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectRepository(IProjectRepository):
    """
    PostgreSQL implementation of the Project Repository.

    Responsibilities:
    - Resolve authenticated owner to the database User (via UUID, user_code, or email)
    - Create projects
    - List projects owned by the authenticated Product Manager
    - Retrieve one project
    - Update projects
    - Delete projects
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    # ---------------------------------------------------------------------
    # OWNER RESOLUTION
    # ---------------------------------------------------------------------

    async def _resolve_owner(self, owner_id: str) -> Optional[User]:
        """
        Resolve the external owner identifier to the User ORM row.
        Checks by UUID primary key first, then falls back to user_code or email.
        """
        if not owner_id:
            return None

        # 1. Try owner_id as a UUID
        try:
            owner_uuid = uuid.UUID(str(owner_id))
            result = await self.db.execute(
                select(User).where(
                    or_(
                        User.id == owner_uuid,
                        User.user_code == str(owner_id),
                    )
                )
            )
            user = result.scalar_one_or_none()
            if user is not None:
                return user
        except (ValueError, TypeError, AttributeError):
            pass

        # 2. Fallback: Lookup by user_code or email
        result = await self.db.execute(
            select(User).where(
                or_(
                    User.user_code == str(owner_id),
                    User.email == str(owner_id),
                )
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
        """
        user = await self._resolve_owner(owner_id)

        if user is None:
            raise ValueError(f"User '{owner_id}' not found.")

        # Generate a unique project code if not provided
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
        await self.db.flush()
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
        """
        user = await self._resolve_owner(owner_id)

        if user is None:
            raise ValueError(f"User '{owner_id}' not found.")

        skip = max(int(skip), 0)
        limit = max(min(int(limit), 100), 1)

        stmt = select(Project).where(Project.owner_id == user.id)

        # Apply soft-delete check if is_deleted column exists on Project
        if hasattr(Project, "is_deleted"):
            stmt = stmt.where(Project.is_deleted == False)  # noqa: E712

        # Sort by creation date if available
        if hasattr(Project, "created_at"):
            stmt = stmt.order_by(Project.created_at.desc())

        stmt = stmt.offset(skip).limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

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
        """
        user = await self._resolve_owner(owner_id)

        if user is None:
            return None

        try:
            project_uuid = uuid.UUID(str(project_id))
        except (ValueError, TypeError, AttributeError):
            return None

        stmt = select(Project).where(
            Project.id == project_uuid,
            Project.owner_id == user.id,
        )

        if hasattr(Project, "is_deleted"):
            stmt = stmt.where(Project.is_deleted == False)  # noqa: E712

        result = await self.db.execute(stmt)
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
        """
        project = await self.get_by_id(
            project_id=project_id,
            owner_id=owner_id,
        )

        if project is None:
            return None

        update_data = payload.model_dump(
            exclude_unset=True,
            exclude_none=False,
        )

        # Map API title to database column project_name
        if "title" in update_data:
            project.project_name = update_data.pop("title")

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
            if field_name in allowed_fields and hasattr(project, field_name):
                setattr(project, field_name, value)

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
        """
        project = await self.get_by_id(
            project_id=project_id,
            owner_id=owner_id,
        )

        if project is None:
            return False

        # Soft delete if column is present, otherwise hard delete
        if hasattr(project, "is_deleted"):
            project.is_deleted = True
            await self.db.flush()
        else:
            await self.db.delete(project)
            await self.db.flush()

        return True