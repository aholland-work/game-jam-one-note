import { midiToPitch, type Note } from '../music/notation'
import type { Song } from '../songs/types'

export interface NoteChange {
  /** Index of the changed note in the melody. */
  index: number
  /** The pitch it plays at in the changed version. */
  midi: number
}

// Shorter notes go by too fast to judge, and tied notes blur into their neighbor.
const MIN_BEATS = 0.5
const LOWEST = 57
const HIGHEST = 88

/** Every pitch class (C, C♯, …) the melody uses: its scale, in effect. */
export function melodyPitchClasses(melody: Note[]): Set<number> {
  return new Set(melody.flatMap((note) => (note.midi === null ? [] : [note.midi % 12])))
}

export type Difficulty = 'easy' | 'hard'

/**
 * Picks one note to move for a One Note Off round. It never matches the notes on either
 * side, so the change can't hide in a repeat.
 *
 * - Easy: the note moves 1 to 3 half steps up or down, to any pitch.
 * - Hard: the note moves up to 4 half steps to a pitch the melody already uses, so the
 *   changed version still sounds plausible.
 */
export function pickChange(
  song: Song,
  { difficulty = 'easy' }: { difficulty?: Difficulty } = {},
  random: () => number = Math.random,
): NoteChange {
  const { melody } = song
  const pitchClasses = melodyPitchClasses(melody)
  const candidates = (midi: number) =>
    difficulty === 'hard'
      ? [-4, -3, -2, -1, 1, 2, 3, 4].map((offset) => midi + offset).filter((pitch) => pitchClasses.has(pitch % 12))
      : [-3, -2, -1, 1, 2, 3].map((offset) => midi + offset)
  const options: NoteChange[] = []
  melody.forEach((note, index) => {
    if (note.midi === null || note.beats < MIN_BEATS) return
    if (note.tie || melody[index - 1]?.tie) return
    for (const midi of candidates(note.midi)) {
      if (midi < LOWEST || midi > HIGHEST) continue
      if (midi === melody[index - 1]?.midi || midi === melody[index + 1]?.midi) continue
      options.push({ index, midi })
    }
  })
  if (options.length === 0) throw new Error(`${song.id}: no note can be changed`)
  // Choose the note first, then the new pitch, so notes with more options aren't favored.
  const indices = [...new Set(options.map((option) => option.index))]
  const index = indices[Math.floor(random() * indices.length)]
  const forNote = options.filter((option) => option.index === index)
  return forNote[Math.floor(random() * forNote.length)]
}

/** The melody with one note moved. */
export function withChange(melody: Note[], change: NoteChange): Note[] {
  return melody.map((note, i) =>
    i === change.index ? { ...note, midi: change.midi, pitch: midiToPitch(change.midi) } : note,
  )
}
