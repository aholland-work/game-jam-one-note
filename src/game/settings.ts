const STORAGE_KEY = 'one-note:settings'

/** Optional gameplay rules players can switch on or off from the song list. */
export interface Settings {
  /** Missing Note: hear your chosen note in the melody (up to 3 times) before locking in. */
  missingNoteTries: boolean
  /** One Note Off: light up each note on the staff as it plays. */
  oneNoteOffHighlight: boolean
  /** One Note Off: the changed note only becomes a note the song already uses. */
  oneNoteOffInKey: boolean
  /** One Note Off: the original can be heard only once while guessing. */
  oneNoteOffOneListen: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  missingNoteTries: false,
  oneNoteOffHighlight: true,
  oneNoteOffInKey: true,
  oneNoteOffOneListen: false,
}

// Storage can be unavailable (private windows, blocked site data); defaults apply then.
export function loadSettings(): Settings {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Settings>
    return { ...DEFAULT_SETTINGS, ...saved }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Nothing to do; see above.
  }
}
