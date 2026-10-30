import { parseMelody } from '../music/notation'
import type { Song } from './types'

// "O Come, All Ye Faithful" ("Adeste Fideles"), John Francis Wade's tune (c. 1750). Public domain.
export const oComeAllYeFaithful: Song = {
  id: 'o-come-all-ye-faithful',
  title: 'O Come, All Ye Faithful',
  genre: 'Holiday',
  difficulty: 'Easy',
  bpm: 100,
  beatsPerBar: 4,
  pickupBeats: 1,
  melody: parseMelody(`
    G4/q | G4/h D4/q G4/q | A4/h D4/h | B4/q A4/q B4/q C5/q | B4/h A4/q G4/q
  `),
  // The C at the top of "joyful and triumphant".
  missingIndex: 9,
  source: {
    url: 'https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/England/xmas/OComeAllYeFaithful_G/0000',
    credit: "John Chambers' ABC collection, via abcnotation.com",
    notes: 'Pickup and bars 1-4, unchanged (G major).',
    midi: { file: 'o-come-all-ye-faithful.mid', track: 1 },
  },
}
