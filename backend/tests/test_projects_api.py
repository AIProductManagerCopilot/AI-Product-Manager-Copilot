<<<<<<< HEAD
import uuid
=======
# File: backend/tests/test_projects_api.py
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from fastapi import FastAPI
<<<<<<< HEAD
from app.api.v1.projects import router as projects_router
from app.schemas.project import ProjectCreate, ProjectResponse
from app.core.database import SessionLocal
from app.models.core_models import User, Workspace, Organization
=======
from backend.app.api.v1.projects import router as projects_router
from backend.app.schemas.project import ProjectCreate, ProjectResponse
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d

# Initialize lightweight test harness
app = FastAPI()
app.include_router(projects_router, prefix="/api/v1")
client = TestClient(app)

# Mock user token claims
MOCK_PM_CLAIMS = {"uid": "usr_test_12345", "role": "product_manager"}
MOCK_VIEWER_CLAIMS = {"uid": "usr_test_67890", "role": "viewer"}

def test_pydantic_schema_validation_success():
    """Unit Test: Validates Pydantic schema parsing and whitespace stripping."""
    payload = {
        "title": "  AI Copilot Workspace  ",
        "description": "Validating automated PM features.",
        "target_audience": ["Product Managers", "Tech Leads"]
    }
    schema = ProjectCreate(**payload)
    assert schema.title == "AI Copilot Workspace"
    assert len(schema.target_audience) == 2

def test_pydantic_schema_validation_failure():
    """Unit Test: Ensures short or invalid titles fail schema validation."""
    payload = {
        "title": "AI",  # Min length is 3 characters
        "target_audience": []
    }
    with pytest.raises(ValueError):
        ProjectCreate(**payload)

<<<<<<< HEAD
@patch("app.auth.rbac.verify_firebase_token")
def test_create_project_endpoint_authorized(mock_verify_token):
    """Router Test: Verifies successful 201 Created response for authorized PM user."""
    mock_verify_token.return_value = MOCK_PM_CLAIMS

    # Ensure test hierarchy (Organization -> Workspace -> User) exists in DB
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.user_code == "usr_test_12345").first()
        if not existing_user:
            # 1. Parent Organization
            org = db.query(Organization).first()
            if not org:
                org = Organization(
                    organization_code="org_test_12345",
                    organization_name="Test Org",
                    industry="Technology",
                    country="US",
                    city="San Francisco",
                    employee_count=50,
                    subscription_plan="Enterprise"
                )
                db.add(org)
                db.commit()
                db.refresh(org)

            # 2. Parent Workspace
            workspace = db.query(Workspace).first()
            if not workspace:
                workspace = Workspace(
                    workspace_code="ws_test_12345",
                    workspace_name="Test Workspace",
                    org_id=org.id
                )
                db.add(workspace)
                db.commit()
                db.refresh(workspace)

            # 3. Test User
            test_user = User(
                user_code="usr_test_12345",
                workspace_id=workspace.id,
                email="test_pm@example.com",
                first_name="Test",
                last_name="PM",
                role="product_manager",
                country="US"
            )
            db.add(test_user)
            db.commit()
    finally:
        db.close()

=======
@patch("backend.app.auth.rbac.verify_firebase_token")
def test_create_project_endpoint_authorized(mock_verify_token):
    """Router Test: Verifies successful 201 Created response for authorized PM user."""
    mock_verify_token.return_value = MOCK_PM_CLAIMS
    
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
    payload = {
        "title": "Enterprise RAG Workspace",
        "description": "High throughput RAG workspace.",
        "target_audience": ["Enterprise PMs"]
    }
    headers = {"Authorization": "Bearer valid_mock_token"}
    response = client.post("/api/v1/projects", json=payload, headers=headers)
<<<<<<< HEAD
    assert response.status_code == 201

@patch("app.auth.rbac.verify_firebase_token")
=======
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Enterprise RAG Workspace"
    assert data["owner_id"] == "usr_test_12345"
    assert data["status"] == "active"

@patch("backend.app.auth.rbac.verify_firebase_token")
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
def test_create_project_endpoint_forbidden(mock_verify_token):
    """Router Test: Ensures users with insufficient roles receive a 403 Forbidden error."""
    mock_verify_token.return_value = MOCK_VIEWER_CLAIMS
    
    payload = {
        "title": "Enterprise RAG Workspace",
        "target_audience": ["Enterprise PMs"]
    }
    headers = {"Authorization": "Bearer viewer_token"}
    response = client.post("/api/v1/projects", json=payload, headers=headers)
    
    assert response.status_code == 403
    assert "Insufficient permissions" in response.json()["detail"]