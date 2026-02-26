import { useState } from 'react';
import type { SpinRecord } from '../services/storage';
import { exportResultsCSV } from '../services/export';

type Props = {
  history: SpinRecord[];
  sessionName: string;
};

export default function ResultsPanel({ history, sessionName }: Props) {
  const [activeTab, setActiveTab] = useState<'history' | 'frequency'>('history');

  // Frequency counts
  const frequencyMap = new Map<string, number>();
  for (const record of history) {
    frequencyMap.set(record.entryName, (frequencyMap.get(record.entryName) || 0) + 1);
  }
  const frequencyRows = [...frequencyMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, pct: history.length > 0 ? (count / history.length * 100) : 0 }));

  const handleExportCSV = () => {
    exportResultsCSV(history, sessionName);
  };

  return (
    <div className="results-panel">
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          className={`settings-tab ${activeTab === 'frequency' ? 'active' : ''}`}
          onClick={() => setActiveTab('frequency')}
        >
          Frequency
        </button>
      </div>

      {activeTab === 'history' && (
        <div className="results-history">
          {history.length === 0 ? (
            <p className="empty-state">No spins yet. Spin the wheel to see results here!</p>
          ) : (
            <table className="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Winner</th>
                  <th>Action</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record, i) => (
                  <tr key={`${record.entryId}-${record.timestamp}`}>
                    <td className="results-num">{i + 1}</td>
                    <td className="results-name">{record.entryName}</td>
                    <td className="results-action">
                      <span className={record.removedFromPool ? 'action-removed' : 'action-kept'}>
                        {record.removedFromPool ? 'Removed' : 'Kept'}
                      </span>
                    </td>
                    <td className="results-time">
                      {new Date(record.timestamp).toLocaleTimeString(undefined, {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'frequency' && (
        <div className="results-frequency">
          {frequencyRows.length === 0 ? (
            <p className="empty-state">No data yet.</p>
          ) : (
            <table className="results-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Count</th>
                  <th>%</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {frequencyRows.map(row => (
                  <tr key={row.name}>
                    <td className="results-name">{row.name}</td>
                    <td className="results-count">{row.count}</td>
                    <td className="results-pct">{row.pct.toFixed(1)}%</td>
                    <td className="results-bar-cell">
                      <div
                        className="results-bar"
                        style={{ width: `${row.pct}%` }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="results-footer">
          <span className="results-total">{history.length} spin{history.length !== 1 ? 's' : ''} total</span>
          <button className="btn btn-secondary-dark btn-sm" onClick={handleExportCSV}>
            Export CSV
          </button>
        </div>
      )}
    </div>
  );
}
