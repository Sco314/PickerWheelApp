import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ClassManager from './components/ClassManager';
import ClassSelector from './components/ClassSelector';
import ControlBar from './components/ControlBar';
import LastWinner from './components/LastWinner';
import ListPanel from './components/ListPanel';
import Modal from './components/Modal';
import SpinnerWheel from './components/SpinnerWheel';
import {
  type SpinRecord,
  type Session,
  applyQuickSpinPick,
  applySessionPick,
  createSessionWithState,
  deleteSession,
  exportData,
  getClass,
  getClasses,
  getQuickSpin,
  getSession,
  importData,
  pickRandomFromDraft,
  pickRandomFromQuickSpin,
  pickRandomFromSession,
  quickSpinMoveBack,
  quickSpinRemove,
  quickSpinReset,
  renameSession,
  resetSession,
  resolveNames,
  resolveQuickSpinNames,
  sessionMoveBackToEligible,
  sessionRemoveFromEligible,
  setQuickSpinMode,
  setQuickSpinNames,
  setSessionMode,
  undoQuickSpin,
  undoSessionSpin,
  restoreQuickSpinState,
  restoreSessionState,
} from './services/storage';
import './styles/app.css';

type AppMode =
  | { type: 'quick' }
  | { type: 'class'; classId: string; sessionId: string | null };

type UndoAction =
  | { type: 'spin'; record: SpinRecord; prevLastWinner: SpinRecord | null }
  | { type: 'reset'; prevEligible: string[]; prevPicked: string[]; prevHistory: SpinRecord[]; prevLastWinner: SpinRecord | null };

