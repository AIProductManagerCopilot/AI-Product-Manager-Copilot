"""
Core Security Utilities for Authentication and JWT Verification.
"""

import os
from typing import Any, Dict, Optional
import jwt
import structlog
from app.core.exceptions import UnauthorizedAccessException

logger = structlog.get_logger(__name__)

# System fallback secret for development environments
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev_super_secret_key_change_in_prod")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and verifies an incoming Bearer JWT token.
    Raises UnauthorizedAccessException if invalid or expired.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: Optional[str] = payload.get("sub") or payload.get("user_id")
        if not user_id:
            raise UnauthorizedAccessException("Token payload is missing subject/user_id claim.")
        return payload

    except jwt.ExpiredSignatureError:
        logger.warning("Authentication failed: Token expired")
        raise UnauthorizedAccessException("Authentication token has expired.")
    except jwt.PyJWTError as exc:
        logger.warning("Authentication failed: Invalid token signature", error=str(exc))
        raise UnauthorizedAccessException("Invalid authentication token signature.")