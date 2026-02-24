import type { SpinRecord } from '../services/storage';

type Props = {
  record: SpinRecord;
  onUndo: () => void;
  onReturn: () => void;
  mode: 'remove' | 'keep';
};

export default function LastWinner({ record, onUndo, onReturn, mode }: Props) {
  return (
    <div className="last-winner">
      <div className="last-winner-name">{record.entryName}</div>
      <div className="last-winner-status">
        {record.removedFromPool ? 'Removed from pool' : 'Still eligible'}
      </div>
      <div className="last-winner-actions">
        <button className="btn btn-secondary-dark btn-sm" onClick={onUndo}>Undo</button>
        {mode === 'remove' && record.removedFromPool && (
          <button className="btn btn-secondary-dark btn-sm" onClick={onReturn}>Return</button>
        )}
      </div>
    </div>
  );
}
