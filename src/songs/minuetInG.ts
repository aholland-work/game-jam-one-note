import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Minuet in G, BWV Anh. 114, from the 1725 Notebook for Anna Magdalena Bach (now credited
// to Christian Petzold). Public domain.
export const minuetInG: Song = {
  id: 'minuet-in-g',
  title: 'Minuet in G',
  genre: 'Classical',
  difficulty: 'Medium',
  bpm: 120,
  beatsPerBar: 3,
  melody: parseMelody(`
    D5/q G4/e A4/e B4/e C5/e | D5/q G4/q G4/q | E5/q C5/e D5/e E5/e F#5/e | G5/q G4/q G4/q
  `),
  // The F♯ just before the run reaches the top G.
  missingIndex: 12,
  source: {
    url: 'https://www.mutopiaproject.org/ftp/BachJS/BWVAnh114/anna-magdalena-04/anna-magdalena-04.ly',
    notes: 'Right hand, bars 1-4, unchanged (G major).',
    midi: { file: 'minuet-in-g.mid', track: 1 },
  },
}
