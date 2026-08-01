import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.exceptions import EntityNotFoundException

client = TestClient(app)

@app.get("/test/raise-not-found")
async def dummy_route():
    raise EntityNotFoundException("Project", "proj_999")

def test_entity_not_found_exception_handling():
    response = client.get("/test/raise-not-found")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "ENTITY_NOT_FOUND"
    assert "proj_999" in data["message"]
    assert "X-Request-ID" in response.headers