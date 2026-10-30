import { midiToPitch, usesFlats, type Note } from '../music/notation'
import type { Song } from '../songs/types'

export interface NoteChange {
  /** Index of the changed note in the melody. */
  index: number
  /** The pitch it plays at in the changed version. */
  midi: number
}

// On Easy, shorter notes go by too fast to judge; Hard allows them. Tied notes blur into
// their neighbor, so they're never changed.
const MIN_BEATS = { easy: 0.5, hard: 0.25 }
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
 * - Hard: the note moves to the next scale note above or below (a pitch the melody already
 *   uses, 1 or 2 half steps away), so the changed version still sounds plausible. Fast
 *   notes can be changed too.
 */
export function pickChange(
  song: Song,
  { difficulty = 'easy' }: { difficulty?: Difficulty } = {},
  random: () => number = Math.random,
): NoteChange {
  const { melody } = song
  const pitchClasses = melodyPitchClasses(melody)
  const inKey = (pitch: number) => pitchClasses.has(pitch % 12)
  const candidates = (midi: number) =>
    difficulty === 'hard'
      ? [
          [-1, -2].map((offset) => midi + offset).find(inKey),
          [1, 2].map((offset) => midi + offset).find(inKey),
        ].filter((pitch): pitch is number => pitch !== undefined)
      : [-3, -2, -1, 1, 2, 3].map((offset) => midi + offset)
  const options: NoteChange[] = []
  melody.forEach((note, index) => {
    if (note.midi === null || note.beats < MIN_BEATS[difficulty]) return
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
    i === change.index ? { ...note, midi: change.midi, pitch: midiToPitch(change.midi, usesFlats(melody)) } : note,
  )
}
