import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Mozart, Serenade No. 13 "Eine kleine Nachtmusik" K. 525 (1787), first movement. Public domain.
export const eineKleine: Song = {
  id: 'eine-kleine-nachtmusik',
  title: 'Eine kleine Nachtmusik',
  genre: 'Classical',
  difficulty: 'Medium',
  bpm: 120,
  beatsPerBar: 4,
  melody: parseMelody(`
    G5/q r/e D5/e G5/q r/e D5/e | G5/e D5/e G5/e B5/e D6/h |
    C6/q r/e A5/e C6/q r/e A5/e | C6/e A5/e F#5/e A5/e D5/h
  `),
  // The high D at the top of the rising arpeggio.
  missingIndex: 10,
  source: {
    url: 'https://www.mutopiaproject.org/ftp/MozartWA/KV525/eine-kleine-nachtmusik-mvt1/eine-kleine-nachtmusik-mvt1.ly',
    notes: 'First violin, bars 1-4, unchanged (G major).',
    midi: { file: 'eine-kleine-nachtmusik.mid', track: 1 },
  },
}
