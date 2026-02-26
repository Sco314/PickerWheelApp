import { useState } from 'react';
import type { QuickSpinItem } from '../services/storage';

type Props = {
  items: QuickSpinItem[];
  onUpdate: (itemId: string, patch: Partial<Pick<QuickSpinItem, 'name' | 'weight' | 'displayLabel' | 'color' | 'hidden'>>) => void;
  onClose: () => void;
};

export default function AdvancedEditor({ items, onUpdate, onClose }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="advanced-editor">
      <div className="advanced-editor-header">
        <h3>Edit Entries</h3>
        <label className="settings-checkbox advanced-toggle">
          <input
            type="checkbox"
            checked={showAdvanced}
            onChange={e => setShowAdvanced(e.target.checked)}
          />
          <span className="settings-label">Advanced fields</span>
        </label>
      </div>

      <div className="advanced-editor-table-wrapper">
        <table className="advanced-editor-table">
          <thead>
            <tr>
              <th className="ae-col-name">Name</th>
              {showAdvanced && <th className="ae-col-weight">Weight</th>}
              {showAdvanced && <th className="ae-col-label">Label</th>}
              {showAdvanced && <th className="ae-col-color">Color</th>}
              {showAdvanced && <th className="ae-col-hidden">Hide</th>}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className={item.hidden ? 'ae-row-hidden' : ''}>
                <td>
                  <input
                    className="ae-input"
                    value={item.name}
                    onChange={e => onUpdate(item.id, { name: e.target.value })}
                  />
                </td>
                {showAdvanced && (
                  <td>
                    <input
                      className="ae-input ae-input-weight"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={item.weight ?? 1}
                      onChange={e => {
                        const v = parseFloat(e.target.value);
                        if (v > 0) onUpdate(item.id, { weight: v });
                      }}
                    />
                  </td>
                )}
                {showAdvanced && (
                  <td>
                    <input
                      className="ae-input"
                      placeholder="(same as name)"
                      value={item.displayLabel ?? ''}
                      onChange={e => onUpdate(item.id, { displayLabel: e.target.value || undefined })}
                    />
                  </td>
                )}
                {showAdvanced && (
                  <td>
                    <input
                      className="ae-color-input"
                      type="color"
                      value={item.color || '#667eea'}
                      onChange={e => onUpdate(item.id, { color: e.target.value })}
                    />
                    {item.color && (
                      <button
                        className="btn-icon ae-color-clear"
                        title="Reset color"
                        onClick={() => onUpdate(item.id, { color: undefined })}
                      >
                        &times;
                      </button>
                    )}
                  </td>
                )}
                {showAdvanced && (
                  <td>
                    <input
                      type="checkbox"
                      checked={item.hidden ?? false}
                      onChange={e => onUpdate(item.id, { hidden: e.target.checked })}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="advanced-editor-footer">
        <button className="btn btn-primary btn-sm" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
