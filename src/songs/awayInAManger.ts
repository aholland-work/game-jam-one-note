import { parseMelody } from '../music/notation'
import type { Song } from './types'

// "Away in a Manger", William J. Kirkpatrick's tune "Cradle Song" (1895). Public domain.
export const awayInAManger: Song = {
  id: 'away-in-a-manger',
  title: 'Away in a Manger',
  genre: 'Holiday',
  difficulty: 'Easy',
  bpm: 100,
  beatsPerBar: 3,
  pickupBeats: 1,
  melody: parseMelody(`
    D4/q | G4/q G4/q A4/e B4/e | G4/q G4/q B4/e C5/e | D5/q D5/q E5/q | C5/h.
  `),
  // The high E at the top of the phrase.
  missingIndex: 11,
  source: {
    url: 'https://abcnotation.com/tunePage?a=pghardy.net/tunebooks/pgh_xmas_tunebook/0006',
    credit: "Paul Hardy's Christmas Tunebook, via abcnotation.com",
    notes: 'Pickup and bars 1-4, unchanged (G major). The last C is held to end the excerpt.',
    midi: { file: 'away-in-a-manger.mid', track: 1 },
  },
}
