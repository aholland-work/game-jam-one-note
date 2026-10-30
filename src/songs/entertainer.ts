import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Scott Joplin, "The Entertainer" (1902), opening of the A strain in C major. Public domain.
export const entertainer: Song = {
  id: 'the-entertainer',
  title: 'The Entertainer',
  genre: 'Ragtime',
  difficulty: 'Hard',
  bpm: 72,
  beatsPerBar: 2,
  pickupBeats: 0.5,
  melody: parseMelody(`
    D4/s D#4/s | E4/s C5/e E4/s C5/e E4/s C5/s~ | C5/q~ C5/s C6/s D6/s D#6/s |
    E6/s C6/s D6/s E6/s~ E6/s B5/s D6/e | C6/q. r/e
  `),
  // The B that dips just before the phrase lands on C.
  missingIndex: 18,
  source: {
    url: 'https://www.mutopiaproject.org/ftp/JoplinS/entertainer/entertainer.ly',
    notes: "A strain, pickup and bars 5-8, top line of the right hand, at the score's quarter = 72. The last C is cut short to end the excerpt.",
  },
}
