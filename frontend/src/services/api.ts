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

export async function saveLastProject(last_project_id: number | null) {
  const res = await fetch(`${API_BASE}/projects/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ last_project_id }),
  });
  return res.json();
}

export async function getProjectSettings() {
  const res = await fetch(`${API_BASE}/projects/settings`);
  return res.json();
}

export async function addNames(projectId: number, names: string) {
  const res = await fetch(`${API_BASE}/picker/${projectId}/names`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ names }),
  });
  return res.json();
}

export async function spin(projectId: number) {
  const res = await fetch(`${API_BASE}/picker/${projectId}/spin`, { method: 'POST' });
  return res.json();
}

export async function undo(projectId: number) {
  const res = await fetch(`${API_BASE}/picker/${projectId}/undo`, { method: 'POST' });
  return res.json();
}

export async function resetRound(projectId: number) {
  const res = await fetch(`${API_BASE}/picker/${projectId}/reset`, { method: 'POST' });
  return res.json();
}

export async function shuffle(projectId: number) {
  const res = await fetch(`${API_BASE}/picker/${projectId}/shuffle`, { method: 'POST' });
  return res.json();
}

export async function clearLists(projectId: number) {
  const res = await fetch(`${API_BASE}/picker/${projectId}/clear`, { method: 'POST' });
  return res.json();
}

export async function updateTitle(projectId: number, kind: 'pickable' | 'picked', title: string) {
  const res = await fetch(`${API_BASE}/picker/${projectId}/titles/${kind}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  return res.json();
}

export async function getState(projectId: number) {
  const res = await fetch(`${API_BASE}/picker/${projectId}/state`);
  return res.json();
}
