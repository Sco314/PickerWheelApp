import type { SpinRecord } from './storage';

/**
 * Export spin history as a downloadable CSV file.
 */
export function exportResultsCSV(history: SpinRecord[], sessionName: string): void {
  if (history.length === 0) return;

  const timestamps = history.map(r => r.timestamp);
  const earliest = new Date(Math.min(...timestamps));
  const latest = new Date(Math.max(...timestamps));
  const dateRange = earliest.toLocaleDateString() === latest.toLocaleDateString()
    ? earliest.toLocaleDateString()
    : `${earliest.toLocaleDateString()} - ${latest.toLocaleDateString()}`;

  const rows: string[] = [];
  rows.push(`# Session: ${csvEscape(sessionName)}`);
  rows.push(`# Date: ${dateRange}`);
  rows.push('');
  rows.push('Spin #,Winner,Action,Timestamp');

  for (let i = 0; i < history.length; i++) {
    const r = history[i];
    const action = r.removedFromPool ? 'Removed' : 'Kept';
    const time = new Date(r.timestamp).toLocaleString();
    rows.push(`${i + 1},${csvEscape(r.entryName)},${action},${csvEscape(time)}`);
  }

  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sessionName.replace(/[^a-zA-Z0-9_-]/g, '_')}-results.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
