import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Beethoven, Symphony No. 9 (1824), main theme transposed to C major. Public domain.
export const odeToJoy: Song = {
  id: 'ode-to-joy',
  title: 'Ode to Joy',
  genre: 'Classical',
  bpm: 112,
  beatsPerBar: 4,
  melody: parseMelody(`
    E4/q E4/q F4/q G4/q | G4/q F4/q E4/q D4/q | C4/q C4/q D4/q E4/q | E4/q. D4/e D4/h |
    E4/q E4/q F4/q G4/q | G4/q F4/q E4/q D4/q | C4/q C4/q D4/q E4/q | D4/q. C4/e C4/h
  `),
  // The G at the top of the opening phrase.
  missingIndex: 3,
}
