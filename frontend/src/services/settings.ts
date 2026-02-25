// App settings for PickerWheelApp

const SETTINGS_KEY = 'pickerWheelSettings';

export interface AppSettings {
  autoRemoveWinners: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  autoRemoveWinners: false,
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
