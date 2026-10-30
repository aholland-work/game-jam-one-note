export interface Note {
  /** MIDI note number (60 = middle C), or null for a rest. */
  midi: number | null
  /** Spelled pitch as written ("D#5"), used to place the note on the staff. Null for a rest. */
  pitch: string | null
  /** Length in beats, where a quarter note is 1. */
  beats: number
  /** Tied into the next note (same pitch): the two sound as one held note. */
  tie?: boolean
  /** Other pitches sounding with this note, making it a chord. Only used for sound, not the staff. */
  chord?: number[]
}

const LETTER_SEMITONES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

const DURATION_BEATS: Record<string, number> = {
  w: 4,
  h: 2,
  q: 1,
  e: 0.5,
  s: 0.25,
}

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

export interface PitchParts {
  letter: string
  accidental: '#' | 'b' | ''
  octave: number
}

export function parsePitch(pitch: string): PitchParts {
  const match = /^([A-G])(#|b)?(\d)$/.exec(pitch)
  if (!match) throw new Error(`Invalid pitch "${pitch}"`)
  const [, letter, accidental = '', octave] = match
  return { letter, accidental: accidental as PitchParts['accidental'], octave: Number(octave) }
}

/** Converts scientific pitch notation ("C4", "D#5", "Bb3") to a MIDI number. */
export function pitchToMidi(pitch: string): number {
  const { letter, accidental, octave } = parsePitch(pitch)
  const offset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0
  return (octave + 1) * 12 + LETTER_SEMITONES[letter] + offset
}

/** Whether a melody is written with flats (like Maple Leaf Rag's A♭ major) rather than sharps. */
export function usesFlats(melody: Note[]): boolean {
  return melody.some((note) => note.pitch?.[1] === 'b')
}

/** Spells a MIDI number, with sharps by default: 63 -> "D#4", or "Eb4" with `flats`. */
export function midiToPitch(midi: number, flats = false): string {
  return `${(flats ? FLAT_NAMES : SHARP_NAMES)[midi % 12]}${Math.floor(midi / 12) - 1}`
}

/** A note's name without its octave, as shown on the piano, e.g. 63 -> "D♯" (or "E♭" with `flats`). */
export function midiToName(midi: number, flats = false): string {
  return (flats ? FLAT_NAMES : SHARP_NAMES)[midi % 12].replace('#', '\u266F').replace(/^([A-G])b$/, '$1\u266D')
}

/** Position on the staff counted in letter steps (C4 = 28, E4 = 30), ignoring accidentals. */
export function diatonicStep(pitch: string): number {
  const { letter, octave } = parsePitch(pitch)
  return octave * 7 + 'CDEFGAB'.indexOf(letter)
}

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

/** Parses "q", "h.", "e" etc. into beats. A trailing dot adds half the value. */
export function parseDuration(token: string): number {
  const match = /^([whqes])(\.)?$/.exec(token)
  if (!match) throw new Error(`Invalid duration "${token}"`)
  const beats = DURATION_BEATS[match[1]]
  return match[2] ? beats * 1.5 : beats
}

/**
 * Parses a melody written as space-separated `pitch/duration` tokens, e.g.
 * `E4/q E4/q F4/q G4/q | G4/q F4/q E4/q D4/q`. Use `r` as the pitch for a rest and
 * end a duration with `~` to tie the note into the next one (`C5/s~ C5/q.`).
 * Bar lines (`|`) are only there to make songs readable and are ignored.
 */
export function parseMelody(text: string): Note[] {
  return text
    .split(/\s+/)
    .filter((token) => token !== '' && token !== '|')
    .map((token) => {
      const [pitch, rawDuration] = token.split('/')
      if (!rawDuration) throw new Error(`Missing duration in "${token}"`)
      const tie = rawDuration.endsWith('~')
      const duration = tie ? rawDuration.slice(0, -1) : rawDuration
      const isRest = pitch === 'r'
      const note: Note = {
        midi: isRest ? null : pitchToMidi(pitch),
        pitch: isRest ? null : pitch,
        beats: parseDuration(duration),
      }
      if (tie) note.tie = true
      return note
    })
}
