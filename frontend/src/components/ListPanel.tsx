import { useState } from 'react';

type Props = {
  title: string;
  items: string[];
  onSaveTitle?: (title: string) => Promise<void>;
};

export default function ListPanel({ title, items, onSaveTitle }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  const onSave = async () => {
    if (onSaveTitle) {
      await onSaveTitle(draftTitle);
    }
    setIsEditing(false);
  };

  return (
    <section>
      <div className="panel-header">
        {isEditing ? (
          <>
            <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
            <button onClick={onSave}>Save</button>
          </>
        ) : (
          <>
            <h2>{title}</h2>
            {onSaveTitle && <button onClick={() => setIsEditing(true)}>✏️</button>}
          </>
        )}
      </div>
      <ul>
        {items.map((item, idx) => (
          <li key={`${item}-${idx}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
