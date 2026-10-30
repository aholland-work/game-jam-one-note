import type { EchoKeyChoice, EchoLength, EchoLevel } from './echoNote'

const STORAGE_KEY = 'one-note:settings'

export type GameMode = 'missing-note' | 'one-note-off' | 'echo-note'

/** Optional One Note Off rules players can switch on or off. */
export interface Settings {
  /** One Note Off: light up each note on the staff as it plays. */
  oneNoteOffHighlight: boolean
  /**
   * One Note Off on Hard: the changed note stays in the song's key, and the original can
   * be heard only once while guessing.
   */
  oneNoteOffHard: boolean
  /** Echo Note: which notes can come up. */
  echoLevel: EchoLevel
  /** Echo Note: five-note rounds, or endless practice. */
  echoLength: EchoLength
  /** Echo Note: always C major, or a new key each round. */
  echoKey: EchoKeyChoice
  /** Echo Note: tint the key's notes on the piano and show their numbers. */
  echoShowScale: boolean
  /** Echo Note: play the mystery note while the chord is still ringing, like a solo over a band. */
  echoOverChord: boolean
  /** Every mode: letter keys play the piano from anywhere on the page, not only when it has focus. */
  lettersAnywhere: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  oneNoteOffHighlight: true,
  oneNoteOffHard: false,
  echoLevel: 'triad',
  echoLength: 'round',
  echoKey: 'c',
  echoShowScale: true,
  echoOverChord: false,
  lettersAnywhere: true,
}

// Storage can be unavailable (private windows, blocked site data); defaults apply then.
export function loadSettings(): Settings {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Settings>
    // Only keep known keys, so options removed in later versions don't linger.
    const known = Object.fromEntries(
      Object.entries(saved).filter(([key]) => key in DEFAULT_SETTINGS),
    ) as Partial<Settings>
    return { ...DEFAULT_SETTINGS, ...known }
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

/** The on/off settings, which the Settings menu shows as checkboxes. */
type ToggleSetting = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings]

export interface SettingOption {
  key: ToggleSetting
  label: string
  /** True when the setting shapes how a song is set up, so it can't change partway through. */
  nextSong: boolean
}

// Voice control and some screen readers send single letters, which could play notes by accident.
export const LETTERS_ANYWHERE: SettingOption = {
  key: 'lettersAnywhere',
  label: 'Letter keys (A, W, S…) play the piano from anywhere on the page. Turn off if you use voice control or a screen reader',
  nextSong: false,
}

/**
 * Each mode's optional rules, in the order they're listed. Missing Note has no Settings menu,
 * so its letter keys switch sits in the Keyboard shortcuts panel under the piano instead.
 */
export const SETTING_OPTIONS: Record<GameMode, SettingOption[]> = {
  'missing-note': [],
  'echo-note': [
    { key: 'echoShowScale', label: 'Show the key’s notes and their numbers on the piano', nextSong: false },
    {
      key: 'echoOverChord',
      label: 'Play the mystery note over the chord, like a solo over a band (harder)',
      nextSong: false,
    },
    LETTERS_ANYWHERE,
  ],
  'one-note-off': [
    { key: 'oneNoteOffHighlight', label: 'Highlight notes on the staff as they play', nextSong: false },
    {
      key: 'oneNoteOffHard',
      label: 'Hard mode: the changed note only moves to the next note in the song’s key (fast notes too), and you hear the original only once',
      nextSong: true,
    },
    LETTERS_ANYWHERE,
  ],
}
