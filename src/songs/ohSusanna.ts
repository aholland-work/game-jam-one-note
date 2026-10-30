import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Stephen Foster, "Oh! Susanna" (1848). Public domain.
export const ohSusanna: Song = {
  id: 'oh-susanna',
  title: 'Oh! Susanna',
  genre: 'Americana',
  difficulty: 'Medium',
  bpm: 108,
  beatsPerBar: 4,
  pickupBeats: 1,
  melody: parseMelody(`
    G4/e A4/e | B4/q D5/q D5/q. E5/e | D5/q B4/q G4/q. A4/e | B4/q B4/q A4/q G4/q | A4/w
  `),
  // The high E, the top of the first phrase.
  missingIndex: 6,
  source: {
    url: 'https://abcnotation.com/tunePage?a=sniff.numachi.com/~rickheit/dtrad/abc_dtrad.tar.gz/abc_dtrad/OSUSANNA/0000',
    notes: 'Pickup and bars 1-4, unchanged (G major). The last A is held to end the excerpt.',
    midi: { file: 'oh-susanna.mid', track: 0 },
  },
}
