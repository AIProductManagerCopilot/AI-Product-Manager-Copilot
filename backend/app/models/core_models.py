import uuid
import datetime
from sqlalchemy import Column, String, ForeignKey, Text, Float, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    workspaces = relationship("Workspace", back_populates="organization", cascade="all, delete-orphan")

class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    organization = relationship("Organization", back_populates="workspaces")
    projects = relationship("Project", back_populates="workspace", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    workspace = relationship("Workspace", back_populates="projects")
    feedback_items = relationship("FeedbackItem", back_populates="project")

class FeatureRequest(Base):
    __tablename__ = "feature_requests"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    rice_score = Column(Integer, default=0)
    feedback_items = relationship("FeedbackItem", back_populates="feature_request")
    prd = relationship("PRD", uselist=False, back_populates="feature_request")

class FeedbackItem(Base):
    __tablename__ = "feedback_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    feature_request_id = Column(UUID(as_uuid=True), ForeignKey("feature_requests.id", ondelete="SET NULL"), nullable=True)
    raw_text = Column(Text, nullable=False)
    cleaned_text = Column(Text, nullable=True)
    sentiment_score = Column(Float, default=0.0)
    source = Column(String(50), default="csv")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    project = relationship("Project", back_populates="feedback_items")
    feature_request = relationship("FeatureRequest", back_populates="feedback_items")

class PRD(Base):
    __tablename__ = "prds"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    feature_request_id = Column(UUID(as_uuid=True), ForeignKey("feature_requests.id", ondelete="CASCADE"), nullable=False)
    content_markdown = Column(Text, nullable=False)
    version = Column(Integer, default=1)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    feature_request = relationship("FeatureRequest", back_populates="prd")