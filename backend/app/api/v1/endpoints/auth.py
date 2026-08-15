"""
Authentication API Endpoint Router.

Handles user registration, login authentication, token refreshing, session logout,
and current user profile retrieval.
"""

from datetime import datetime, timedelta, timezone
import hashlib
import structlog
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.exceptions import ConflictException, UnauthorizedAccessException
from app.core.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.user import RefreshToken, User
from app.schemas.auth import (
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.schemas.common import APIResponse

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new Product Manager account",
)
async def register(
    payload: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> APIResponse[UserResponse]:
    """Registers a new Product Manager account after checking for email collisions."""
    # Check if user already exists
    stmt = select(User).where(User.email == payload.email, User.is_deleted == False)  # noqa: E712
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise ConflictException("An account with this email address already exists.")

    hashed_pwd = get_password_hash(payload.password)
    
    # Construct new User entity handling all optional payload attributes safely
    new_user = User(
        email=payload.email,
        hashed_password=hashed_pwd,
        full_name=getattr(payload, "full_name", None) or f"{getattr(payload, 'first_name', '')} {getattr(payload, 'last_name', '')}".strip() or "Product Manager",
        first_name=getattr(payload, "first_name", None),
        last_name=getattr(payload, "last_name", None),
        country=getattr(payload, "country", None),
        is_active=True,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    logger.info("New user registered", user_id=str(new_user.id), email=new_user.email)
    return APIResponse(data=UserResponse.model_validate(new_user))


@router.post(
    "/login",
    response_model=APIResponse[TokenResponse],
    summary="Authenticate user and issue JWT access/refresh tokens",
)
async def login(
    payload: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> APIResponse[TokenResponse]:
    """Authenticates email/password credentials and issues JWT token pair."""
    stmt = select(User).where(User.email == payload.email, User.is_deleted == False)  # noqa: E712
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise UnauthorizedAccessException("Invalid email or password.")

    if not user.is_active:
        raise UnauthorizedAccessException("User account is deactivated.")

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    # Persist refresh token hash in DB
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    refresh_entity = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(refresh_entity)
    await db.commit()

    token_data = TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return APIResponse(data=token_data)


@router.post(
    "/refresh",
    response_model=APIResponse[TokenResponse],
    summary="Rotate refresh token and issue a new access token",
)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> APIResponse[TokenResponse]:
    """Decodes refresh token, validates against DB hash, and issues new token pair."""
    token_payload = decode_token(payload.refresh_token)
    if not token_payload or token_payload.get("type") != "refresh":
        raise UnauthorizedAccessException("Invalid or expired refresh token.")

    user_id_str = token_payload.get("sub") or token_payload.get("user_id")
    if not user_id_str:
        raise UnauthorizedAccessException("Invalid token payload claims.")

    token_hash = hashlib.sha256(payload.refresh_token.encode()).hexdigest()
    stmt = select(RefreshToken).where(
        RefreshToken.token_hash == token_hash,
        RefreshToken.is_revoked == False,  # noqa: E712
    )
    result = await db.execute(stmt)
    token_record = result.scalar_one_or_none()

    if not token_record:
        raise UnauthorizedAccessException("Refresh token is invalid or has been revoked.")

    # Revoke used refresh token
    token_record.is_revoked = True

    # Issue new pair
    new_access_token = create_access_token(subject=user_id_str)
    new_refresh_token = create_refresh_token(subject=user_id_str)
    new_token_hash = hashlib.sha256(new_refresh_token.encode()).hexdigest()

    new_token_record = RefreshToken(
        user_id=token_record.user_id,
        token_hash=new_token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(new_token_record)
    await db.commit()

    token_data = TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return APIResponse(data=token_data)


@router.get(
    "/me",
    response_model=APIResponse[UserResponse],
    summary="Get authenticated Product Manager profile",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> APIResponse[UserResponse]:
    """Returns profile details of the current authenticated user."""
    return APIResponse(data=UserResponse.model_validate(current_user))