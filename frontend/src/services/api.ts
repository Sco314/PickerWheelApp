const API_BASE = 'http://localhost:8000';

export async function listProjects() {
  const res = await fetch(`${API_BASE}/projects`);
  return res.json();
}

export async function createProject(title: string) {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  return res.json();
}

export async function addNames(projectId: number, names: string) {
  return fetch(`${API_BASE}/picker/${projectId}/names`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ names }),
  });
}

export async function spin(projectId: number) {
  const res = await fetch(`${API_BASE}/picker/${projectId}/spin`, { method: 'POST' });
  return res.json();
}

export async function getState(projectId: number) {
  const res = await fetch(`${API_BASE}/picker/${projectId}/state`);
  return res.json();
}
