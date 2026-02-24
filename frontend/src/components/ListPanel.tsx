type NameEntry = { id: string; name: string };

type Props = {
  title: string;
  items: NameEntry[];
  kind: 'pickable' | 'picked';
  onMoveBack?: (studentId: string) => void;
  onRemove?: (studentId: string) => void;
};

export default function ListPanel({ title, items, kind, onMoveBack, onRemove }: Props) {
  return (
    <div className={`list-panel list-panel-${kind}`}>
      <h3>{title} <span className="list-count">({items.length})</span></h3>
      {items.length === 0 ? (
        <p className="empty-state">
          {kind === 'pickable' ? 'All picked!' : 'None picked yet'}
        </p>
      ) : (
        <ul className="name-list">
          {items.map(item => (
            <li key={item.id} className="name-item">
              <span className="name-text">{item.name}</span>
              <span className="name-actions">
                {kind === 'picked' && onMoveBack && (
                  <button
                    className="btn-icon"
                    title="Move back to pickable"
                    onClick={() => onMoveBack(item.id)}
                  >
                    &#8617;
                  </button>
                )}
                {kind === 'pickable' && onRemove && (
                  <button
                    className="btn-icon btn-danger"
                    title="Remove from this project"
                    onClick={() => onRemove(item.id)}
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
