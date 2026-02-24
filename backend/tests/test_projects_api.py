from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_project():
    response = client.post("/projects", json={"title": "API Project"})
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "API Project"
