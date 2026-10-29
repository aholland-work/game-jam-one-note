import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Scott Joplin, "The Entertainer" (1902), opening of the A strain in C major. Public domain.
// Rhythm transcribed from memory; not yet checked against the 1902 score.
export const entertainer: Song = {
  id: 'the-entertainer',
  title: 'The Entertainer',
  genre: 'Ragtime',
  difficulty: 'Hard',
  bpm: 80,
  beatsPerBar: 2,
  pickupBeats: 0.5,
  melody: parseMelody(`
    D4/s D#4/s | E4/s C5/e E4/s C5/e E4/s C5/s~ | C5/q. C5/s D5/s |
    D#5/s E5/s C5/s D5/s E5/e B4/s D5/s | C5/q r/q
  `),
  // The B that dips just before the phrase lands on C.
  missingIndex: 16,
}
