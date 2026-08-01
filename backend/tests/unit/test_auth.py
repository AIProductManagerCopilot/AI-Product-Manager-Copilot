"""
Unit Tests for Security, Token Validation, and Workspace RBAC Dependencies.
"""

import jwt
import pytest
from app.core.security import decode_access_token, JWT_SECRET_KEY, JWT_ALGORITHM
from app.core.exceptions import UnauthorizedAccessException, PermissionDeniedException
from app.api.deps import verify_workspace_access

def test_valid_jwt_decode():
    payload = {"sub": "usr_12345", "email": "test@domain.com"}
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    decoded = decode_access_token(token)
    assert decoded["sub"] == "usr_12345"

def test_invalid_jwt_raises_unauthorized():
    with pytest.raises(UnauthorizedAccessException):
        decode_access_token("invalid.jwt.token")

def test_workspace_rbac_allowed():
    user = {"id": "usr_1", "workspaces": ["ws_alpha", "ws_beta"]}
    result = verify_workspace_access(workspace_id="ws_alpha", current_user=user)
    assert result == "ws_alpha"

def test_workspace_rbac_denied():
    user = {"id": "usr_1", "workspaces": ["ws_alpha"]}
    with pytest.raises(PermissionDeniedException):
        verify_workspace_access(workspace_id="ws_secret", current_user=user)