import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Grieg, "In the Hall of the Mountain King" from Peer Gynt (1876), opening theme in B minor. Public domain.
export const mountainKing: Song = {
  id: 'mountain-king',
  title: 'In the Hall of the Mountain King',
  genre: 'Classical',
  difficulty: 'Hard',
  bpm: 112,
  beatsPerBar: 4,
  melody: parseMelody(`
    B3/e C#4/e D4/e E4/e F#4/e D4/e F#4/q | E#4/e C#4/e E#4/q E4/e C4/e E4/q |
    B3/e C#4/e D4/e E4/e F#4/e D4/e F#4/e B4/e | A4/e F#4/e D4/e F#4/e A4/h
  `),
  // The low note in the third step of the creeping chromatic slide (E, C, E).
  missingIndex: 11,
}
