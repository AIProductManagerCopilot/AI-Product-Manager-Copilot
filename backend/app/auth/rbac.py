# File: backend/app/auth/rbac.py
from typing import List, Dict, Any
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app.auth.firebase import verify_firebase_token

# Native FastAPI security helper that auto-detects Authorization headers
security_scheme = HTTPBearer()


class RoleChecker:
    """Dependency validator for enforcing Role-Based Access Control (RBAC)."""

    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(
        self, 
        credentials: HTTPAuthorizationCredentials = Security(security_scheme)
    ) -> Dict[str, Any]:
        """Validates incoming Firebase Bearer token and checks user role against allowed roles."""
        # 1. Verify token status via Firebase SDK
        claims = verify_firebase_token(credentials.credentials)

        # 2. Extract custom claim role (defaulting to 'viewer' if not set)
        user_role = claims.get("role", "viewer")

        # 3. Assess context access boundaries
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Insufficient permissions for this workspace action.",
            )

        return claims