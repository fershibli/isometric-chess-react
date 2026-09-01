const STORAGE_KEY = 'isometric-chess:settings'

export const DEFAULT_SETTINGS = {
  /** Ripple and swell strength: 0 turns the water off entirely. */
  water: 0.55,
  trails: true,
  coordinates: true,
  pitch: 0.56,
  rotation: 0,
}

export const WATER_LEVELS = [
  { value: 0, label: 'Still' },
  { value: 0.55, label: 'Subtle' },
  { value: 1, label: 'Full' },
]

export const PITCH_LEVELS = [
  { value: 0.42, label: 'Low' },
  { value: 0.56, label: 'Mid' },
  { value: 0.7, label: 'High' },
]

const NUMBERS = new Set(['water', 'pitch', 'rotation'])

/** Keeps a hand-edited or outdated stored blob from breaking the app. */
export function normaliseSettings(raw) {
  const settings = { ...DEFAULT_SETTINGS }
  if (!raw || typeof raw !== 'object') return settings

  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const value = raw[key]
    if (NUMBERS.has(key)) {
      if (Number.isFinite(value)) settings[key] = value
    } else if (typeof value === 'boolean') {
      settings[key] = value
    }
  }

  settings.water = Math.min(1, Math.max(0, settings.water))
  settings.pitch = Math.min(0.8, Math.max(0.3, settings.pitch))
  settings.rotation = ((Math.round(settings.rotation) % 4) + 4) % 4
  return settings
}

export function loadSettings() {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS }
  try {
    return normaliseSettings(JSON.parse(window.localStorage.getItem(STORAGE_KEY)))
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Private browsing, quota, or storage disabled: the session still works,
    // it just will not be remembered.
  }
}
