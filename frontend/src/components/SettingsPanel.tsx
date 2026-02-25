import { useState } from 'react';
import { type AppSettings, getAppSettings, saveAppSettings } from '../services/settings';
import { type SoundSettings, getSoundSettings, saveSoundSettings } from '../services/sounds';

type Props = {
  onSettingsChanged: () => void;
};

export default function SettingsPanel({ onSettingsChanged }: Props) {
  const [appSettings, setAppSettings] = useState<AppSettings>(getAppSettings);
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(getSoundSettings);
  const [activeTab, setActiveTab] = useState<'general' | 'sounds' | 'credits'>('general');

  const updateApp = (patch: Partial<AppSettings>) => {
    const updated = { ...appSettings, ...patch };
    setAppSettings(updated);
    saveAppSettings(updated);
    onSettingsChanged();
  };

  const updateSound = (patch: Partial<SoundSettings>) => {
    const updated = { ...soundSettings, ...patch };
    setSoundSettings(updated);
    saveSoundSettings(updated);
  };

  return (
    <div className="settings-panel">
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={`settings-tab ${activeTab === 'sounds' ? 'active' : ''}`}
          onClick={() => setActiveTab('sounds')}
        >
          Sounds
        </button>
        <button
          className={`settings-tab ${activeTab === 'credits' ? 'active' : ''}`}
          onClick={() => setActiveTab('credits')}
        >
          Credits
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="settings-section">
          <label className="settings-checkbox">
            <input
              type="checkbox"
              checked={appSettings.autoRemoveWinners}
              onChange={e => updateApp({ autoRemoveWinners: e.target.checked })}
            />
            <div>
              <div className="settings-label">Auto-remove winners</div>
              <div className="settings-desc">
                Automatically remove winners from the wheel without showing the dialog. Useful for speed rounds.
              </div>
            </div>
          </label>
        </div>
      )}

      {activeTab === 'sounds' && (
        <div className="settings-section">
          <label className="settings-checkbox">
            <input
              type="checkbox"
              checked={soundSettings.enabled}
              onChange={e => updateSound({ enabled: e.target.checked })}
            />
            <div>
              <div className="settings-label">Enable sounds</div>
            </div>
          </label>

          <label className="settings-checkbox">
            <input
              type="checkbox"
              checked={soundSettings.tickEnabled}
              disabled={!soundSettings.enabled}
              onChange={e => updateSound({ tickEnabled: e.target.checked })}
            />
            <div>
              <div className="settings-label">Tick sounds during spin</div>
              <div className="settings-desc">
                Short click as each peg passes the pointer flapper.
              </div>
            </div>
          </label>

          <label className="settings-checkbox">
            <input
              type="checkbox"
              checked={soundSettings.celebrationEnabled}
              disabled={!soundSettings.enabled}
              onChange={e => updateSound({ celebrationEnabled: e.target.checked })}
            />
            <div>
              <div className="settings-label">Celebration sound on win</div>
              <div className="settings-desc">
                Chime when a winner is selected.
              </div>
            </div>
          </label>

          <div className="settings-range">
            <div className="settings-label">Volume</div>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(soundSettings.volume * 100)}
              disabled={!soundSettings.enabled}
              onChange={e => updateSound({ volume: parseInt(e.target.value) / 100 })}
            />
            <span className="settings-range-value">{Math.round(soundSettings.volume * 100)}%</span>
          </div>
        </div>
      )}

      {activeTab === 'credits' && (
        <div className="settings-section">
          <div className="credits-section">
            <h3>Sound Effects</h3>
            <div className="credits-item">
              <strong>Tick / Flapper Sound</strong>
              <p>
                Generated via Web Audio API (synthesized percussive click).
                Inspired by{' '}
                <a href="https://freesound.org/people/door15studio/sounds/244774/" target="_blank" rel="noopener noreferrer">
                  "spin-tick.mp3"
                </a>
                {' '}by door15studio (CC0, Freesound #244774).
              </p>
            </div>
            <div className="credits-item">
              <strong>Celebration Chime</strong>
              <p>
                Generated via Web Audio API (synthesized ascending C-E-G triad).
                Inspired by{' '}
                <a href="https://freesound.org/people/jimhancock/sounds/376318/" target="_blank" rel="noopener noreferrer">
                  "TaDa!.wav"
                </a>
                {' '}by jimhancock (CC0, Freesound #376318).
              </p>
            </div>
            <div className="credits-item">
              <strong>Recommended CC0 alternatives</strong>
              <p>
                Tick:{' '}
                <a href="https://freesound.org/people/malle99/sounds/384187/" target="_blank" rel="noopener noreferrer">
                  malle99 #384187
                </a>
                ,{' '}
                <a href="https://freesound.org/people/Breviceps/sounds/447938/" target="_blank" rel="noopener noreferrer">
                  Breviceps #447938
                </a>
                . Celebration:{' '}
                <a href="https://freesound.org/people/Licorne_En_Fer/sounds/647709/" target="_blank" rel="noopener noreferrer">
                  Licorne_En_Fer #647709
                </a>
                ,{' '}
                <a href="https://freesound.org/people/grunz/sounds/109662/" target="_blank" rel="noopener noreferrer">
                  grunz #109662
                </a>
                ,{' '}
                <a href="https://freesound.org/people/Breviceps/sounds/462362/" target="_blank" rel="noopener noreferrer">
                  Breviceps #462362 (applause)
                </a>
                . All CC0 / Public Domain.
              </p>
            </div>
          </div>
          <div className="credits-section">
            <h3>Inspiration</h3>
            <div className="credits-item">
              <strong>Wheel of Names</strong>
              <p>
                UX patterns and design inspiration from{' '}
                <a href="https://wheelofnames.com" target="_blank" rel="noopener noreferrer">wheelofnames.com</a>
                {' '}by{' '}
                <a href="https://github.com/momander/wheel-spinner" target="_blank" rel="noopener noreferrer">momander</a>
                {' '}(Apache-2.0 license).
              </p>
            </div>
          </div>
          <div className="credits-section">
            <h3>Technology</h3>
            <div className="credits-item">
              <p>Built with React, TypeScript, Vite, and HTML5 Canvas.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
