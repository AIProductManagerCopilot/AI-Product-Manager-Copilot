import uuid
from sqlalchemy import Column, String, ForeignKey, Text, Float, Integer, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

JSON_TYPE = JSONB().with_variant(JSON(), "sqlite")

Base = declarative_base()

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_code = Column(
    String(20),
    unique=True,
    nullable=False,
    index=True
    )
    organization_name = Column(String(255), nullable=False)
    industry = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    employee_count = Column(Integer, nullable=False)
    subscription_plan = Column(String(50), nullable=False)
    workspaces = relationship(
        "Workspace",
        back_populates="organization",
        cascade="all, delete-orphan"
    )
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_code = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )
    org_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    workspace_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)    
    organization = relationship(
        "Organization",
        back_populates="workspaces"
    )
    projects = relationship(
        "Project",
        back_populates="workspace",
        cascade="all, delete-orphan"
    )
    users = relationship(
        "User",
        back_populates="workspace",
        cascade="all, delete-orphan"
    )
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_code = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    country = Column(String(100), nullable=False)
    workspace = relationship(
        "Workspace",
        back_populates="users"
    )
    owned_projects = relationship(
        "Project",
        back_populates="owner"
    )
    assigned_tickets = relationship(
        "Ticket",
        back_populates="assigned_user"
    )
    feedback_entries = relationship(
        "Feedback",
        back_populates="user"
    )
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

class Project(Base):
    __tablename__ = "projects"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_code = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    project_name = Column(String(255), nullable=False)
    project_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    target_audience = Column(
        JSON_TYPE,
        nullable=True
    )
    technology_stack = Column(Text, nullable=True)
    status = Column(String(50), nullable=False)
    budget_usd = Column(Float, nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    workspace = relationship(
        "Workspace",
        back_populates="projects"
    )
    owner = relationship(
        "User",
        back_populates="owned_projects"
    )
    feedback = relationship(
        "Feedback",
        back_populates="project",
        cascade="all, delete-orphan"
    )
    sprints = relationship(
        "Sprint",
        back_populates="project",
        cascade="all, delete-orphan"
    )
    features = relationship(
        "Feature",
        back_populates="project",
        cascade="all, delete-orphan"
    )
    tickets = relationship(
        "Ticket",
        back_populates="project",
        cascade="all, delete-orphan"
    )
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

class Sprint(Base):
    __tablename__ = "sprints"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sprint_code = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    sprint_name = Column(String(255), nullable=False)
    goal = Column(Text, nullable=True)
    status = Column(String(50), nullable=False)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    project = relationship(
        "Project",
        back_populates="sprints"
    )
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

class Feature(Base):
    __tablename__ = "features"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    feature_code = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    feature_name = Column(String(255), nullable=False)
    priority = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    estimated_story_points = Column(Integer, nullable=False)
    project = relationship(
        "Project",
        back_populates="features"
    )
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_code = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    assigned_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    ticket_title = Column(String(255), nullable=False)
    ticket_type = Column(String(100), nullable=False)
    priority = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    story_points = Column(Integer, nullable=True)
    project = relationship(
        "Project",
        back_populates="tickets"
    )
    assigned_user = relationship(
        "User",
        back_populates="assigned_tickets"
    )
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    feedback_code = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    feedback_type = Column(String(100), nullable=False)
    feedback_text = Column(Text, nullable=False)
    priority = Column(String(50), nullable=False)
    sentiment = Column(String(50), nullable=False)
    channel = Column(String(100), nullable=False)
    project = relationship(
        "Project",
        back_populates="feedback"
    )
    user = relationship(
        "User",
        back_populates="feedback_entries"
    )
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
        index=True
    )
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
