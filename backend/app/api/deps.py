"""
FastAPI Route Dependencies for Authentication, Database Session, and User Context.

Combines DB session injection, JWT Bearer token validation, local development bypass,
and Single Product Manager / Superuser context resolution.
"""

import os
import uuid
from typing import AsyncGenerator, Dict, Any, Optional

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import PermissionDeniedException, UnauthorizedAccessException
from app.core.security import decode_access_token, decode_token
from app.models.user import User

# Support both HTTPBearer and OAuth2 schemes for Swagger UI and Client headers
security_bearer = HTTPBearer(auto_error=False)
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)

# Standard mock ID for local dev bypass fallback
DEMO_PM_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def is_development_env() -> bool:
    """Evaluates whether current environment flags permit dev auth bypass."""
    env_str = os.getenv("ENV", os.getenv("ENVIRONMENT", "development")).lower()
    debug_str = os.getenv("DEBUG", "false").lower()
    return env_str in ("development", "dev", "local") or debug_str in ("true", "1")


def get_current_user_override() -> User:
    """Development-only bypass returning default Single Product Manager context."""
    return User(
        id=DEMO_PM_ID,
        email="pm@copilot.demo",
        full_name="Lead Product Manager",
        is_active=True,
        is_superuser=True,
        is_verified=True,
    )


async def get_current_user(
    bearer_creds: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    oauth2_token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency to validate JWT Bearer token and fetch the current authenticated Product Manager.
    Supports a development mode bypass when ENV=development or DEBUG=true.

    :param bearer_creds: Credentials extracted from HTTPBearer header.
    :param oauth2_token: Token extracted from OAuth2 scheme.
    :param db: Async SQLAlchemy database session.
    :return: Authenticated active User ORM instance.
    :raises UnauthorizedAccessException: If token is missing/invalid or user is inactive/deleted.
    """
    token: Optional[str] = None
    if bearer_creds and bearer_creds.credentials:
        token = bearer_creds.credentials
    elif oauth2_token:
        token = oauth2_token

    # 1. Development Bypass (allows unauthenticated requests during local dev)
    if is_development_env() and not token:
        dev_user = get_current_user_override()
        # Retrieve existing dev user from DB if seeded, else return model instance
        stmt = select(User).where(User.email == dev_user.email, User.is_deleted == False)  # noqa: E712
        result = await db.execute(stmt)
        existing_user = result.scalar_one_or_none()
        if existing_user:
            return existing_user
        return dev_user

    # 2. Token Extraction Validation
    if not token:
        raise UnauthorizedAccessException(
            message="Missing or invalid Bearer authentication token.",
            error_code="AUTHENTICATION_REQUIRED",
        )

    # 3. Token Decoding & Payload Validation
    try:
        payload = decode_access_token(token)
    except Exception as exc:
        raise UnauthorizedAccessException(
            message=getattr(exc, "message", "Provided authentication token is invalid or expired."),
            error_code="INVALID_TOKEN",
        )

    user_id_str: Optional[str] = (
        payload.get("sub") or payload.get("user_id") or payload.get("uid")
    )

    if not user_id_str:
        raise UnauthorizedAccessException(
            message="Token payload is missing subject/user_id claim.",
            error_code="INVALID_TOKEN",
        )

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        # Fallback check by email if identifier is not formatted as UUID
        stmt = select(User).where(
            (User.email == user_id_str) & (User.is_deleted == False)  # noqa: E712
        )
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            if not user.is_active:
                raise UnauthorizedAccessException("User account is deactivated.")
            return user
        raise UnauthorizedAccessException("Invalid user identifier format in token.")

    # 4. Fetch Product Manager entity from PostgreSQL
    stmt = select(User).where(User.id == user_uuid, User.is_deleted == False)  # noqa: E712
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        if is_development_env() and user_uuid == DEMO_PM_ID:
            return get_current_user_override()
        raise UnauthorizedAccessException("Authenticated user account no longer exists.")

    if not user.is_active:
        raise UnauthorizedAccessException("User account is deactivated.")

    return user


def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Validates that the authenticated user has superuser/admin status.

    :param current_user: Injected authenticated user.
    :return: User instance if superuser status is confirmed.
    :raises PermissionDeniedException: If user lacks admin status.
    """
    if not current_user.is_superuser:
        raise PermissionDeniedException(
            message="Superuser privileges are required to perform this action.",
            error_code="FORBIDDEN",
        )
    return current_user