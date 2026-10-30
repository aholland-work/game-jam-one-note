import { parseMelody } from '../music/notation'
import type { Song } from './types'

// "Shenandoah", American folk song (early 19th century). Public domain.
export const shenandoah: Song = {
  id: 'shenandoah',
  title: 'Shenandoah',
  genre: 'Americana',
  difficulty: 'Medium',
  bpm: 80,
  beatsPerBar: 3,
  pickupBeats: 1,
  melody: parseMelody(`
    A3/q | D4/e. D4/s D4/q. E4/e | F#4/e G4/e A4/e F#4/q. | D5/q B4/q. A4/e | B4/e A4/e F#4/e A4/q.
  `),
  // The high D, the big leap on "long".
  missingIndex: 9,
  source: {
    url: 'https://abcnotation.com/tunePage?a=sniff.numachi.com/~rickheit/dtrad/abc_dtrad.tar.gz/abc_dtrad/SHENDOAH/0000',
    credit: "The Digital Tradition folk song collection, via abcnotation.com",
    notes: 'Pickup and bars 1-4, unchanged (D major).',
    midi: { file: 'shenandoah.mid', track: 0 },
  },
}
