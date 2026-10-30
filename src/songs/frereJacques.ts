import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Traditional French round (18th century). Public domain.
export const frereJacques: Song = {
  id: 'frere-jacques',
  title: 'Frère Jacques',
  genre: 'Folk and kids',
  difficulty: 'Easy',
  bpm: 104,
  beatsPerBar: 4,
  melody: parseMelody(`
    C4/q D4/q E4/q C4/q | C4/q D4/q E4/q C4/q | E4/q F4/q G4/h | E4/q F4/q G4/h
  `),
  // The long G on "dormez".
  missingIndex: 10,
  source: {
    url: 'https://abcnotation.com/tunePage?a=sniff.numachi.com/~rickheit/dtrad/abc_dtrad.tar.gz/abc_dtrad/FRERJACQ/0000',
    notes: 'First four bars, an octave lower.',
    midi: { file: 'frere-jacques.mid', track: 0 },
  },
}
