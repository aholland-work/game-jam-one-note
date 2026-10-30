import { parseMelody } from '../music/notation'
import type { Song } from './types'

// "Good King Wenceslas", words by John Mason Neale (1853) to the tune "Tempus adest floridum"
// (1582). Public domain.
export const goodKingWenceslas: Song = {
  id: 'good-king-wenceslas',
  title: 'Good King Wenceslas',
  genre: 'Holiday',
  difficulty: 'Easy',
  bpm: 112,
  beatsPerBar: 4,
  melody: parseMelody(`
    F4/q F4/q F4/q G4/q | F4/q F4/q C4/h | D4/q C4/q D4/q E4/q | F4/h F4/h
  `),
  // The one step up, on "King".
  missingIndex: 3,
  source: {
    url: 'https://abcnotation.com/tunePage?a=sniff.numachi.com/~rickheit/dtrad/abc_dtrad.tar.gz/abc_dtrad/GOODKING/0000',
    credit: "The Digital Tradition folk song collection, via abcnotation.com",
    notes: 'First four bars, unchanged (F major).',
    midi: { file: 'good-king-wenceslas.mid', track: 0 },
  },
}
