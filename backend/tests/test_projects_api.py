from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_project_and_update_title():
    response = client.post('/projects', json={'title': 'API Project'})
    assert response.status_code == 200
    data = response.json()
    assert data['title'] == 'API Project'

    patch = client.patch(f"/picker/{data['id']}/titles/pickable", json={'title': 'Roster'})
    assert patch.status_code == 200
    assert patch.json()['title'] == 'Roster'
