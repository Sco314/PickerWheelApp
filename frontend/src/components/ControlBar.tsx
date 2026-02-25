type Props = {
  onResetRound: () => void;
  onUndo: () => void;
  canUndo: boolean;
  hasPicked: boolean;
};

export default function ControlBar({ onResetRound, onUndo, canUndo, hasPicked }: Props) {
  return (
    <div className="control-bar">
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
