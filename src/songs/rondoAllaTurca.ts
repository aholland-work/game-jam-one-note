import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Mozart, Piano Sonata No. 11 K. 331 (1784), third movement "Rondo alla Turca". Public domain.
export const rondoAllaTurca: Song = {
  id: 'rondo-alla-turca',
  title: 'Rondo alla Turca',
  genre: 'Classical',
  difficulty: 'Medium',
  bpm: 112,
  beatsPerBar: 2,
  pickupBeats: 1,
  melody: parseMelody(`
    B4/s A4/s G#4/s A4/s | C5/q D5/s C5/s B4/s C5/s | E5/q F5/s E5/s D#5/s E5/s |
    B5/s A5/s G#5/s A5/s B5/s A5/s G#5/s A5/s | C6/q A5/e C6/e
  `),
  // The E each little turn climbs up to land on.
  missingIndex: 9,
  source: {
    url: 'https://www.mutopiaproject.org/ftp/MozartWA/KV331/KV331_3_RondoAllaTurca/KV331_3_RondoAllaTurca.ly',
    credit: "Mutopia Project, typeset by Rune Zedeler and Chris Sawer (public domain)",
    notes: 'Right hand, pickup and bars 1-4, unchanged (A minor).',
    midi: { file: 'rondo-alla-turca.mid', track: 1 },
  },
}
