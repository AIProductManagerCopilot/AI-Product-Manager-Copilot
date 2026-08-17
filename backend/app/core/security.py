"""
Core Security Utilities for Authentication, Password Hashing, and JWT Verification.

Provides password hashing via native bcrypt (eliminating passlib 72-byte/version bugs), 
JWT token generation (access & refresh tokens) with custom claims, structlog structured logging, 
and exception-driven token verification.
"""

from datetime import datetime, timedelta, timezone
import os
from typing import Any, Dict, List, Optional, Union

import bcrypt
import jwt
import structlog

from app.core.config import settings

# Attempt to import custom exception with fallback to FastAPI HTTP 401
try:
    from app.core.exceptions import UnauthorizedAccessException
except ImportError:
    from fastapi import HTTPException, status

    class UnauthorizedAccessException(HTTPException):  # type: ignore
        def __init__(self, detail: str):
            super().__init__(
                status_code=status.HTTP_401_UNAUTHORIZED, detail=detail
            )


logger = structlog.get_logger(__name__)

# -----------------------------------------------------------------------------
# Cryptographic & Environment Settings Configuration
# -----------------------------------------------------------------------------
SECRET_KEY = (
    getattr(settings, "SECRET_KEY", None)
    or os.getenv("JWT_SECRET_KEY")
    or os.getenv("SECRET_KEY")
    or "DEFAULT_UNSECURE_DEVELOPMENT_SECRET_KEY_CHANGE_IN_PROD"
)

ALGORITHM = (
    getattr(settings, "ALGORITHM", None)
    or os.getenv("JWT_ALGORITHM")
    or os.getenv("ALGORITHM")
    or "HS256"
)

ALLOWED_ALGORITHMS: List[str] = list({ALGORITHM, "HS256", "HS384", "HS512"})

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    getattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES", None)
    or os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
    or 30
)

REFRESH_TOKEN_EXPIRE_DAYS = int(
    getattr(settings, "REFRESH_TOKEN_EXPIRE_DAYS", None)
    or os.getenv("REFRESH_TOKEN_EXPIRE_DAYS")
    or 7
)


# -----------------------------------------------------------------------------
# Password Hashing Utilities (Direct bcrypt implementation)
# -----------------------------------------------------------------------------
def _truncate_password(password: str) -> bytes:
    """Ensures password does not exceed bcrypt 72-byte limit."""
    pwd_bytes = password.encode("utf-8")
    return pwd_bytes[:72]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain-text password against a hashed password string."""
    try:
        password_bytes = _truncate_password(plain_password)
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception as exc:
        logger.error("Password verification failed", error=str(exc))
        return False


def get_password_hash(password: str) -> str:
    """Generates a secure salted bcrypt hash for the provided password."""
    password_bytes = _truncate_password(password)
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


# -----------------------------------------------------------------------------
# JWT Token Generation
# -----------------------------------------------------------------------------
def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
    claims: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Generates a signed JWT access token with expiration and custom payload claims.

    :param subject: Primary user identifier (UUID or email).
    :param expires_delta: Optional custom duration override.
    :param extra_claims: Additional key-value metadata to embed in payload.
    :param claims: Alias for extra_claims.
    :return: Encoded JWT string.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "user_id": str(subject),
        "iat": now,
        "exp": expire,
        "type": "access",
    }

    if extra_claims:
        to_encode.update(extra_claims)
    if claims:
        to_encode.update(claims)

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
    claims: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Generates a signed JWT refresh token with extended validity duration.

    :param subject: Primary user identifier (UUID or email).
    :param expires_delta: Optional custom duration override.
    :param extra_claims: Additional key-value metadata to embed in payload.
    :param claims: Alias for extra_claims.
    :return: Encoded JWT string.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "user_id": str(subject),
        "iat": now,
        "exp": expire,
        "type": "refresh",
    }

    if extra_claims:
        to_encode.update(extra_claims)
    if claims:
        to_encode.update(claims)

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# -----------------------------------------------------------------------------
# JWT Decoding & Verification
# -----------------------------------------------------------------------------
def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates a JWT token payload without raising exceptions.

    :param token: Raw JWT token string.
    :return: Decoded payload dictionary if valid, else None.
    """
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=ALLOWED_ALGORITHMS,
            options={"verify_aud": False},
        )
        return payload
    except Exception as exc:
        logger.warning("JWT decoding error", error=str(exc))
        return None


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and verifies an incoming Bearer JWT token signature and expiration.
    
    :param token: Raw Bearer JWT string.
    :return: Decoded payload claim dictionary.
    :raises UnauthorizedAccessException: If token signature is invalid, missing subject, or expired.
    """
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=ALLOWED_ALGORITHMS,
            options={"verify_aud": False},
        )
        user_id: Optional[str] = payload.get("sub") or payload.get("user_id")
        if not user_id:
            raise UnauthorizedAccessException(
                "Token payload is missing subject/user_id claim."
            )
        return payload

    except jwt.ExpiredSignatureError:
        logger.warning("Authentication failed: Token expired")
        raise UnauthorizedAccessException("Authentication token has expired.")
    except (jwt.PyJWTError, Exception) as exc:
        logger.warning(
            "Authentication failed: Invalid token signature", error=str(exc)
        )
        raise UnauthorizedAccessException("Invalid authentication token signature.")