import { parseMelody } from '../music/notation'
import type { Song } from './types'

// "Oh My Darling, Clementine", American folk ballad (1884). Public domain.
export const clementine: Song = {
  id: 'clementine',
  title: 'Oh My Darling, Clementine',
  genre: 'Americana',
  difficulty: 'Medium',
  bpm: 100,
  beatsPerBar: 3,
  melody: parseMelody(`
    D4/e. D4/s D4/q A3/q | F#4/e. F#4/s F#4/q D4/q | D4/e. F#4/s A4/q. A4/e | G4/e F#4/e E4/h
  `),
  // The low A that dips at the end of the first bar.
  missingIndex: 3,
  source: {
    url: 'https://abcnotation.com/tunePage?a=sniff.numachi.com/~rickheit/dtrad/abc_dtrad.tar.gz/abc_dtrad/CLEMENTI/0000',
    credit: "The Digital Tradition folk song collection, via abcnotation.com",
    notes: 'First four bars, unchanged (D major).',
    midi: { file: 'clementine.mid', track: 0 },
  },
}
