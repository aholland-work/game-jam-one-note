import { parseMelody } from '../music/notation'
import type { Song } from './types'

// James Lord Pierpont (1857), chorus in C major. Public domain.
export const jingleBells: Song = {
  id: 'jingle-bells',
  title: 'Jingle Bells',
  genre: 'Holiday',
  difficulty: 'Easy',
  bpm: 120,
  beatsPerBar: 4,
  melody: parseMelody(`
    E4/q E4/q E4/h | E4/q E4/q E4/h | E4/q G4/q C4/q. D4/e | E4/w
  `),
  // The low dip on "all" in "jingle all the way".
  missingIndex: 8,
}
