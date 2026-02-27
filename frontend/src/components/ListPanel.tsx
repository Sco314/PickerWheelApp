import { useCallback, useEffect, useRef, useState } from 'react';

type NameEntry = { id: string; name: string };

type Props = {
  title: string;
  items: NameEntry[];
  kind: 'eligible' | 'picked';
  onMoveBack?: (id: string) => void;
  onRemove?: (id: string) => void;
  onResetRound?: () => void;
  onBulkRemove?: (ids: string[]) => void;
  headerAction?: React.ReactNode;
};

export default function ListPanel({
  title, items, kind, onMoveBack, onRemove, onResetRound, onBulkRemove, headerAction,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const lastClickedRef = useRef<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Clear selection when items change
  useEffect(() => {
    setSelected(new Set());
  }, [items.length]);

  const handleItemClick = useCallback((id: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Toggle individual item
      setSelected(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else if (e.shiftKey && lastClickedRef.current) {
      // Range select
      const lastIdx = items.findIndex(i => i.id === lastClickedRef.current);
      const curIdx = items.findIndex(i => i.id === id);
      if (lastIdx !== -1 && curIdx !== -1) {
        const [start, end] = lastIdx < curIdx ? [lastIdx, curIdx] : [curIdx, lastIdx];
        setSelected(prev => {
          const next = new Set(prev);
          for (let i = start; i <= end; i++) next.add(items[i].id);
          return next;
        });
      }
    } else {
      // Normal click: deselect all
      setSelected(new Set());
    }
    lastClickedRef.current = id;
  }, [items]);

  // Keyboard: Delete key removes selected
  useEffect(() => {
    if (selected.size === 0 || kind !== 'eligible' || !onBulkRemove) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onBulkRemove!([...selected]);
        setSelected(new Set());
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [selected, kind, onBulkRemove]);

  const handleSelectAll = () => {
    setSelected(new Set(items.map(i => i.id)));
  };

  const handleDeselectAll = () => {
    setSelected(new Set());
  };

  const handleBulkDelete = () => {
    if (onBulkRemove && selected.size > 0) {
      onBulkRemove([...selected]);
      setSelected(new Set());
    }
  };

  const hasSelection = selected.size > 0;

  return (
    <div className={`list-panel list-panel-${kind}`} ref={panelRef}>
      <div className="list-panel-header">
        <h3>{title} <span className="list-count">({items.length})</span></h3>
        {headerAction}
      </div>

      {/* Selection action bar */}
      {hasSelection && (
        <div className="selection-bar">
          <span className="selection-count">{selected.size} selected</span>
          <button className="btn btn-sm btn-secondary-dark" onClick={handleSelectAll}>All</button>
          <button className="btn btn-sm btn-secondary-dark" onClick={handleDeselectAll}>None</button>
          {kind === 'eligible' && onBulkRemove && (
            <button className="btn btn-sm btn-danger-bg" onClick={handleBulkDelete}>Delete</button>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state">
          <p>{kind === 'eligible' ? 'All entries picked!' : 'None picked yet'}</p>
          {kind === 'eligible' && onResetRound && (
            <button className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }} onClick={onResetRound}>
              Reset Round
            </button>
          )}
        </div>
      ) : (
        <ul className="name-list">
          {items.map((item, index) => (
            <li
              key={item.id}
              className={`name-item ${selected.has(item.id) ? 'name-item-selected' : ''}`}
              onClick={e => handleItemClick(item.id, e)}
            >
              {kind === 'picked' && (
                <span className="pick-number">{index + 1}.</span>
              )}
              <span className="name-text">{item.name}</span>
              <span className="name-actions">
                {kind === 'picked' && onMoveBack && (
                  <button
                    className="btn-icon"
                    title="Move back to eligible"
                    onClick={e => { e.stopPropagation(); onMoveBack(item.id); }}
                  >
                    &#8617;
                  </button>
                )}
                {kind === 'eligible' && onRemove && (
                  <button
                    className="btn-icon btn-danger"
                    title="Remove"
                    onClick={e => { e.stopPropagation(); onRemove(item.id); }}
                  >
                    &times;
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
