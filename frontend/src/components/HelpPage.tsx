export default function HelpPage() {
  return (
    <div className="help-page">
      <section className="help-section">
        <h3>Getting Started</h3>
        <p>
          PickerWheel lets you randomly select from a list of names. By default, it loads with a Quick Spin
          containing demo names. Type your own names (one per line) using the <strong>Edit</strong> button.
        </p>
      </section>

      <section className="help-section">
        <h3>Editing Names</h3>
        <ul>
          <li><strong>Text editor:</strong> Open the Edit drawer and type names, one per line or comma-separated.</li>
          <li><strong>Table editor:</strong> Switch to the "Table" tab for per-entry settings like weight, label, color, and visibility.</li>
          <li><strong>Weights:</strong> Entries with higher weight get larger wheel segments and are more likely to be picked.</li>
          <li><strong>Colors:</strong> Override the default palette with custom colors per entry.</li>
          <li><strong>Hidden:</strong> Hide entries without deleting them. They won't appear on the wheel.</li>
        </ul>
      </section>

      <section className="help-section">
        <h3>Classes &amp; Sessions</h3>
        <ul>
          <li>Create a <strong>Class</strong> with a roster of students via the class selector dropdown.</li>
          <li>Each class can have multiple <strong>Sessions</strong> (e.g., one per lesson).</li>
          <li>Sessions remember which students have been picked and the full spin history.</li>
          <li>Click the session name above the wheel to rename it.</li>
        </ul>
      </section>

      <section className="help-section">
        <h3>Spin Modes</h3>
        <ul>
          <li><strong>Remove:</strong> Winners are moved to the Picked list (default).</li>
          <li><strong>Keep:</strong> Winners stay in the eligible pool — everyone can be picked again.</li>
          <li><strong>Accumulate:</strong> Like Keep, but designed for tallying votes. View frequency counts in the Results panel.</li>
        </ul>
      </section>

      <section className="help-section">
        <h3>Keyboard Shortcuts</h3>
        <table className="help-shortcuts">
          <tbody>
            <tr><td><kbd>Ctrl</kbd>+<kbd>Enter</kbd></td><td>Spin the wheel</td></tr>
            <tr><td><kbd>Ctrl</kbd>+<kbd>Z</kbd></td><td>Undo last action</td></tr>
            <tr><td><kbd>Delete</kbd></td><td>Remove selected items (when multi-selected in list)</td></tr>
            <tr><td><kbd>Ctrl</kbd>+click</td><td>Toggle-select items in the list</td></tr>
            <tr><td><kbd>Shift</kbd>+click</td><td>Range-select items in the list</td></tr>
          </tbody>
        </table>
      </section>

      <section className="help-section">
        <h3>Results &amp; Export</h3>
        <ul>
          <li>Open <strong>Results</strong> from the gear menu to see spin history and frequency counts.</li>
          <li>Export results as <strong>CSV</strong> for grade books or reports.</li>
          <li>Export/import all data as JSON for backups via the gear menu.</li>
        </ul>
      </section>

      <section className="help-section">
        <h3>Sharing</h3>
        <ul>
          <li><strong>Share URL:</strong> Copies a link with your current names encoded in the URL.</li>
          <li><strong>Embed mode:</strong> Add <code>?embed=true</code> to the URL for a minimal wheel-only view, ideal for iframes.</li>
        </ul>
      </section>

      <section className="help-section">
        <h3>Settings</h3>
        <ul>
          <li><strong>Auto-remove winners:</strong> Skip the winner dialog and automatically remove.</li>
          <li><strong>Spin duration:</strong> Adjust how long the wheel spins (2-12 seconds).</li>
          <li><strong>Easing style:</strong> Choose how the wheel decelerates (cubic, quartic, exponential).</li>
          <li><strong>Manual stop:</strong> Show a STOP button to stop the wheel wherever it lands.</li>
          <li><strong>Random start angle:</strong> Randomize the wheel's starting position on load.</li>
          <li><strong>Idle spin:</strong> Gentle rotation when the wheel is idle.</li>
        </ul>
      </section>

      <section className="help-section">
        <h3>FAQ</h3>
        <details>
          <summary>Is the random selection truly random?</summary>
          <p>Yes. PickerWheel uses the Web Crypto API (<code>crypto.getRandomValues()</code>) for cryptographically secure random number generation.</p>
        </details>
        <details>
          <summary>Where is my data stored?</summary>
          <p>All data is stored locally in your browser's localStorage. Nothing is sent to a server. Use Export/Import for backups.</p>
        </details>
        <details>
          <summary>Can I use this on a phone?</summary>
          <p>Yes! The layout adapts to smaller screens. On mobile, the wheel appears above the lists.</p>
        </details>
        <details>
          <summary>Why does the wheel sometimes land between segments?</summary>
          <p>The wheel always lands precisely in the center of the target segment. If it appears off, try zooming your browser to 100%.</p>
        </details>
      </section>
    </div>
  );
}
