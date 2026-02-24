type Props = {
  mode: 'remove' | 'keep';
  onModeChange: (mode: 'remove' | 'keep') => void;
  onResetRound: () => void;
  onUndo: () => void;
  canUndo: boolean;
  hasPicked: boolean;
};

export default function ControlBar({ mode, onModeChange, onResetRound, onUndo, canUndo, hasPicked }: Props) {
  return (
    <div className="control-bar">
      <div className="mode-toggle">
        <button
          className={`mode-toggle-btn ${mode === 'remove' ? 'active' : ''}`}
          onClick={() => onModeChange('remove')}
        >
          Remove winners
        </button>
        <button
          className={`mode-toggle-btn ${mode === 'keep' ? 'active' : ''}`}
          onClick={() => onModeChange('keep')}
        >
          Keep winners
        </button>
      </div>
      {hasPicked && (
        <button className="btn btn-secondary-dark btn-sm" onClick={onResetRound}>
          Reset Round
        </button>
      )}
      <button className="btn btn-secondary-dark btn-sm" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        Undo
      </button>
    </div>
  );
}
