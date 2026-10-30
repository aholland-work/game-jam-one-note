import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Felix Mendelssohn, Wedding March from "A Midsummer Night's Dream" (1842). Public domain.
export const weddingMarch: Song = {
  id: 'wedding-march',
  title: 'Wedding March',
  genre: 'Classical',
  difficulty: 'Easy',
  bpm: 100,
  beatsPerBar: 4,
  pickupBeats: 1,
  melody: parseMelody(`
    C4/e3 C4/e3 C4/e3 | C4/h. C4/e3 C4/e3 C4/e3 | C4/h. C4/e3 C4/e3 C4/e3 |
    E4/q E4/e3 E4/e3 E4/e3 E4/q E4/e3 E4/e3 E4/e3 | G4/q G4/e3 G4/e3 G4/e3 G4/h
  `),
  // The first E, where the fanfare starts to climb.
  missingIndex: 11,
  source: {
    url: 'https://www.mutopiaproject.org/ftp/Mendelssohn-BartholdyF/O61/Sommernachtstraum-wedding-march/Sommernachtstraum-wedding-march.ly',
    notes: 'The opening trumpet fanfare: pickup and bars 1-4, unchanged (C major). The last G is held to end the excerpt.',
    midi: { file: 'wedding-march.mid', track: 1 },
  },
}
