import type { Note } from '../music/notation'

export type Genre = 'Classical' | 'Folk songs' | 'Holiday' | 'Ragtime' | 'Americana'

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
  /** In 6/8: counted in dotted quarters, so fast notes are beamed in threes. */
  compound?: boolean
  melody: Note[]
  /** Index into `melody` of the note the player has to find. */
  missingIndex: number
  /** The public-domain transcription this melody was checked against, note by note. */
  source: {
    url: string
    /** Which bars were used and anything changed from the source (key, octave, rhythm). */
    notes: string
    /**
     * A MIDI rendering of the source in `song-sources/`, and the track holding the tune.
     * A test checks the melody against it note by note.
     */
    midi: { file: string; track: number }
  }
}
