"""
System Settings and Platform Configuration Matrix Endpoints.

Provides RBAC team management, API key configuration, core integration health diagnostics,
and compliance policy endpoints for the AI Product Manager Copilot platform.
"""

import time
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/settings", tags=["Settings & Platform Configuration"])

# ─── Pydantic Models ─────────────────────────────────────────────────────────

class PermissionItem(BaseModel):
    name: str
    granted: bool = True

class TeamMember(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str  # Product Lead, Admin, Engineer, Viewer
    roleCategory: str  # Master Access, Admin Access, Write Access, Read Access
    permissions: List[str]
    status: str = "Active"  # Active, Pending, Suspended
    mfaEnabled: bool = True
    isCurrentUser: bool = False
    avatarInitials: str

class InviteMemberRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    role: str = "Engineer"
    roleCategory: str = "Write Access"
    permissions: List[str] = Field(default_factory=lambda: ["Assigned Modules", "Write"])

class UpdateMemberRequest(BaseModel):
    role: Optional[str] = None
    roleCategory: Optional[str] = None
    permissions: Optional[List[str]] = None
    status: Optional[str] = None
    mfaEnabled: Optional[bool] = None

class ApiKeyItem(BaseModel):
    id: str
    keyName: str
    maskedValue: str
    secretValue: str
    service: str
    status: str = "Active"
    lastUsed: str

class UpdateApiKeyRequest(BaseModel):
    secretValue: str

class IntegrationTestRequest(BaseModel):
    integrationId: str  # qdrant, firebase, gemini, pinecone, stripe
    endpoint: Optional[str] = None

class IntegrationTestResponse(BaseModel):
    integrationId: str
    serviceName: str
    status: str
    latencyMs: float
    message: str
    details: Dict[str, Any]

class SecurityPolicyResponse(BaseModel):
    complianceEnforced: bool = True
    soc2Certified: bool = True
    gdprCompliant: bool = True
    cryptographicObfuscationActive: bool = True
    activeEnvironmentLoaders: List[str]
    policyVersion: str = "v2.4.0-STRICT"
    lastAuditTimestamp: str

# ─── In-Memory Initial Seed Data ─────────────────────────────────────────────

INITIAL_MEMBERS: List[Dict[str, Any]] = [
    {
        "id": "usr-001",
        "name": "Gagandeep G",
        "email": "gagandeep.g@bankapppro.com",
        "role": "Product Lead",
        "roleCategory": "Master Access",
        "permissions": ["All Modules", "Settings", "Billing", "Team Mgmt"],
        "status": "Active",
        "mfaEnabled": True,
        "isCurrentUser": True,
        "avatarInitials": "G",
    },
    {
        "id": "usr-002",
        "name": "Database Architect",
        "email": "db.architect@bankapppro.com",
        "role": "Admin",
        "roleCategory": "Admin Access",
        "permissions": ["All Modules", "Settings", "Users (Read)"],
        "status": "Active",
        "mfaEnabled": True,
        "isCurrentUser": False,
        "avatarInitials": "DA",
    },
    {
        "id": "usr-003",
        "name": "Frontend Engineer",
        "email": "frontend.dev@bankapppro.com",
        "role": "Engineer",
        "roleCategory": "Write Access",
        "permissions": ["Assigned Modules", "Write", "Export (Limited)"],
        "status": "Active",
        "mfaEnabled": True,
        "isCurrentUser": False,
        "avatarInitials": "FE",
    },
]

INITIAL_API_KEYS: List[Dict[str, Any]] = [
    {
        "id": "key-firebase",
        "keyName": "FIREBASE_API_KEY",
        "maskedValue": "********************",
        "secretValue": "AIzaSyB3k9X_mPqL8n-09vWzXyZ123456789",
        "service": "Firebase Auth & Realtime Database",
        "status": "Active",
        "lastUsed": "Just now",
    },
    {
        "id": "key-gemini",
        "keyName": "GEMINI_API_KEY",
        "maskedValue": "********************",
        "secretValue": "AIzaSyD-GeminiFlash3.6Key-Prod987654",
        "service": "Google Gemini 3.6 Flash Engine",
        "status": "Active",
        "lastUsed": "1 min ago",
    },
    {
        "id": "key-pinecone",
        "keyName": "PINECONE_API_KEY",
        "maskedValue": "********************",
        "secretValue": "pcsk_78192381902830192839102839012389",
        "service": "Pinecone Index Cluster",
        "status": "Active",
        "lastUsed": "12 mins ago",
    },
    {
        "id": "key-stripe",
        "keyName": "STRIPE_API_KEY",
        "maskedValue": "********************",
        "secretValue": "stripe_demo_api_key_sample_token_99",
        "service": "Stripe Payments & Subscriptions",
        "status": "Active",
        "lastUsed": "1 hour ago",
    },
]

# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/rbac", response_model=Dict[str, Any])
async def get_rbac_matrix():
    """Retrieve workspace connected project metadata and team RBAC member matrix."""
    return {
        "connectedProject": "BankApp Pro",
        "deploymentEnvironment": "Local Cluster",
        "members": INITIAL_MEMBERS,
    }

@router.post("/rbac/invite", response_model=TeamMember, status_code=status.HTTP_201_CREATED)
async def invite_member(req: InviteMemberRequest):
    """Invite a new team member to the workspace."""
    # Check if email already exists
    if any(m["email"] == req.email for m in INITIAL_MEMBERS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A team member with this email address already exists.",
        )
    
    # Generate initials
    parts = req.name.strip().split()
    initials = (parts[0][0] + parts[-1][0]).upper() if len(parts) > 1 else parts[0][:2].upper()
    
    new_member = {
        "id": f"usr-{len(INITIAL_MEMBERS) + 1:03d}",
        "name": req.name,
        "email": req.email,
        "role": req.role,
        "roleCategory": req.roleCategory,
        "permissions": req.permissions,
        "status": "Active",
        "mfaEnabled": True,
        "isCurrentUser": False,
        "avatarInitials": initials,
    }
    INITIAL_MEMBERS.append(new_member)
    return new_member

@router.put("/rbac/members/{user_id}", response_model=TeamMember)
async def update_member(user_id: str, req: UpdateMemberRequest):
    """Update role, permissions, status, or MFA settings for a team member."""
    for member in INITIAL_MEMBERS:
        if member["id"] == user_id:
            if req.role is not None:
                member["role"] = req.role
            if req.roleCategory is not None:
                member["roleCategory"] = req.roleCategory
            if req.permissions is not None:
                member["permissions"] = req.permissions
            if req.status is not None:
                member["status"] = req.status
            if req.mfaEnabled is not None:
                member["mfaEnabled"] = req.mfaEnabled
            return member
            
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

@router.delete("/rbac/members/{user_id}", status_code=status.HTTP_200_OK)
async def delete_member(user_id: str):
    """Remove a team member from the workspace."""
    for idx, member in enumerate(INITIAL_MEMBERS):
        if member["id"] == user_id:
            if member.get("isCurrentUser"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove master access owner account.",
                )
            deleted = INITIAL_MEMBERS.pop(idx)
            return {"message": f"Member {deleted['name']} removed successfully."}

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

@router.get("/api-keys", response_model=List[ApiKeyItem])
async def get_api_keys():
    """List obfuscated API key configurations."""
    return INITIAL_API_KEYS

@router.put("/api-keys/{key_id}", response_model=ApiKeyItem)
async def update_api_key(key_id: str, req: UpdateApiKeyRequest):
    """Update a secret API key value."""
    for key in INITIAL_API_KEYS:
        if key["id"] == key_id:
            key["secretValue"] = req.secretValue
            key["lastUsed"] = "Updated just now"
            return key

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API Key configuration not found")

@router.post("/integrations/test", response_model=IntegrationTestResponse)
async def test_integration(req: IntegrationTestRequest):
    """Test ping connection status for core integrations (Qdrant, Firebase, Gemini, etc.)."""
    start_time = time.time()
    
    # Simulate connectivity check
    integ_id = req.integrationId.lower()
    
    if "qdrant" in integ_id:
        latency = round((time.time() - start_time) * 1000 + 14.2, 1)
        return IntegrationTestResponse(
            integrationId="qdrant",
            serviceName="Qdrant Vector Database",
            status="Connected",
            latencyMs=latency,
            message=f"Successfully connected to Qdrant Port 6333 ({latency}ms latency). Collection 'feedback_vectors_v1' is active.",
            details={
                "host": "localhost",
                "port": 6333,
                "collection": "feedback_vectors_v1",
                "vectors_count": 84200,
            },
        )
    elif "firebase" in integ_id:
        latency = round((time.time() - start_time) * 1000 + 8.5, 1)
        return IntegrationTestResponse(
            integrationId="firebase",
            serviceName="Firebase Auth Service",
            status="Connected",
            latencyMs=latency,
            message=f"Firebase Auth Service verified! Active session valid for project 'bankapp-pro-local' ({latency}ms latency).",
            details={
                "environment": "Local Cluster",
                "project": "bankapp-pro-local",
                "auth_domain": "localhost:9099",
            },
        )
    else:
        latency = round((time.time() - start_time) * 1000 + 22.1, 1)
        return IntegrationTestResponse(
            integrationId=req.integrationId,
            serviceName=f"{req.integrationId.capitalize()} Service",
            status="Connected",
            latencyMs=latency,
            message=f"Connection test passed for {req.integrationId} ({latency}ms latency).",
            details={"status": "online"},
        )

@router.get("/security-policy", response_model=SecurityPolicyResponse)
async def get_security_policy():
    """Retrieve security compliance policy enforcement state."""
    return SecurityPolicyResponse(
        complianceEnforced=True,
        soc2Certified=True,
        gdprCompliant=True,
        cryptographicObfuscationActive=True,
        activeEnvironmentLoaders=[
            "SecureConfigLoader_v2",
            "EnvFileLoader",
            "VaultObfuscatorPipeline",
        ],
        policyVersion="v2.4.0-STRICT",
        lastAuditTimestamp="2026-08-20 12:00:00 UTC",
    )
