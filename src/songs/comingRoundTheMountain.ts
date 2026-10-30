import { parseMelody } from '../music/notation'
import type { Song } from './types'

// "She'll Be Coming 'Round the Mountain", American folk song (late 19th century). Public domain.
export const comingRoundTheMountain: Song = {
  id: 'coming-round-the-mountain',
  title: "She'll Be Coming 'Round the Mountain",
  genre: 'Americana',
  difficulty: 'Easy',
  bpm: 132,
  beatsPerBar: 4,
  pickupBeats: 2,
  melody: parseMelody(`
    G4/q A4/q | C5/q C5/q C5/q C5/q | A4/q G4/q G4/q A4/q | C5/w
  `),
  // The A that steps down after "mountain".
  missingIndex: 6,
  source: {
    url: 'https://abcnotation.com/tunePage?a=sniff.numachi.com/~rickheit/dtrad/abc_dtrad.tar.gz/abc_dtrad/COMRND2/0000',
    credit: "The Digital Tradition folk song collection, via abcnotation.com",
    notes: 'Pickup and bars 1-3, unchanged (C major). The last C is held to end the excerpt.',
    midi: { file: 'coming-round-the-mountain.mid', track: 0 },
  },
}
