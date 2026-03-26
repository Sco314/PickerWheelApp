// App settings for PickerWheelApp

const SETTINGS_KEY = 'pickerWheelSettings';

export type SpinEasing = 'cubic' | 'quart' | 'expo';
export type ThemeMode = 'auto' | 'light' | 'dark';

export interface AppSettings {
  autoRemoveWinners: boolean;
  spinDuration: number;       // seconds, 1–60 (default 4)
  spinEasing: SpinEasing;     // easing preset (default 'cubic')
  randomStartAngle: boolean;  // randomize wheel position on load (default true)
  idleSpin: boolean;          // gentle constant rotation when idle (default false)
  manualStop: boolean;        // show stop button during spin (default false)
  theme: ThemeMode;           // color scheme (default 'auto')
}

const DEFAULT_SETTINGS: AppSettings = {
  autoRemoveWinners: false,
  spinDuration: 4,
  spinEasing: 'cubic',
  randomStartAngle: true,
  idleSpin: false,
  manualStop: false,
  theme: 'auto',
};

export function getAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* use defaults */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveAppSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