function App() {
  const [appMode, setAppMode] = useState<AppMode>({ type: 'quick' });
  const [spinning, setSpinning] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [pendingSpin, setPendingSpin] = useState<SpinRecord | null>(null);
  const pendingSpinRef = useRef<SpinRecord | null>(null);
  const [, setTick] = useState(0);

  // Draft session state (before first spin persists it)
  const [draftEligible, setDraftEligible] = useState<string[]>([]);
  const [draftPicked, setDraftPicked] = useState<string[]>([]);
  const [draftHistory, setDraftHistory] = useState<SpinRecord[]>([]);
  const [draftMode, setDraftMode] = useState<'remove' | 'keep'>('remove');

  // Modal states
  const [showClasses, setShowClasses] = useState(false);
  const [showRenameSession, setShowRenameSession] = useState(false);
  const [renameText, setRenameText] = useState('');

  // Gear menu
  const [showGear, setShowGear] = useState(false);
  const gearRef = useRef<HTMLDivElement>(null);

  // Edit drawer (Quick Spin only)
  const [showEditor, setShowEditor] = useState(false);
  const [editorText, setEditorText] = useState('');
  const [editorStatus, setEditorStatus] = useState<'idle' | 'editing' | 'applied'>('idle');
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const editorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Undo
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [lastWinner, setLastWinner] = useState<SpinRecord | null>(null);

  const refresh = () => setTick(t => t + 1);

  // Helpers to detect mode
  const isQuick = appMode.type === 'quick';
  const isDraft = appMode.type === 'class' && appMode.sessionId === null;
  const isSession = appMode.type === 'class' && appMode.sessionId !== null;
  const sessionId = isSession ? appMode.sessionId : null;
  const classId = appMode.type === 'class' ? appMode.classId : null;

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
      if (hash.startsWith('/session/')) {
        const id = hash.replace('/session/', '');
        const session = getSession(id);
        if (session) {
          setAppMode({ type: 'class', classId: session.classId, sessionId: id });
        }
      }
    }
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Load last mode on mount
  useEffect(() => {
    const saved = localStorage.getItem('lastAppMode');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AppMode;
        if (parsed.type === 'class') {
          if (parsed.sessionId) {
            const session = getSession(parsed.sessionId);
            if (session) {
              setAppMode(parsed);
              return;
            }
          }
          // If classId is valid, go to class draft mode
          const cls = getClass(parsed.classId);
          if (cls) {
            setAppMode({ type: 'class', classId: parsed.classId, sessionId: null });
            setDraftEligible(cls.students.map(s => s.id));
            setDraftPicked([]);
            setDraftHistory([]);
            setDraftMode('remove');
          }
        }
      } catch { /* ignore */ }
    }
    // Also migrate old lastMode key
    const oldMode = localStorage.getItem('lastMode');
    if (oldMode && oldMode !== 'quick') {
      const session = getSession(oldMode);
      if (session) {
        setAppMode({ type: 'class', classId: session.classId, sessionId: session.id });
      }
      localStorage.removeItem('lastMode');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist mode
  useEffect(() => {
    localStorage.setItem('lastAppMode', JSON.stringify(appMode));
    if (isSession && sessionId) {
      window.location.hash = `/session/${sessionId}`;
    } else {
      if (window.location.hash) window.location.hash = '';
    }
  }, [appMode, isSession, sessionId]);

  // Clear undo/lastWinner when switching modes
  const prevModeRef = useRef<AppMode>(appMode);
  useEffect(() => {
    const prev = prevModeRef.current;
    const modeChanged = prev.type !== appMode.type ||
      (prev.type === 'class' && appMode.type === 'class' && (prev.classId !== appMode.classId || prev.sessionId !== appMode.sessionId));
    if (modeChanged) {
      setUndoStack([]);
      setLastWinner(null);
    }
    prevModeRef.current = appMode;
  }, [appMode]);

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
  const session = sessionId ? getSession(sessionId) : null;
  const currentMode = isQuick
    ? getQuickSpin().mode
    : isDraft
      ? draftMode
      : (session?.mode ?? 'remove');

  let eligibleNames: { id: string; name: string }[] = [];
  let pickedNames: { id: string; name: string }[] = [];

  if (isQuick) {
    const qs = getQuickSpin();
    eligibleNames = resolveQuickSpinNames(qs.eligible);
    pickedNames = resolveQuickSpinNames(qs.picked);
  } else if (isDraft && classId) {
    eligibleNames = resolveNames(classId, draftEligible);
    pickedNames = resolveNames(classId, draftPicked);
  } else if (session) {
    eligibleNames = resolveNames(session.classId, session.eligible);
    pickedNames = resolveNames(session.classId, session.picked);
  }

  // ─── Spin (deferred mutation) ─────────────────────────
  const handleSpinStart = useCallback(() => {
    if (spinning) return;
    let record: SpinRecord | null = null;

    if (isQuick) {
      record = pickRandomFromQuickSpin();
    } else if (isDraft && classId) {
      record = pickRandomFromDraft(classId, draftEligible, draftMode);
    } else if (sessionId) {
      record = pickRandomFromSession(sessionId);
    }

    if (!record) return;

    pendingSpinRef.current = record;
    setPendingSpin(record);
    setTargetId(record.entryId);
    setSpinning(true);
    setUndoStack(prev => [...prev, { type: 'spin', record: record!, prevLastWinner: lastWinner }]);
    setLastWinner(record);
  }, [spinning, isQuick, isDraft, classId, sessionId, draftEligible, draftMode, lastWinner]);

  const handleSpinComplete = useCallback(() => {
    setSpinning(false);

    const spin = pendingSpinRef.current;
    if (!spin) {
      refresh();
      return;
    }

    if (isQuick) {
      applyQuickSpinPick(spin);
    } else if (isDraft && classId) {
      // Apply to draft state in-memory
      const newEligible = spin.removedFromPool
        ? draftEligible.filter(id => id !== spin.entryId)
        : [...draftEligible];
      const newPicked = [...draftPicked, spin.entryId];
      const newHistory = [...draftHistory, spin];

      // Persist as session on first spin
      const newSession = createSessionWithState(
        classId, newEligible, newPicked, newHistory, draftMode,
      );
      setAppMode({ type: 'class', classId, sessionId: newSession.id });
      // Clear draft state
      setDraftEligible([]);
      setDraftPicked([]);
      setDraftHistory([]);
    } else if (sessionId) {
      applySessionPick(sessionId, spin);
    }

    pendingSpinRef.current = null;
    setPendingSpin(null);
    refresh();
  }, [isQuick, isDraft, classId, sessionId, draftEligible, draftPicked, draftHistory, draftMode]);

  // ─── Undo ─────────────────────────────────────────────
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const action = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));

    if (action.type === 'spin') {
      if (isQuick) {
        undoQuickSpin(action.record);
      } else if (isDraft && classId) {
        // Undo draft spin — shouldn't happen since first spin makes it a session
        // but handle gracefully
      } else if (sessionId) {
        undoSessionSpin(sessionId, action.record);
        // If undoing the only spin, delete session and go back to draft
        const updatedSession = getSession(sessionId);
        if (updatedSession && updatedSession.history.length === 0 && classId) {
          const eligible = updatedSession.eligible;
          const picked = updatedSession.picked;
          deleteSession(sessionId);
          setAppMode({ type: 'class', classId, sessionId: null });
          setDraftEligible(eligible);
          setDraftPicked(picked);
          setDraftHistory([]);
          setDraftMode(updatedSession.mode);
        }
      }
      setLastWinner(action.prevLastWinner);
    } else if (action.type === 'reset') {
      if (isQuick) {
        restoreQuickSpinState(action.prevEligible, action.prevPicked, action.prevHistory);
      } else if (isDraft) {
        setDraftEligible(action.prevEligible);
        setDraftPicked(action.prevPicked);
        setDraftHistory(action.prevHistory);
      } else if (sessionId) {
        restoreSessionState(sessionId, action.prevEligible, action.prevPicked, action.prevHistory);
      }
      setLastWinner(action.prevLastWinner);
    }
    refresh();
  };

  // ─── Reset Round ──────────────────────────────────────
  const handleResetRound = () => {
    let prevEligible: string[];
    let prevPicked: string[];
    let prevHistory: SpinRecord[];

    if (isQuick) {
      const qs = getQuickSpin();
      prevEligible = [...qs.eligible];
      prevPicked = [...qs.picked];
      prevHistory = [...qs.history];
      quickSpinReset();
    } else if (isDraft) {
      prevEligible = [...draftEligible];
      prevPicked = [...draftPicked];
      prevHistory = [...draftHistory];
      setDraftEligible([...draftEligible, ...draftPicked.filter(id => !draftEligible.includes(id))]);
      setDraftPicked([]);
      setDraftHistory([]);
    } else if (session && sessionId) {
      prevEligible = [...session.eligible];
      prevPicked = [...session.picked];
      prevHistory = [...session.history];
      resetSession(sessionId);
    } else {
      return;
    }

    setUndoStack(prev => [...prev, { type: 'reset', prevEligible, prevPicked, prevHistory, prevLastWinner: lastWinner }]);
    setLastWinner(null);
    refresh();
  };

  // ─── Return winner to eligible ────────────────────────
  const handleReturnWinner = () => {
    if (!lastWinner) return;
    if (isQuick) {
      quickSpinMoveBack(lastWinner.entryId);
    } else if (isDraft) {
      if (!draftEligible.includes(lastWinner.entryId)) {
        setDraftEligible(prev => [...prev, lastWinner.entryId]);
      }
    } else if (sessionId) {
      sessionMoveBackToEligible(sessionId, lastWinner.entryId);
    }
    setLastWinner({ ...lastWinner, removedFromPool: false });
    refresh();
  };

  // ─── Move back ────────────────────────────────────────
  const handleMoveBack = (id: string) => {
    if (isQuick) quickSpinMoveBack(id);
    else if (isDraft) {
      setDraftPicked(prev => prev.filter(pid => pid !== id));
      if (!draftEligible.includes(id)) setDraftEligible(prev => [...prev, id]);
    } else if (sessionId) sessionMoveBackToEligible(sessionId, id);
    refresh();
  };

  // ─── Remove from eligible ────────────────────────────
  const handleRemove = (id: string) => {
    if (isQuick) quickSpinRemove(id);
    else if (isDraft) {
      setDraftEligible(prev => prev.filter(eid => eid !== id));
    } else if (sessionId) sessionRemoveFromEligible(sessionId, id);
    refresh();
  };

  // ─── Mode toggle ──────────────────────────────────────
  const handleModeChange = (newMode: 'remove' | 'keep') => {
    if (isQuick) setQuickSpinMode(newMode);
    else if (isDraft) setDraftMode(newMode);
    else if (sessionId) setSessionMode(sessionId, newMode);
    refresh();
  };

  // ─── Class selection ──────────────────────────────────
  const selectClass = (clsId: string) => {
    const cls = getClass(clsId);
    if (!cls) return;
    setDraftEligible(cls.students.map(s => s.id));
    setDraftPicked([]);
    setDraftHistory([]);
    setDraftMode('remove');
    setAppMode({ type: 'class', classId: clsId, sessionId: null });
  };

  const selectQuickSpin = () => {
    setAppMode({ type: 'quick' });
  };

  const handleNewSession = () => {
    if (appMode.type !== 'class') return;
    const cls = getClass(appMode.classId);
    if (!cls) return;
    setDraftEligible(cls.students.map(s => s.id));
    setDraftPicked([]);
    setDraftHistory([]);
    setDraftMode('remove');
    setAppMode({ type: 'class', classId: appMode.classId, sessionId: null });
    setUndoStack([]);
    setLastWinner(null);
  };

  const handleLoadSession = (loadSessionId: string) => {
    const s = getSession(loadSessionId);
    if (!s) return;
    setAppMode({ type: 'class', classId: s.classId, sessionId: loadSessionId });
  };

  const handleRenameSession = () => {
    if (!session) return;
    setRenameText(session.name || '');
    setShowRenameSession(true);
  };

  const handleRenameSubmit = () => {
    if (sessionId) {
      renameSession(sessionId, renameText.trim());
      refresh();
    }
    setShowRenameSession(false);
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

  // ─── Export / Import ──────────────────────────────────

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
          setAppMode({ type: 'quick' });
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

  // ─── Session status ───────────────────────────────────
  const getSessionStatus = (): string => {
    if (appMode.type !== 'class') return '';
    if (!appMode.sessionId) return 'New session';
    if (!session) return '';
    const date = new Date(session.lastSpinAt || session.createdAt);
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const name = session.name ? `${session.name} — ` : '';
    return `${name}${dateStr} — ${session.history.length} picks`;
  };

  const hasPicked = pickedNames.length > 0;
  const classes = getClasses();

  return (
    <div className="app">
      {/* ─── Header ─── */}
      <header className="app-header">
        <h1>PickerWheel</h1>

        <ClassSelector
          classes={classes}
          appMode={appMode}
          onSelectClass={selectClass}
          onSelectQuickSpin={selectQuickSpin}
          onNewSession={handleNewSession}
          onLoadSession={handleLoadSession}
          onRenameSession={handleRenameSession}
          onManageClasses={() => setShowClasses(true)}
          sessionStatus={getSessionStatus()}
        />

        <div className="header-spacer" />

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
          onResetRound={handleResetRound}
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

      {showRenameSession && (
        <Modal title="Rename Session" onClose={() => setShowRenameSession(false)}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={renameText}
              onChange={e => setRenameText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRenameSubmit()}
              placeholder="Session name (optional)"
              autoFocus
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <button className="btn btn-primary" onClick={handleRenameSubmit}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
