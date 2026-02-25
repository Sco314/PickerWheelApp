import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ClassManager from './components/ClassManager';
import ClassSelector from './components/ClassSelector';
import ControlBar from './components/ControlBar';
import ListPanel from './components/ListPanel';
import Modal from './components/Modal';
import SettingsPanel from './components/SettingsPanel';
import SpinnerWheel from './components/SpinnerWheel';
import WinnerDialog from './components/WinnerDialog';
import { getAppSettings } from './services/settings';
import {
  type SpinRecord,
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
  setQuickSpinNames,
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
  const spinningRef = useRef(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const spinIdRef = useRef(0);
  const currentSpinRef = useRef<{
    id: number;
    record: SpinRecord;
    eligibleSnapshot: { id: string; name: string }[];
  } | null>(null);
  const [, setTick] = useState(0);

  // Draft session state (before first spin persists it)
  const [draftEligible, setDraftEligible] = useState<string[]>([]);
  const [draftPicked, setDraftPicked] = useState<string[]>([]);
  const [draftHistory, setDraftHistory] = useState<SpinRecord[]>([]);

  // Modal states
  const [showClasses, setShowClasses] = useState(false);
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Inline session name editing
  const [editingSessionName, setEditingSessionName] = useState(false);
  const [sessionNameText, setSessionNameText] = useState('');

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

  // Query string support: ?names=Alice,Bob,Charlie loads a pre-configured quick spin
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const namesParam = params.get('names');
    if (namesParam) {
      const names = namesParam.split(',').map(n => decodeURIComponent(n.trim())).filter(Boolean);
      if (names.length > 0) {
        setQuickSpinNames(names);
        setAppMode({ type: 'quick' });
        // Clean URL without reloading (keep the page clean after loading)
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Hash-based routing for deep links
  useEffect(() => {
    function handleHash() {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('/session/')) {
        const id = hash.replace('/session/', '');
        const s = getSession(id);
        if (s) {
          setAppMode({ type: 'class', classId: s.classId, sessionId: id });
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
            const s = getSession(parsed.sessionId);
            if (s) {
              setAppMode(parsed);
              return;
            }
          }
          const cls = getClass(parsed.classId);
          if (cls) {
            setAppMode({ type: 'class', classId: parsed.classId, sessionId: null });
            setDraftEligible(cls.students.map(s => s.id));
            setDraftPicked([]);
            setDraftHistory([]);
          }
        }
      } catch { /* ignore */ }
    }
    // Migrate old lastMode key
    const oldMode = localStorage.getItem('lastMode');
    if (oldMode && oldMode !== 'quick') {
      const s = getSession(oldMode);
      if (s) {
        setAppMode({ type: 'class', classId: s.classId, sessionId: s.id });
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
      setEditingSessionName(false);
    }
    prevModeRef.current = appMode;
  }, [appMode]);

  // Derive display data
  const session = sessionId ? getSession(sessionId) : null;

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

  // Session display name
  const getSessionDisplayName = (): string => {
    if (appMode.type !== 'class') return '';
    if (!appMode.sessionId || !session) return 'New session';
    if (session.name) return session.name;
    const date = new Date(session.lastSpinAt || session.createdAt);
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${dateStr} — ${session.history.length} picks`;
  };

  // ─── Spin (deferred mutation) ─────────────────────────
  const handleSpinStart = useCallback(() => {
    if (spinningRef.current) return;    // ref guard — immune to stale state

    let record: SpinRecord | null = null;

    if (isQuick) {
      record = pickRandomFromQuickSpin();
    } else if (isDraft && classId) {
      record = pickRandomFromDraft(classId, draftEligible);
    } else if (sessionId) {
      record = pickRandomFromSession(sessionId);
    }

    if (!record) return;

    // Single source of truth: one spinId + record + eligible snapshot per spin
    spinningRef.current = true;
    const id = ++spinIdRef.current;
    currentSpinRef.current = { id, record, eligibleSnapshot: [...eligibleNames] };
    setTargetId(record.entryId);
    setSpinning(true);
  }, [isQuick, isDraft, classId, sessionId, draftEligible, eligibleNames]);

  // Animation finished — ref-based so it always reads fresh closure state.
  // The stable useCallback wrapper just delegates to the ref.
  const handleSpinCompleteRef = useRef<(winnerId: string) => void>(() => {});
  handleSpinCompleteRef.current = (winnerId: string) => {
    const spin = currentSpinRef.current;
    if (!spin || spin.record.entryId !== winnerId) {
      // Stale callback from a previous/cancelled spin — discard
      spinningRef.current = false;
      setSpinning(false);
      return;
    }
    spinningRef.current = false;
    setSpinning(false);

    const settings = getAppSettings();
    if (settings.autoRemoveWinners) {
      applyWinnerChoice(true);
    } else {
      setShowWinnerDialog(true);
    }
  };
  const handleSpinComplete = useCallback((winnerId: string) => {
    handleSpinCompleteRef.current(winnerId);
  }, []);

  // Apply the spin result after winner dialog choice
  const applyWinnerChoice = (removed: boolean) => {
    const spin = currentSpinRef.current;
    if (!spin) return;

    const record = { ...spin.record, removedFromPool: removed };

    if (isQuick) {
      applyQuickSpinPick(record);
    } else if (isDraft && classId) {
      const newEligible = removed
        ? draftEligible.filter(id => id !== record.entryId)
        : [...draftEligible];
      const newPicked = removed
        ? [...draftPicked, record.entryId]
        : [...draftPicked];
      const newHistory = [...draftHistory, record];

      const newSession = createSessionWithState(
        classId, newEligible, newPicked, newHistory, 'remove',
      );
      setAppMode({ type: 'class', classId, sessionId: newSession.id });
      setDraftEligible([]);
      setDraftPicked([]);
      setDraftHistory([]);
    } else if (sessionId) {
      applySessionPick(sessionId, record);
    }

    setUndoStack(prev => [...prev, { type: 'spin', record, prevLastWinner: lastWinner }]);
    setLastWinner(record);
    currentSpinRef.current = null;
    setShowWinnerDialog(false);
    refresh();
  };

  const handleWinnerClose = () => applyWinnerChoice(false);
  const handleWinnerRemove = () => applyWinnerChoice(true);

  // ─── Undo ─────────────────────────────────────────────
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const action = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));

    if (action.type === 'spin') {
      if (isQuick) {
        undoQuickSpin(action.record);
      } else if (isDraft && classId) {
        // shouldn't happen since first spin makes it a session
      } else if (sessionId) {
        undoSessionSpin(sessionId, action.record);
        const updatedSession = getSession(sessionId);
        if (updatedSession && updatedSession.history.length === 0 && classId) {
          const eligible = updatedSession.eligible;
          const picked = updatedSession.picked;
          deleteSession(sessionId);
          setAppMode({ type: 'class', classId, sessionId: null });
          setDraftEligible(eligible);
          setDraftPicked(picked);
          setDraftHistory([]);
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

  // Keyboard shortcuts (Ctrl+Z = Undo, Ctrl+Enter = Spin)
  // Use refs so the effect registers once but always calls fresh handlers.
  const handleSpinStartRef = useRef(handleSpinStart);
  handleSpinStartRef.current = handleSpinStart;
  const handleUndoRef = useRef(handleUndo);
  handleUndoRef.current = handleUndo;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isTextInput) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndoRef.current();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSpinStartRef.current();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ─── Class selection ──────────────────────────────────
  const selectClass = (clsId: string) => {
    const cls = getClass(clsId);
    if (!cls) return;
    setDraftEligible(cls.students.map(s => s.id));
    setDraftPicked([]);
    setDraftHistory([]);
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
    setAppMode({ type: 'class', classId: appMode.classId, sessionId: null });
    setUndoStack([]);
    setLastWinner(null);
  };

  const handleLoadSession = (loadSessionId: string) => {
    const s = getSession(loadSessionId);
    if (!s) return;
    setAppMode({ type: 'class', classId: s.classId, sessionId: loadSessionId });
  };

  // ─── Inline session name editing ──────────────────────
  const startEditSessionName = () => {
    if (!session) return;
    setSessionNameText(session.name || '');
    setEditingSessionName(true);
  };

  const saveSessionName = () => {
    if (sessionId) {
      renameSession(sessionId, sessionNameText.trim());
      refresh();
    }
    setEditingSessionName(false);
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
    const hasPickedItems = qs.picked.length > 0;

    if (hasPickedItems && !force) {
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

  // ─── Share URL ───────────────────────────────────────
  const [showCopied, setShowCopied] = useState(false);

  const handleShareUrl = () => {
    const nameList = eligibleNames.concat(pickedNames).map(n => n.name);
    if (nameList.length === 0) return;
    const encoded = nameList.map(n => encodeURIComponent(n)).join(',');
    const url = `${window.location.origin}${window.location.pathname}?names=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
    setShowGear(false);
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
          onManageClasses={() => setShowClasses(true)}
        />

        <div className="header-spacer" />

        <div className="gear-wrapper" ref={gearRef}>
          <button className="btn-icon gear-btn" onClick={() => setShowGear(!showGear)} title="Settings">
            &#9881;
          </button>
          {showGear && (
            <div className="gear-dropdown">
              <button onClick={() => { setShowSettings(true); setShowGear(false); }}>Settings</button>
              <button onClick={handleShareUrl}>Share Wheel URL</button>
              <button onClick={handleExport}>Export Data</button>
              <button onClick={handleImport}>Import Data</button>
            </div>
          )}
        </div>
      </header>

      {/* ─── Picker Layout ─── */}
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
          {/* Session label — above wheel */}
          {appMode.type === 'class' && (
            <div className="session-label">
              <span className="session-label-prefix">Session:</span>
              {editingSessionName ? (
                <input
                  className="session-label-input"
                  value={sessionNameText}
                  onChange={e => setSessionNameText(e.target.value)}
                  onBlur={saveSessionName}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveSessionName();
                    if (e.key === 'Escape') setEditingSessionName(false);
                  }}
                  placeholder="Name this session..."
                  autoFocus
                />
              ) : (
                <span
                  className="session-label-name"
                  onClick={session ? startEditSessionName : undefined}
                  title={session ? 'Click to rename' : undefined}
                >
                  {getSessionDisplayName()}
                  {session && <span className="session-edit-hint"> &#9998;</span>}
                </span>
              )}
            </div>
          )}

          <SpinnerWheel
            names={spinning && currentSpinRef.current ? currentSpinRef.current.eligibleSnapshot : eligibleNames}
            onSpinComplete={handleSpinComplete}
            spinning={spinning}
            onSpinStart={handleSpinStart}
            targetId={targetId}
          />
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
        onResetRound={handleResetRound}
        onUndo={handleUndo}
        canUndo={undoStack.length > 0}
        hasPicked={hasPicked}
      />

      {/* ─── Winner Dialog (WoN style) ─── */}
      {showWinnerDialog && currentSpinRef.current && (
        <WinnerDialog
          winnerName={currentSpinRef.current.record.entryName}
          onClose={handleWinnerClose}
          onRemove={handleWinnerRemove}
        />
      )}

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

      {showSettings && (
        <Modal title="Settings" onClose={() => setShowSettings(false)}>
          <SettingsPanel onSettingsChanged={refresh} />
        </Modal>
      )}

      {/* Copied toast */}
      {showCopied && (
        <div className="toast-copied">Link copied to clipboard!</div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
