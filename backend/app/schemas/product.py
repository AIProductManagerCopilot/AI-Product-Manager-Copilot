"""
Product Manager Domain Pydantic Schemas.

Defines data transfer objects (DTOs) for Product, Feature, Specification,
and Roadmap CRUD operations and response serialization.
"""

from datetime import datetime
import uuid
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.product import FeaturePriority, FeatureStatus


# --- Feature Schemas ---

class FeatureBase(BaseModel):
    title: str = Field(..., max_length=255, description="Feature title")
    description: Optional[str] = Field(None, description="Detailed user story or acceptance criteria")
    status: FeatureStatus = Field(FeatureStatus.BACKLOG, description="Current lifecycle status")
    priority: FeaturePriority = Field(FeaturePriority.MEDIUM, description="Priority level")


class FeatureCreate(FeatureBase):
    pass


class FeatureUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    status: Optional[FeatureStatus] = None
    priority: Optional[FeaturePriority] = None


class FeatureResponse(FeatureBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# --- Specification Schemas ---

class SpecificationBase(BaseModel):
    title: str = Field(..., max_length=255, description="PRD Document Title")
    content: str = Field(..., description="Markdown specification content")
    version: str = Field("1.0.0", max_length=50, description="Semantic version string")


class SpecificationCreate(SpecificationBase):
    pass


class SpecificationResponse(SpecificationBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# --- Product Schemas ---

class ProductBase(BaseModel):
    name: str = Field(..., max_length=255, description="Product name")
    slug: str = Field(..., max_length=255, description="Unique URL slug")
    description: Optional[str] = Field(None, description="Product vision and summary")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ProductDetailResponse(ProductResponse):
    """Product response including nested features and specs."""

    features: List[FeatureResponse] = []
    specifications: List[SpecificationResponse] = []