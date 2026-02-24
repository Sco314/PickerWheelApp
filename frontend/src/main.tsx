import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ClassManager from './components/ClassManager';
import ListPanel from './components/ListPanel';
import ProjectManager from './components/ProjectManager';
import SpinnerWheel from './components/SpinnerWheel';
import {
  exportData,
  getProject,
  getProjects,
  importData,
  moveBackToPickable,
  removeFromPickable,
  resetProject,
  resolveNames,
  spinPick,
} from './services/storage';
import './styles/app.css';

type View = 'picker' | 'classes' | 'projects';

function App() {
  const [view, setView] = useState<View>('picker');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const refresh = () => setTick(t => t + 1);

  // Hash-based routing
  useEffect(() => {
    function handleHash() {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('/project/')) {
        const id = hash.replace('/project/', '');
        setProjectId(id);
        setView('picker');
      } else if (hash === '/classes') {
        setView('classes');
      } else if (hash === '/projects') {
        setView('projects');
      }
    }
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Persist last project in URL
  useEffect(() => {
    if (projectId) {
      localStorage.setItem('lastProjectId', projectId);
      window.location.hash = `/project/${projectId}`;
    }
  }, [projectId]);

  // Load last project on mount if no hash route
  useEffect(() => {
    if (!projectId) {
      const saved = localStorage.getItem('lastProjectId');
      if (saved && getProject(saved)) {
        setProjectId(saved);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const project = projectId ? getProject(projectId) : null;
  const pickableNames = project ? resolveNames(project.classId, project.pickable) : [];
  const pickedNames = project ? resolveNames(project.classId, project.picked) : [];

  const navigate = (v: string) => {
    setView(v as View);
    if (v === 'classes') window.location.hash = '/classes';
    else if (v === 'projects') window.location.hash = '/projects';
    else if (v === 'picker' && projectId) window.location.hash = `/project/${projectId}`;
  };

  const selectProject = (id: string) => {
    setProjectId(id);
    setView('picker');
  };

  const handleSpinStart = useCallback(() => {
    if (!projectId || spinning) return;
    const winnerId = spinPick(projectId);
    if (!winnerId) return;
    setTargetId(winnerId);
    setSpinning(true);
  }, [projectId, spinning]);

  const handleSpinComplete = useCallback(() => {
    setSpinning(false);
    refresh();
  }, []);

  const handleReset = () => {
    if (!projectId) return;
    if (confirm('Move all picked students back to the pickable list?')) {
      resetProject(projectId);
      refresh();
    }
  };

  const handleMoveBack = (studentId: string) => {
    if (!projectId) return;
    moveBackToPickable(projectId, studentId);
    refresh();
  };

  const handleRemoveFromPickable = (studentId: string) => {
    if (!projectId) return;
    removeFromPickable(projectId, studentId);
    refresh();
  };

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pickerwheel-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          importData(reader.result as string);
          refresh();
          alert('Data imported successfully!');
        } catch {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const allProjects = getProjects();

  // Nav bar (shared across views)
  const header = (
    <header className="app-header">
      <h1 onClick={() => navigate('picker')} style={{ cursor: 'pointer' }}>PickerWheel</h1>
      <nav>
        <button className={`btn btn-nav${view === 'picker' ? ' active' : ''}`} onClick={() => navigate('picker')}>Picker</button>
        <button className={`btn btn-nav${view === 'classes' ? ' active' : ''}`} onClick={() => navigate('classes')}>Classes</button>
        <button className={`btn btn-nav${view === 'projects' ? ' active' : ''}`} onClick={() => navigate('projects')}>Projects</button>
      </nav>
      {view === 'picker' && (
        <div className="header-project-select">
          <select
            value={projectId ?? ''}
            onChange={e => selectProject(e.target.value)}
          >
            <option value="" disabled>Select a project</option>
            {allProjects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          {project && (
            <button className="btn btn-secondary btn-sm" onClick={handleReset} title="Reset all picked back to pickable">
              Reset All
            </button>
          )}
        </div>
      )}
      <div className="header-tools">
        <button className="btn-icon" title="Export data" onClick={handleExport}>&#128190;</button>
        <button className="btn-icon" title="Import data" onClick={handleImport}>&#128194;</button>
      </div>
    </header>
  );

  if (view === 'classes') {
    return <div className="app">{header}<ClassManager onNavigate={navigate} /></div>;
  }

  if (view === 'projects') {
    return <div className="app">{header}<ProjectManager onSelectProject={selectProject} onNavigate={navigate} /></div>;
  }

  // Picker view
  return (
    <div className="app">
      {header}
      {!project ? (
        <div className="no-project">
          <h2>No project selected</h2>
          <p>
            <button className="btn btn-primary" onClick={() => navigate('classes')}>Create a class</button>
            {' '}then{' '}
            <button className="btn btn-primary" onClick={() => navigate('projects')}>create a project</button>
            {' '}to get started.
          </p>
        </div>
      ) : (
        <main className="picker-layout">
          <ListPanel
            title="To Pick"
            items={pickableNames}
            kind="pickable"
            onRemove={handleRemoveFromPickable}
          />
          <SpinnerWheel
            names={pickableNames}
            onSpinComplete={handleSpinComplete}
            spinning={spinning}
            onSpinStart={handleSpinStart}
            targetId={targetId}
          />
          <ListPanel
            title="Picked"
            items={pickedNames}
            kind="picked"
            onMoveBack={handleMoveBack}
          />
        </main>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
