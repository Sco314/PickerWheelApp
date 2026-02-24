import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ClassManager from './components/ClassManager';
import ListPanel from './components/ListPanel';
import Modal from './components/Modal';
import ProjectManager from './components/ProjectManager';
import SpinnerWheel from './components/SpinnerWheel';
import {
  exportData,
  getProject,
  getProjects,
  getQuickSpin,
  importData,
  moveBackToPickable,
  quickSpinMoveBack,
  quickSpinPick,
  quickSpinRemove,
  quickSpinReset,
  removeFromPickable,
  resetProject,
  resolveNames,
  resolveQuickSpinNames,
  setQuickSpinNames,
  spinPick,
} from './services/storage';
import './styles/app.css';

type Mode = 'quick' | string; // 'quick' or a project ID

function App() {
  const [mode, setMode] = useState<Mode>('quick');
  const [spinning, setSpinning] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Modal states
  const [showClasses, setShowClasses] = useState(false);
  const [showProjects, setShowProjects] = useState(false);

  // Gear menu
  const [showGear, setShowGear] = useState(false);
  const gearRef = useRef<HTMLDivElement>(null);

  // Inline name editor for quick spin
  const [showEditor, setShowEditor] = useState(false);
  const [editorText, setEditorText] = useState('');

  const refresh = () => setTick(t => t + 1);

  // Close gear menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (gearRef.current && !gearRef.current.contains(e.target as Node)) {
        setShowGear(false);
      }
    }
    if (showGear) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showGear]);

  // Hash-based routing for deep links
  useEffect(() => {
    function handleHash() {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('/project/')) {
        const id = hash.replace('/project/', '');
        setMode(id);
      }
    }
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Load last mode on mount
  useEffect(() => {
    if (mode === 'quick') {
      const saved = localStorage.getItem('lastMode');
      if (saved && saved !== 'quick' && getProject(saved)) {
        setMode(saved);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist mode
  useEffect(() => {
    localStorage.setItem('lastMode', mode);
    if (mode !== 'quick') {
      window.location.hash = `/project/${mode}`;
    } else {
      if (window.location.hash) window.location.hash = '';
    }
  }, [mode]);

  // Derive display data based on mode
  const isQuick = mode === 'quick';
  const project = !isQuick ? getProject(mode) : null;

  let pickableNames: { id: string; name: string }[] = [];
  let pickedNames: { id: string; name: string }[] = [];

  if (isQuick) {
    const qs = getQuickSpin();
    pickableNames = resolveQuickSpinNames(qs.pickable);
    pickedNames = resolveQuickSpinNames(qs.picked);
  } else if (project) {
    pickableNames = resolveNames(project.classId, project.pickable);
    pickedNames = resolveNames(project.classId, project.picked);
  }

  // Spin
  const handleSpinStart = useCallback(() => {
    if (spinning) return;
    let winnerId: string | null;
    if (isQuick) {
      winnerId = quickSpinPick();
    } else {
      winnerId = spinPick(mode);
    }
    if (!winnerId) return;
    setTargetId(winnerId);
    setSpinning(true);
  }, [mode, spinning, isQuick]);

  const handleSpinComplete = useCallback(() => {
    setSpinning(false);
    refresh();
  }, []);

  // Reset
  const handleReset = () => {
    if (confirm('Move all picked back to the pickable list?')) {
      if (isQuick) quickSpinReset();
      else resetProject(mode);
      refresh();
    }
  };

  // Move back
  const handleMoveBack = (id: string) => {
    if (isQuick) quickSpinMoveBack(id);
    else moveBackToPickable(mode, id);
    refresh();
  };

  // Remove from pickable
  const handleRemove = (id: string) => {
    if (isQuick) quickSpinRemove(id);
    else removeFromPickable(mode, id);
    refresh();
  };

  // Select project (from ProjectManager modal)
  const selectProject = (id: string) => {
    setMode(id);
    setShowProjects(false);
  };

  // Quick spin editor
  const openEditor = () => {
    const qs = getQuickSpin();
    setEditorText(qs.items.map(i => i.name).join('\n'));
    setShowEditor(true);
  };

  const saveEditor = () => {
    const names = editorText.split(/[,\n]/).map(n => n.trim()).filter(Boolean);
    setQuickSpinNames(names);
    setShowEditor(false);
    refresh();
  };

  // Export / Import
  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pickerwheel-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    setShowGear(false);
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
          setMode('quick');
          alert('Data imported successfully!');
        } catch {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
    setShowGear(false);
  };

  const allProjects = getProjects();
  const hasPicked = pickedNames.length > 0;

  return (
    <div className="app">
      {/* ─── Header ─── */}
      <header className="app-header">
        <h1>PickerWheel</h1>

        <select
          className="mode-select"
          value={mode}
          onChange={e => setMode(e.target.value)}
        >
          <option value="quick">Quick Spin</option>
          {allProjects.length > 0 && (
            <optgroup label="Saved Projects">
              {allProjects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </optgroup>
          )}
        </select>

        {hasPicked && (
          <button className="btn btn-secondary btn-sm" onClick={handleReset}>
            Reset All
          </button>
        )}

        <div className="header-spacer" />

        <button className="btn btn-nav" onClick={() => setShowClasses(true)}>Classes</button>
        <button className="btn btn-nav" onClick={() => setShowProjects(true)}>Projects</button>

        <div className="gear-wrapper" ref={gearRef}>
          <button className="btn-icon gear-btn" onClick={() => setShowGear(!showGear)} title="Settings">
            &#9881;
          </button>
          {showGear && (
            <div className="gear-dropdown">
              <button onClick={handleExport}>Export Data</button>
              <button onClick={handleImport}>Import Data</button>
            </div>
          )}
        </div>
      </header>

      {/* ─── Picker Layout (always visible) ─── */}
      <main className="picker-layout">
        <div className="left-panel">
          <ListPanel
            title="To Pick"
            items={pickableNames}
            kind="pickable"
            onRemove={handleRemove}
          />
          {isQuick && (
            <div className="inline-editor">
              {showEditor ? (
                <>
                  <textarea
                    value={editorText}
                    onChange={e => setEditorText(e.target.value)}
                    placeholder="One name per line, or comma-separated"
                    rows={6}
                  />
                  <div className="inline-editor-actions">
                    <button className="btn btn-primary btn-sm" onClick={saveEditor}>Update Names</button>
                    <button className="btn btn-secondary-dark btn-sm" onClick={() => setShowEditor(false)}>Cancel</button>
                  </div>
                </>
              ) : (
                <button className="btn btn-secondary-dark btn-sm edit-names-btn" onClick={openEditor}>
                  Edit Names
                </button>
              )}
            </div>
          )}
        </div>

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

      {/* ─── Modals ─── */}
      {showClasses && (
        <Modal title="My Classes" onClose={() => { setShowClasses(false); refresh(); }}>
          <ClassManager />
        </Modal>
      )}

      {showProjects && (
        <Modal title="Projects / Assignments" onClose={() => { setShowProjects(false); refresh(); }}>
          <ProjectManager
            onSelectProject={selectProject}
            onOpenClasses={() => { setShowProjects(false); setShowClasses(true); }}
          />
        </Modal>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
