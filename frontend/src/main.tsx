import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ClassManager from './components/ClassManager';
import ControlBar from './components/ControlBar';
import LastWinner from './components/LastWinner';
import ListPanel from './components/ListPanel';
import Modal from './components/Modal';
import ProjectManager from './components/ProjectManager';
import SpinnerWheel from './components/SpinnerWheel';
import {
  type SpinRecord,
  exportData,
  getProject,
  getProjects,
  getQuickSpin,
  importData,
  moveBackToEligible,
  quickSpinMoveBack,
  quickSpinPick,
  quickSpinRemove,
  quickSpinReset,
  removeFromEligible,
  resetProject,
  resolveNames,
  resolveQuickSpinNames,
  setProjectMode,
  setQuickSpinMode,
  setQuickSpinNames,
  spinPick,
  undoProjectSpin,
  undoQuickSpin,
  restoreQuickSpinState,
  restoreProjectState,
} from './services/storage';
import './styles/app.css';

type Mode = 'quick' | string; // 'quick' or a project ID

type UndoAction =
  | { type: 'spin'; record: SpinRecord; prevLastWinner: SpinRecord | null }
  | { type: 'reset'; prevEligible: string[]; prevPicked: string[]; prevHistory: SpinRecord[]; prevLastWinner: SpinRecord | null };

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

  // Edit drawer
  const [showEditor, setShowEditor] = useState(false);
  const [editorText, setEditorText] = useState('');
  const [editorStatus, setEditorStatus] = useState<'idle' | 'editing' | 'applied'>('idle');
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const editorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Undo/redo
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [lastWinner, setLastWinner] = useState<SpinRecord | null>(null);

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
    // Clear undo/lastWinner when switching modes
    setUndoStack([]);
    setLastWinner(null);
  }, [mode]);

  // Keyboard handler (Ctrl+Z)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isTextInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  // Derive display data
  const isQuick = mode === 'quick';
  const project = !isQuick ? getProject(mode) : null;
  const currentMode = isQuick ? getQuickSpin().mode : (project?.mode ?? 'remove');

  let eligibleNames: { id: string; name: string }[] = [];
  let pickedNames: { id: string; name: string }[] = [];

  if (isQuick) {
    const qs = getQuickSpin();
    eligibleNames = resolveQuickSpinNames(qs.eligible);
    pickedNames = resolveQuickSpinNames(qs.picked);
  } else if (project) {
    eligibleNames = resolveNames(project.classId, project.eligible);
    pickedNames = resolveNames(project.classId, project.picked);
  }

  // Spin
  const handleSpinStart = useCallback(() => {
    if (spinning) return;
    let record: SpinRecord | null;
    if (isQuick) {
      record = quickSpinPick();
    } else {
      record = spinPick(mode);
    }
    if (!record) return;
    setTargetId(record.entryId);
    setSpinning(true);
    // Push undo action
    setUndoStack(prev => [...prev, { type: 'spin', record: record!, prevLastWinner: lastWinner }]);
    setLastWinner(record);
  }, [mode, spinning, isQuick, lastWinner]);

  const handleSpinComplete = useCallback(() => {
    setSpinning(false);
    refresh();
  }, []);

  // Undo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const action = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));

    if (action.type === 'spin') {
      if (isQuick) {
        undoQuickSpin(action.record);
      } else {
        undoProjectSpin(mode, action.record);
      }
      setLastWinner(action.prevLastWinner);
    } else if (action.type === 'reset') {
      if (isQuick) {
        restoreQuickSpinState(action.prevEligible, action.prevPicked, action.prevHistory);
      } else {
        restoreProjectState(mode, action.prevEligible, action.prevPicked, action.prevHistory);
      }
      setLastWinner(action.prevLastWinner);
    }
    refresh();
  };

  // Reset Round
  const handleResetRound = () => {
    // Capture state for undo
    let prevEligible: string[];
    let prevPicked: string[];
    let prevHistory: SpinRecord[];
    if (isQuick) {
      const qs = getQuickSpin();
      prevEligible = [...qs.eligible];
      prevPicked = [...qs.picked];
      prevHistory = [...qs.history];
      quickSpinReset();
    } else {
      prevEligible = [...(project?.eligible ?? [])];
      prevPicked = [...(project?.picked ?? [])];
      prevHistory = [...(project?.history ?? [])];
      resetProject(mode);
    }
    setUndoStack(prev => [...prev, { type: 'reset', prevEligible, prevPicked, prevHistory, prevLastWinner: lastWinner }]);
    setLastWinner(null);
    refresh();
  };

  // Return winner to eligible (keeps in picked/history but re-adds to eligible)
  const handleReturnWinner = () => {
    if (!lastWinner) return;
    if (isQuick) {
      quickSpinMoveBack(lastWinner.entryId);
    } else {
      moveBackToEligible(mode, lastWinner.entryId);
    }
    setLastWinner({ ...lastWinner, removedFromPool: false });
    refresh();
  };

  // Move back
  const handleMoveBack = (id: string) => {
    if (isQuick) quickSpinMoveBack(id);
    else moveBackToEligible(mode, id);
    refresh();
  };

  // Remove from eligible
  const handleRemove = (id: string) => {
    if (isQuick) quickSpinRemove(id);
    else removeFromEligible(mode, id);
    refresh();
  };

  // Mode toggle
  const handleModeChange = (newMode: 'remove' | 'keep') => {
    if (isQuick) setQuickSpinMode(newMode);
    else setProjectMode(mode, newMode);
    refresh();
  };

  // Select project (from ProjectManager modal)
  const selectProject = (id: string) => {
    setMode(id);
    setShowProjects(false);
  };

  // ─── Editor (Quick Spin) ──────────────────────────────

  const openEditor = () => {
    const qs = getQuickSpin();
    setEditorText(qs.items.map(i => i.name).join('\n'));
    setShowEditor(true);
    setEditorStatus('idle');
    setShowEditConfirm(false);
  };

  const applyEditorChanges = (text: string, force?: boolean) => {
    const names = text.split(/[,\n]/).map(n => n.trim()).filter(Boolean);
    const qs = getQuickSpin();
    const hasPicked = qs.picked.length > 0;

    if (hasPicked && !force) {
      setShowEditConfirm(true);
      return;
    }

    setQuickSpinNames(names);
    setEditorStatus('applied');
    setShowEditConfirm(false);
    setUndoStack([]);
    setLastWinner(null);
    refresh();
    setTimeout(() => setEditorStatus('idle'), 1500);
  };

  const handleEditorChange = (text: string) => {
    setEditorText(text);
    setEditorStatus('editing');
    setShowEditConfirm(false);

    if (editorDebounceRef.current) clearTimeout(editorDebounceRef.current);
    editorDebounceRef.current = setTimeout(() => {
      applyEditorChanges(text);
    }, 400);
  };

  const handleEditConfirmApply = () => {
    applyEditorChanges(editorText, true);
  };

  const handleEditConfirmCancel = () => {
    const qs = getQuickSpin();
    setEditorText(qs.items.map(i => i.name).join('\n'));
    setShowEditConfirm(false);
    setEditorStatus('idle');
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
          setUndoStack([]);
          setLastWinner(null);
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
        <ListPanel
          title="Eligible"
          items={eligibleNames}
          kind="eligible"
          onRemove={handleRemove}
          headerAction={
            isQuick ? (
              <button className="btn btn-secondary-dark btn-sm edit-btn" onClick={openEditor}>
                &#9998; Edit
              </button>
            ) : undefined
          }
        />

        <div className="center-column">
          <SpinnerWheel
            names={eligibleNames}
            onSpinComplete={handleSpinComplete}
            spinning={spinning}
            onSpinStart={handleSpinStart}
            targetId={targetId}
          />

          {lastWinner && !spinning && (
            <LastWinner
              record={lastWinner}
              onUndo={handleUndo}
              onReturn={handleReturnWinner}
              mode={currentMode}
            />
          )}
        </div>

        <ListPanel
          title="Picked"
          items={pickedNames}
          kind="picked"
          onMoveBack={handleMoveBack}
        />
      </main>

      {/* ─── Control Bar ─── */}
      <ControlBar
        mode={currentMode}
        onModeChange={handleModeChange}
        onResetRound={handleResetRound}
        onUndo={handleUndo}
        canUndo={undoStack.length > 0}
        hasPicked={hasPicked}
      />

      {/* ─── Edit Drawer (Quick Spin only) ─── */}
      {showEditor && (
        <div className="drawer-backdrop" onClick={() => setShowEditor(false)}>
          <div className="drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>Edit Names</h2>
              <button className="btn-icon modal-close" onClick={() => setShowEditor(false)}>&times;</button>
            </div>
            <div className="drawer-body">
              <textarea
                className="editor-textarea"
                value={editorText}
                onChange={e => handleEditorChange(e.target.value)}
                placeholder="One name per line"
                rows={12}
              />
              <div className="editor-status">
                {editorStatus === 'editing' && <span className="status-editing">Editing...</span>}
                {editorStatus === 'applied' && <span className="status-applied">&#10003; Applied</span>}
              </div>
              {showEditConfirm && (
                <div className="edit-confirm-bar">
                  <span>List changed — Apply and reset round?</span>
                  <div className="edit-confirm-actions">
                    <button className="btn btn-primary btn-sm" onClick={handleEditConfirmApply}>Apply + Reset</button>
                    <button className="btn btn-secondary-dark btn-sm" onClick={handleEditConfirmCancel}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
