from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_project_update_title_and_settings():
    response = client.post('/projects', json={'title': 'API Project'})
    assert response.status_code == 200
    data = response.json()
    assert data['title'] == 'API Project'

    patch = client.patch(f"/picker/{data['id']}/titles/pickable", json={'title': 'Roster'})
    assert patch.status_code == 200
    assert patch.json()['title'] == 'Roster'

    rename = client.patch(f"/projects/{data['id']}", json={'title': 'Renamed Project'})
    assert rename.status_code == 200
    assert rename.json()['title'] == 'Renamed Project'

    set_settings = client.patch('/projects/settings', json={'last_project_id': data['id']})
    assert set_settings.status_code == 200
    assert set_settings.json()['last_project_id'] == data['id']

    get_settings = client.get('/projects/settings')
    assert get_settings.status_code == 200
    assert get_settings.json()['last_project_id'] == data['id']
