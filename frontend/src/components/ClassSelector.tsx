import { useState, useRef, useEffect } from 'react';
import type { Class, Session } from '../services/storage';
import { getSessionsForClass } from '../services/storage';

type AppMode =
  | { type: 'quick' }
  | { type: 'class'; classId: string; sessionId: string | null };

type Props = {
  classes: Class[];
  appMode: AppMode;
  onSelectClass: (classId: string) => void;
  onSelectQuickSpin: () => void;
  onNewSession: () => void;
  onLoadSession: (sessionId: string) => void;
  onManageClasses: () => void;
};

export default function ClassSelector({
  classes,
  appMode,
  onSelectClass,
  onSelectQuickSpin,
  onNewSession,
  onLoadSession,
  onManageClasses,
}: Props) {
  const [showLoadPopover, setShowLoadPopover] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowLoadPopover(false);
      }
    }
    if (showLoadPopover) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showLoadPopover]);

  const handleLoadClick = () => {
    if (appMode.type === 'class') {
      setSessions(getSessionsForClass(appMode.classId));
      setShowLoadPopover(!showLoadPopover);
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__quick__') {
      onSelectQuickSpin();
    } else if (value === '__manage__') {
      onManageClasses();
    } else {
      onSelectClass(value);
    }
    setShowLoadPopover(false);
  };

  const selectedValue = appMode.type === 'quick' ? '__quick__' : appMode.classId;

  const formatSessionLabel = (s: Session): string => {
    const date = new Date(s.lastSpinAt || s.createdAt);
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const name = s.name ? `${s.name} — ` : '';
    return `${name}${dateStr} (${s.history.length} picks)`;
  };

  return (
    <div className="class-selector">
      <div className="class-selector-row">
        <select
          className="mode-select"
          value={selectedValue}
          onChange={handleClassChange}
        >
          <option value="__quick__">Quick Spin (no class)</option>
          {classes.length > 0 && (
            <optgroup label="Classes">
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
          )}
          <option value="__manage__">Manage Classes...</option>
        </select>

        {appMode.type === 'class' && (
          <div className="session-controls">
            <button className="btn btn-secondary btn-sm" onClick={onNewSession}>
              Reset
            </button>

            <div className="session-load-wrapper" ref={popoverRef}>
              <button className="btn btn-secondary btn-sm" onClick={handleLoadClick}>
                Load &#9662;
              </button>
              {showLoadPopover && (
                <div className="session-load-popover">
                  {sessions.length === 0 ? (
                    <div className="session-load-empty">No saved sessions</div>
                  ) : (
                    sessions.map(s => (
                      <button
                        key={s.id}
                        className={`session-load-item ${appMode.sessionId === s.id ? 'active' : ''}`}
                        onClick={() => {
                          onLoadSession(s.id);
                          setShowLoadPopover(false);
                        }}
                      >
                        {formatSessionLabel(s)}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
