import type { Note } from '../music/notation'

export type Genre = 'Classical' | 'Folk and kids' | 'Holiday' | 'Ragtime' | 'Americana'

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface Song {
  id: string
  title: string
  genre: Genre
  difficulty: Difficulty
  /** Quarter-note beats per minute. */
  bpm: number
  beatsPerBar: number
  /** Length of a pickup before the first full bar, in beats. Omit when there is none. */
  pickupBeats?: number
  melody: Note[]
  /** Index into `melody` of the note the player has to find. */
  missingIndex: number
}
