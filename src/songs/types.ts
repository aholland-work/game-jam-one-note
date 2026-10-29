import type { Note } from '../music/notation'

export type Genre =
  | 'Classical'
  | 'Folk and kids'
  | 'Holiday'
  | 'Ragtime'
  | 'Americana'

export interface Song {
  id: string
  title: string
  genre: Genre
  /** Quarter-note beats per minute. */
  bpm: number
  beatsPerBar: number
  melody: Note[]
  /** Index into `melody` of the note the player has to find. */
  missingIndex: number
}
