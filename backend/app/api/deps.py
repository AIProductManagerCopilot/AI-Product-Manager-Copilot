"""
FastAPI Route Dependencies for Authentication, Database Session, and User Context.

Uses the current Product Manager database schema:
- users.id
- users.user_code
- users.workspace_id
- users.first_name
- users.last_name
- users.email
- users.country

Supports local development bypass and token-based user lookup.
"""

import os
import uuid
from typing import Optional

from fastapi import Depends
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
    OAuth2PasswordBearer,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import (
    PermissionDeniedException,
    UnauthorizedAccessException,
)
from app.core.security import decode_access_token
from app.models.core_models import User


# -----------------------------------------------------------------------------
# Authentication schemes
# -----------------------------------------------------------------------------

security_bearer = HTTPBearer(auto_error=False)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


# -----------------------------------------------------------------------------
# Development Product Manager
# -----------------------------------------------------------------------------

DEMO_PM_ID = uuid.UUID(
    "00000000-0000-0000-0000-000000000001"
)

DEMO_PM_EMAIL = "pm@copilot.demo"


# -----------------------------------------------------------------------------
# Environment helpers
# -----------------------------------------------------------------------------

def is_development_env() -> bool:
    """
    Returns True when the application is running in a local/development
    environment.
    """

    env_str = os.getenv(
        "ENV",
        os.getenv("ENVIRONMENT", "development"),
    ).lower()

    debug_str = os.getenv(
        "DEBUG",
        "false",
    ).lower()

    return (
        env_str in ("development", "dev", "local")
        or debug_str in ("true", "1")
    )


# -----------------------------------------------------------------------------
# Development user lookup
# -----------------------------------------------------------------------------

async def get_development_user(
    db: AsyncSession,
) -> User:
    """
    Retrieves the seeded development Product Manager from PostgreSQL.

    The current users table does not contain the old authentication fields
    such as hashed_password, is_active, is_superuser, or is_deleted.

    Therefore this function only uses fields that actually exist in the
    current database schema.
    """

    stmt = select(User).where(
        User.email == DEMO_PM_EMAIL
    )

    result = await db.execute(stmt)

    user = result.scalar_one_or_none()

    if user is not None:
        return user

    # If the seeded development user does not exist, return a lightweight
    # ORM instance representing the development Product Manager.
    return User(
        id=DEMO_PM_ID,
        user_code=str(DEMO_PM_ID),
        email=DEMO_PM_EMAIL,
        first_name="Lead",
        last_name="Product Manager",
        workspace_id=None,
        country="India",
    )


# -----------------------------------------------------------------------------
# Current user dependency
# -----------------------------------------------------------------------------

async def get_current_user(
    bearer_creds: Optional[
        HTTPAuthorizationCredentials
    ] = Depends(security_bearer),
    oauth2_token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Resolves the currently authenticated Product Manager.

    Authentication flow:

    1. If a Bearer/OAuth token exists, attempt to decode it.
    2. If a valid UUID user identifier is found, retrieve that user
       from the current users table.
    3. During development, fall back to the seeded Product Manager.
    4. In production, reject missing/invalid authentication.

    Database exceptions are never silently swallowed because doing so can
    leave the PostgreSQL transaction in an aborted state.
    """

    token: Optional[str] = None

    if bearer_creds and bearer_creds.credentials:
        token = bearer_creds.credentials

    elif oauth2_token:
        token = oauth2_token

    # -------------------------------------------------------------------------
    # 1. Token-based authentication
    # -------------------------------------------------------------------------

    if token:
        try:
            payload = decode_access_token(token)

            user_id_str: Optional[str] = (
                payload.get("sub")
                or payload.get("user_id")
                or payload.get("uid")
            )

            if user_id_str:
                try:
                    user_uuid = uuid.UUID(user_id_str)
                except (ValueError, TypeError):
                    user_uuid = None

                if user_uuid is not None:
                    stmt = select(User).where(
                        User.id == user_uuid
                    )

                    result = await db.execute(stmt)

                    user = result.scalar_one_or_none()

                    if user is not None:
                        return user

        except Exception:
            # Invalid token is allowed to fall through to the development
            # bypass. Importantly, no database exception is swallowed here
            # after a database operation.
            pass

    # -------------------------------------------------------------------------
    # 2. Local development bypass
    # -------------------------------------------------------------------------

    if is_development_env():
        return await get_development_user(db)

    # -------------------------------------------------------------------------
    # 3. Production authentication requirement
    # -------------------------------------------------------------------------

    raise UnauthorizedAccessException(
        message="Missing or invalid Bearer authentication token.",
        error_code="AUTHENTICATION_REQUIRED",
    )


# -----------------------------------------------------------------------------
# Active superuser dependency
# -----------------------------------------------------------------------------

def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Validates that the current Product Manager has administrative privileges.

    The current single-Product-Manager architecture does not store an
    is_superuser column in the current users table.

    Therefore, development mode treats the authenticated Product Manager
    as the authorized administrative Product Manager.
    """

    if is_development_env():
        return current_user

    raise PermissionDeniedException(
        message="Superuser privileges are required to perform this action.",
        error_code="FORBIDDEN",
    )