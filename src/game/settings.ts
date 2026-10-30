const STORAGE_KEY = 'one-note:settings'

export type GameMode = 'missing-note' | 'one-note-off'

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

export interface SettingOption {
  key: keyof Settings
  label: string
  /** True when the setting shapes how a song is set up, so it can't change partway through. */
  nextSong: boolean
}

/** Each mode's optional rules, in the order they're listed. */
export const SETTING_OPTIONS: Record<GameMode, SettingOption[]> = {
  'missing-note': [
    { key: 'missingNoteTries', label: 'Try it: hear your note in the melody before locking in (3 tries)', nextSong: true },
  ],
  'one-note-off': [
    { key: 'oneNoteOffHighlight', label: 'Highlight notes on the staff as they play', nextSong: false },
    { key: 'oneNoteOffInKey', label: 'Harder: the changed note stays in the song’s key', nextSong: true },
    { key: 'oneNoteOffOneListen', label: 'Harder: hear the original only once', nextSong: true },
  ],
}
