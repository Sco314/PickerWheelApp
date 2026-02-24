import { useState } from 'react';
import type { Class, Project } from '../services/storage';
import {
  createProject,
  deleteProject,
  getClasses,
  getProjects,
} from '../services/storage';

type Props = {
  onSelectProject: (projectId: string) => void;
  onNavigate: (view: string) => void;
};

export default function ProjectManager({ onSelectProject, onNavigate }: Props) {
  const [classes] = useState<Class[]>(getClasses);
  const [projects, setProjects] = useState<Project[]>(getProjects);
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id ?? '');
  const [newTitle, setNewTitle] = useState('');

  const refresh = () => setProjects(getProjects());

  const handleCreate = () => {
    if (!selectedClassId) return;
    const title = newTitle.trim() || 'Untitled Project';
    const project = createProject(selectedClassId, title);
    setNewTitle('');
    refresh();
    onSelectProject(project.id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this project?')) {
      deleteProject(id);
      refresh();
    }
  };

  const classMap = new Map(classes.map(c => [c.id, c]));

  return (
    <div className="project-manager">
      <div className="class-manager-header">
        <h2>Projects / Assignments</h2>
        <button className="btn btn-secondary" onClick={() => onNavigate('picker')}>
          &larr; Back to Picker
        </button>
      </div>

      <div className="create-project-form">
        <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
          <option value="" disabled>Select a class</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="Project title (e.g., Presentations)"
        />
        <button className="btn btn-primary" onClick={handleCreate} disabled={!selectedClassId}>
          + New Project
        </button>
      </div>

      {classes.length === 0 && (
        <p className="empty-state">
          No classes yet.{' '}
          <button className="btn-link" onClick={() => onNavigate('classes')}>Create a class first</button>.
        </p>
      )}

      {projects.length === 0 && classes.length > 0 && (
        <p className="empty-state">No projects yet. Create one above!</p>
      )}

      <div className="project-list">
        {projects.map(p => {
          const cls = classMap.get(p.classId);
          return (
            <div key={p.id} className="project-card">
              <div className="project-info">
                <strong>{p.title}</strong>
                <span className="project-meta">
                  {cls?.name ?? 'Unknown class'} &middot;{' '}
                  {p.pickable.length} remaining &middot; {p.picked.length} picked
                </span>
              </div>
              <div className="project-actions">
                <button className="btn btn-primary btn-sm" onClick={() => onSelectProject(p.id)}>
                  Open
                </button>
                <button className="btn-icon btn-danger" onClick={() => handleDelete(p.id)}>
                  &times;
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
