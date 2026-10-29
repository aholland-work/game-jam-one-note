import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Albert Von Tilzer (1908), opening of the chorus in C major. Public domain.
export const takeMeOut: Song = {
  id: 'take-me-out',
  title: 'Take Me Out to the Ball Game',
  genre: 'Americana',
  difficulty: 'Medium',
  bpm: 160,
  beatsPerBar: 3,
  melody: parseMelody(`
    C4/h C5/q | A4/q G4/q E4/q | G4/h. | D4/h.
  `),
  // The octave leap up on "me".
  missingIndex: 1,
}
