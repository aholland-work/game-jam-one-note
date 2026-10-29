export interface Note {
  /** MIDI note number (60 = middle C), or null for a rest. */
  midi: number | null
  /** Length in beats, where a quarter note is 1. */
  beats: number
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

/** Converts scientific pitch notation ("C4", "D#5", "Bb3") to a MIDI number. */
export function pitchToMidi(pitch: string): number {
  const match = /^([A-G])(#|b)?(\d)$/.exec(pitch)
  if (!match) throw new Error(`Invalid pitch "${pitch}"`)
  const [, letter, accidental, octave] = match
  const offset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0
  return (Number(octave) + 1) * 12 + LETTER_SEMITONES[letter] + offset
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
 * `E4/q E4/q F4/q G4/q | G4/q F4/q E4/q D4/q`. Use `r` as the pitch for a rest.
 * Bar lines (`|`) are only there to make songs readable and are ignored.
 */
export function parseMelody(text: string): Note[] {
  return text
    .split(/\s+/)
    .filter((token) => token !== '' && token !== '|')
    .map((token) => {
      const [pitch, duration] = token.split('/')
      if (!duration) throw new Error(`Missing duration in "${token}"`)
      return {
        midi: pitch === 'r' ? null : pitchToMidi(pitch),
        beats: parseDuration(duration),
      }
    })
}
