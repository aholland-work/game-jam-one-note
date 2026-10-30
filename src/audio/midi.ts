import { useEffect, useEffectEvent, useSyncExternalStore } from 'react'
import { audioEngine } from './engine'

/**
 * MIDI input: notes played on a connected keyboard or wind controller press the game's
 * piano keys. Uses the Web MIDI API (Chrome, Edge and Firefox; not Safari).
 */

export type Transpose = 'c' | 'bb' | 'eb'

/** Instruments that read music in one key and sound in another, and how far they shift. */
export const TRANSPOSE_OPTIONS: { id: Transpose; label: string; semitones: number }[] = [
  { id: 'c', label: 'C (keyboard, flute, violin)', semitones: 0 },
  { id: 'bb', label: 'B♭ (tenor or soprano sax, trumpet, clarinet)', semitones: -2 },
  { id: 'eb', label: 'E♭ (alto or baritone sax)', semitones: -9 },
]

/** The note a message starts, or null for anything else (a note-on with velocity 0 is a release). */
export function parseNoteOn(data: Uint8Array): number | null {
  const [status, note, velocity] = data
  return (status & 0xf0) === 0x90 && velocity > 0 ? note : null
}

/** The sounding pitch of a note written for a transposing instrument. */
export const toConcert = (midi: number, transpose: Transpose) =>
  midi + (TRANSPOSE_OPTIONS.find((option) => option.id === transpose)?.semitones ?? 0)

/** Moves a note by octaves until it lands on a piano that starts at `startMidi`. */
export function foldIntoPiano(midi: number, startMidi: number, octaves: number): number {
  const span = 12 * octaves
  return startMidi + ((((midi - startMidi) % span) + span) % span)
}

export type MidiStatus = 'unsupported' | 'off' | 'connecting' | 'on' | 'blocked'

export interface MidiState {
  status: MidiStatus
  /** Names of the connected instruments. */
  devices: string[]
  transpose: Transpose
  /** Play the game's piano sound for MIDI notes (off for instruments with their own sound). */
  sound: boolean
  /** The last note heard, after transposing, to check the setup. */
  lastNote: number | null
}

const STORAGE_KEY = 'one-note:midi'

interface SavedPrefs {
  enabled: boolean
  transpose: Transpose
  sound: boolean
}

function loadPrefs(): SavedPrefs {
  const defaults: SavedPrefs = { enabled: false, transpose: 'c', sound: true }
  try {
    return { ...defaults, ...(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<SavedPrefs>) }
  } catch {
    return defaults
  }
}

class MidiInput {
  private prefs = loadPrefs()
  private access: MIDIAccess | null = null
  private stateListeners = new Set<() => void>()
  private noteListeners = new Set<(midi: number) => void>()
  state: MidiState = {
    status: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator ? 'off' : 'unsupported',
    devices: [],
    transpose: this.prefs.transpose,
    sound: this.prefs.sound,
    lastNote: null,
  }

  /** Whether the player turned MIDI on before, so it can reconnect quietly. */
  get wasEnabled() {
    return this.prefs.enabled
  }

  subscribe = (listener: () => void) => {
    this.stateListeners.add(listener)
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  onNote(listener: (midi: number) => void) {
    this.noteListeners.add(listener)
    return () => {
      this.noteListeners.delete(listener)
    }
  }

  async connect() {
    if (this.state.status === 'unsupported' || this.state.status === 'connecting' || this.access) return
    this.update({ status: 'connecting' })
    try {
      this.access = await navigator.requestMIDIAccess()
      this.access.onstatechange = () => this.attachInputs()
      this.attachInputs()
      this.savePrefs({ enabled: true })
      this.update({ status: 'on' })
    } catch {
      // Permission refused, or blocked by the browser's site settings.
      this.update({ status: 'blocked' })
    }
  }

  disconnect() {
    this.access?.inputs.forEach((input) => (input.onmidimessage = null))
    if (this.access) this.access.onstatechange = null
    this.access = null
    this.savePrefs({ enabled: false })
    this.update({ status: 'off', devices: [], lastNote: null })
  }

  setTranspose(transpose: Transpose) {
    this.savePrefs({ transpose })
    this.update({ transpose })
  }

  setSound(sound: boolean) {
    this.savePrefs({ sound })
    this.update({ sound })
  }

  /** Plays a pressed key, unless it came from an instrument that makes its own sound. */
  playKey(midi: number, fromMidi: boolean) {
    if (!fromMidi || this.state.sound) audioEngine.playNote(midi)
  }

  // Listens to every connected input, including ones plugged in later.
  private attachInputs() {
    const devices: string[] = []
    this.access?.inputs.forEach((input) => {
      if (input.state !== 'connected') return
      devices.push(input.name ?? 'MIDI instrument')
      input.onmidimessage = (event) => {
        const note = event.data ? parseNoteOn(event.data) : null
        if (note === null) return
        const concert = toConcert(note, this.state.transpose)
        this.update({ lastNote: concert })
        this.noteListeners.forEach((listener) => listener(concert))
      }
    })
    this.update({ devices })
  }

  private savePrefs(changes: Partial<SavedPrefs>) {
    this.prefs = { ...this.prefs, ...changes }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs))
    } catch {
      // Storage can be unavailable; the setting then lasts until the page closes.
    }
  }

  private update(changes: Partial<MidiState>) {
    this.state = { ...this.state, ...changes }
    this.stateListeners.forEach((listener) => listener())
  }
}

export const midiInput = new MidiInput()

/** The current MIDI connection and settings, kept up to date. */
export function useMidiState(): MidiState {
  return useSyncExternalStore(midiInput.subscribe, () => midiInput.state)
}

/** Calls `handler` with each note played on a connected instrument (sounding pitch). */
export function useMidiNotes(handler: (midi: number) => void) {
  const onNote = useEffectEvent(handler)
  useEffect(() => midiInput.onNote((midi) => onNote(midi)), [])
}
