type NameEntry = { id: string; name: string };

type Props = {
  title: string;
  items: NameEntry[];
  kind: 'eligible' | 'picked';
  onMoveBack?: (id: string) => void;
  onRemove?: (id: string) => void;
  headerAction?: React.ReactNode;
};

export default function ListPanel({ title, items, kind, onMoveBack, onRemove, headerAction }: Props) {
  return (
    <div className={`list-panel list-panel-${kind}`}>
      <div className="list-panel-header">
        <h3>{title} <span className="list-count">({items.length})</span></h3>
        {headerAction}
      </div>
      {items.length === 0 ? (
        <p className="empty-state">
          {kind === 'eligible' ? 'All entries picked!' : 'None picked yet'}
        </p>
      ) : (
        <ul className="name-list">
          {items.map((item, index) => (
            <li key={item.id} className="name-item">
              {kind === 'picked' && (
                <span className="pick-number">{index + 1}.</span>
              )}
              <span className="name-text">{item.name}</span>
              <span className="name-actions">
                {kind === 'picked' && onMoveBack && (
                  <button
                    className="btn-icon"
                    title="Move back to eligible"
                    onClick={() => onMoveBack(item.id)}
                  >
                    &#8617;
                  </button>
                )}
                {kind === 'eligible' && onRemove && (
                  <button
                    className="btn-icon btn-danger"
                    title="Remove"
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
