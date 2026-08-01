"""
FastAPI Route Dependencies for Authentication, User Context, and Workspace RBAC.
"""

from typing import Dict, Any, Optional
from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import UnauthorizedAccessException, PermissionDeniedException
from app.core.security import decode_access_token

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> Dict[str, Any]:
    """
    Dependency that verifies the Authorization Bearer header.
    Returns the decoded user context dictionary.
    """
    if not credentials or not credentials.credentials:
        raise UnauthorizedAccessException("Missing or malformed Authorization Bearer header.")

    payload = decode_access_token(credentials.credentials)
    return {
        "id": payload.get("sub") or payload.get("user_id"),
        "email": payload.get("email", "dev@copilot.local"),
        "role": payload.get("role", "member"),
        "workspaces": payload.get("workspaces", ["*"]),  # '*' represents super-admin/dev mode
    }


def verify_workspace_access(
    workspace_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> str:
    """
    Dependency that enforces workspace-level RBAC.
    Ensures the authenticated user has authorization to access the target workspace.
    """
    allowed_workspaces = current_user.get("workspaces", [])
    
    # Check if user has global access or explicit membership in workspace_id
    if "*" not in allowed_workspaces and workspace_id not in allowed_workspaces:
        raise PermissionDeniedException(
            f"User '{current_user['id']}' does not have access to workspace '{workspace_id}'."
        )

    return workspace_id