"""
Product Management API Endpoint Router.

Provides CRUD endpoints for managing software products and their related features and specifications.
"""

import math
import re
import uuid
from typing import Any, Dict, List, Optional
import structlog
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.core.exceptions import ConflictException, NotFoundException
from app.models.product import Product
from app.models.user import User
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.product import (
    ProductCreate,
    ProductDetailResponse,
    ProductResponse,
    ProductUpdate,
)

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/products", tags=["Products"])


def _extract_user_id(user: Any) -> uuid.UUID:
    """Extracts a valid UUID for owner_id from the user object or fallback."""
    if hasattr(user, "id") and isinstance(user.id, uuid.UUID):
        return user.id
    if hasattr(user, "id") and user.id:
        try:
            return uuid.UUID(str(user.id))
        except (ValueError, TypeError):
            pass
    if isinstance(user, dict) and "id" in user:
        try:
            return uuid.UUID(str(user["id"]))
        except (ValueError, TypeError):
            pass
    return uuid.UUID("00000000-0000-0000-0000-000000000001")


def _generate_slug(name: str) -> str:
    """Generates a URL-friendly slug from a product name."""
    clean = re.sub(r"[^\w\s-]", "", name).strip().lower()
    return re.sub(r"[-\s]+", "-", clean)


@router.get(
    "",
    response_model=APIResponse[PaginatedResponse[ProductResponse]],
    summary="List all active products",
)
async def list_products(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIResponse[PaginatedResponse[ProductResponse]]:
    """Retrieves a paginated list of products owned by or accessible to the current user."""
    owner_id = _extract_user_id(current_user)
    offset = (page - 1) * page_size

    # 1. Total count query
    count_stmt = (
        select(func.count(Product.id))
        .where(Product.owner_id == owner_id, Product.is_deleted == False)  # noqa: E712
    )
    total_count_res = await db.execute(count_stmt)
    total = total_count_res.scalar_one() or 0

    # 2. Items query
    stmt = (
        select(Product)
        .where(Product.owner_id == owner_id, Product.is_deleted == False)  # noqa: E712
        .order_by(Product.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    products = result.scalars().all()

    items = [ProductResponse.model_validate(p) for p in products]
    total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1
    has_next = page < total_pages
    has_previous = page > 1

    # Meta dictionary fulfilling PaginatedResponse schema constraints
    meta_payload = {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_items": total,
        "total_pages": total_pages,
        "has_next": has_next,
        "has_previous": has_previous,
        "has_prev": has_previous,
    }

    paginated = PaginatedResponse(
        items=items,
        meta=meta_payload,
    )
    return APIResponse(data=paginated)


@router.post(
    "",
    response_model=APIResponse[ProductResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product",
)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIResponse[ProductResponse]:
    """Creates a new product entity assigned to the authenticated user."""
    owner_id = _extract_user_id(current_user)
    slug = getattr(payload, "slug", None) or _generate_slug(payload.name)

    # Check for slug conflict
    stmt = select(Product).where(Product.slug == slug, Product.is_deleted == False)  # noqa: E712
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise ConflictException(f"A product with slug '{slug}' already exists.")

    product = Product(
        name=payload.name,
        slug=slug,
        description=getattr(payload, "description", None),
        owner_id=owner_id,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)

    logger.info("Created new product", product_id=str(product.id), slug=product.slug)
    return APIResponse(data=ProductResponse.model_validate(product))


@router.get(
    "/{product_id}",
    response_model=APIResponse[ProductDetailResponse],
    summary="Get product details with nested features and specifications",
)
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIResponse[ProductDetailResponse]:
    """Retrieves product details including eagerly-loaded features and specifications by ID."""
    owner_id = _extract_user_id(current_user)

    # Eagerly load features and specifications with selectinload to eliminate MissingGreenlet IO errors
    stmt = (
        select(Product)
        .options(
            selectinload(Product.features),
            selectinload(Product.specifications),
        )
        .where(
            Product.id == product_id,
            Product.owner_id == owner_id,
            Product.is_deleted == False,  # noqa: E712
        )
    )
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if not product:
        raise NotFoundException(f"Product with ID '{product_id}' not found.")

    return APIResponse(data=ProductDetailResponse.model_validate(product))


@router.patch(
    "/{product_id}",
    response_model=APIResponse[ProductResponse],
    summary="Update product details",
)
async def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIResponse[ProductResponse]:
    """Updates product attributes for an existing product."""
    owner_id = _extract_user_id(current_user)

    stmt = select(Product).where(
        Product.id == product_id,
        Product.owner_id == owner_id,
        Product.is_deleted == False,  # noqa: E712
    )
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if not product:
        raise NotFoundException(f"Product with ID '{product_id}' not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    await db.commit()
    await db.refresh(product)
    return APIResponse(data=ProductResponse.model_validate(product))


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete a product",
)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Soft deletes a product by marking is_deleted=True."""
    owner_id = _extract_user_id(current_user)

    stmt = select(Product).where(
        Product.id == product_id,
        Product.owner_id == owner_id,
        Product.is_deleted == False,  # noqa: E712
    )
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if not product:
        raise NotFoundException(f"Product with ID '{product_id}' not found.")

    product.is_deleted = True
    await db.commit()