"""
Authentication and User Account Pydantic Schemas.

Defines request and response data transfer objects (DTOs) for account registration,
login credentials, JWT token payloads, and profile retrieval.
"""

from datetime import datetime
import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegisterRequest(BaseModel):
    """Payload schema for Product Manager account registration."""

    email: EmailStr = Field(..., description="Primary email address")
    password: str = Field(..., min_length=8, max_length=128, description="Plaintext password")
    full_name: Optional[str] = Field(None, max_length=255, description="Full display name")


class UserLoginRequest(BaseModel):
    """Payload schema for user authentication."""

    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Plaintext password")


class TokenResponse(BaseModel):
    """Response payload returning generated JWT access and refresh tokens."""

    access_token: str = Field(..., description="Signed Bearer JWT access token")
    refresh_token: str = Field(..., description="Signed JWT refresh token")
    token_type: str = Field("bearer", description="Token protocol authorization header type")
    expires_in: int = Field(..., description="Access token expiration window in seconds")


class RefreshTokenRequest(BaseModel):
    """Payload schema for requesting a new access token using a refresh token."""

    refresh_token: str = Field(..., description="Raw refresh token string")


class UserResponse(BaseModel):
    """Public user profile response DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(..., description="Unique user UUID")
    email: EmailStr = Field(..., description="Primary email address")
    full_name: Optional[str] = Field(None, description="Full display name")
    is_active: bool = Field(True, description="Account active status flag")
    is_superuser: bool = Field(False, description="Superuser privilege flag")
    is_verified: bool = Field(True, description="Account verification status flag")
    created_at: Optional[datetime] = Field(None, description="Account creation timestamp")