import { midiToName } from '../music/notation'

/** How many mystery notes make up a round (endless practice has no limit). */
export const ROUND_LENGTH = 5
/** In endless practice with random keys, the key changes after this many notes. */
export const NOTES_PER_KEY = 10

export type EchoLevel = 'triad' | 'scale' | 'all'
export type EchoLength = 'round' | 'endless'
export type EchoKeyChoice = 'c' | 'random'

/** A major key: its home note (the 1) as a MIDI number from C4 up, and how to spell its notes. */
export interface EchoKey {
  tonic: number
  flats: boolean
}

export const C_MAJOR: EchoKey = { tonic: 60, flats: false }

// Every major key but F♯/G♭, whose E♯ or C♭ the piano can't spell.
export const ECHO_KEYS: EchoKey[] = [
  C_MAJOR,
  { tonic: 61, flats: true }, // D♭
  { tonic: 62, flats: false }, // D
  { tonic: 63, flats: true }, // E♭
  { tonic: 64, flats: false }, // E
  { tonic: 65, flats: true }, // F
  { tonic: 67, flats: false }, // G
  { tonic: 68, flats: true }, // A♭
  { tonic: 69, flats: false }, // A
  { tonic: 70, flats: true }, // B♭
  { tonic: 71, flats: false }, // B
]

export const keyName = (key: EchoKey) => `${midiToName(key.tonic, key.flats)} major`

/** Picks a random key, never the same as the previous one. */
export function pickKey(previous: EchoKey | null, random: () => number = Math.random): EchoKey {
  const choices = ECHO_KEYS.filter((key) => key.tonic !== previous?.tonic)
  return choices[Math.floor(random() * choices.length)]
}

/** The notes of the major scale, in half steps above the 1. */
export const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]
/** The 1, 3 and 5: the notes of the key's own chord. */
export const CHORD_TONES = [0, 4, 7]

/**
 * Levels add notes as the player improves: the chord's own notes, the scale, then every
 * note. Notes are half steps above the key's 1, so a level works in any key.
 */
export const ECHO_LEVELS: { id: EchoLevel; label: string; about: string; steps: number[] }[] = [
  {
    id: 'triad',
    label: 'Chord tones (1, 3, 5)',
    about: 'The mystery note is always the 1, 3 or 5: one of the three notes in the chord you hear.',
    steps: CHORD_TONES,
  },
  { id: 'scale', label: 'Major scale (1–7)', about: 'The mystery note can be any of the key’s 7 notes (the white keys, in C major).', steps: MAJOR_SCALE },
  {
    id: 'all',
    label: 'All 12 notes',
    about: 'Any note at all, including the 5 outside the key (the black keys, in C major).',
    steps: Array.from({ length: 12 }, (_, i) => i),
  },
]

export const stepsForLevel = (level: EchoLevel) =>
  (ECHO_LEVELS.find((option) => option.id === level) ?? ECHO_LEVELS[0]).steps

export const nextLevel = (level: EchoLevel): EchoLevel | null => {
  const index = ECHO_LEVELS.findIndex((option) => option.id === level)
  return ECHO_LEVELS[index + 1]?.id ?? null
}

const DEGREES = ['1', '♭2', '2', '♭3', '3', '4', '♯4', '5', '♭6', '6', '♭7', '7']

/** A note's number in the key, from half steps above the 1: 4 -> "3", 10 -> "♭7". */
export const degreeName = (step: number) => DEGREES[((step % 12) + 12) % 12]

/** The mystery note's MIDI number. Notes sit from the 1 upward, so the 7 is above the 1. */
export const noteInKey = (key: EchoKey, step: number) => key.tonic + step

/** E.g. "C♯, the 3 of A major". */
export const describeNote = (key: EchoKey, step: number) =>
  `${midiToName(noteInKey(key, step), key.flats)}, the ${degreeName(step)} of ${keyName(key)}`

/**
 * Picks the next mystery note, as half steps above the 1, never the same as the previous
 * one. Notes the player has missed come up more often: each miss adds two extra chances.
 */
export function pickEchoNote(
  steps: number[],
  previous: number | null,
  misses: Partial<Record<number, number>> = {},
  random: () => number = Math.random,
): number {
  const choices = steps.filter((step) => step !== previous)
  const weights = choices.map((step) => 1 + 2 * (misses[step] ?? 0))
  let pick = random() * weights.reduce((sum, weight) => sum + weight, 0)
  for (let i = 0; i < choices.length; i++) {
    pick -= weights[i]
    if (pick < 0) return choices[i]
  }
  return choices[choices.length - 1]
}
