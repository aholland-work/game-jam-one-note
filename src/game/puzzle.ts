import type { Note } from '../music/notation'

/** The melody as the player first hears it: the missing note becomes silence. */
export function withGap(melody: Note[], missingIndex: number): Note[] {
  return melody.map((note, i) => (i === missingIndex ? { ...note, midi: null } : note))
}

/** The melody with the player's chosen note dropped into the gap. */
export function withGuess(melody: Note[], missingIndex: number, guessMidi: number): Note[] {
  return melody.map((note, i) => (i === missingIndex ? { ...note, midi: guessMidi } : note))
}
