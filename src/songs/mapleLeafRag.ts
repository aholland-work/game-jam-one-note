import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Scott Joplin, "Maple Leaf Rag" (1899), opening of the A strain. Public domain.
export const mapleLeafRag: Song = {
  id: 'maple-leaf-rag',
  title: 'Maple Leaf Rag',
  genre: 'Ragtime',
  difficulty: 'Medium',
  bpm: 76,
  beatsPerBar: 2,
  melody: parseMelody(`
    Ab4/s Eb5/s Ab4/s C5/s Eb5/e G4/s Eb5/s | G4/s Bb4/s Eb5/q. |
    Ab4/s Eb5/s Ab4/s C5/s Eb5/e G4/s Eb5/s | G4/s Bb4/s Eb5/q Eb5/e
  `),
  // The B♭ in the first quick turn.
  missingIndex: 8,
  source: {
    url: 'https://www.mutopiaproject.org/ftp/JoplinS/maple/maple.ly',
    notes: 'Top line of the right hand, A strain bars 1-4, unchanged (A♭ major).',
    midi: { file: 'maple-leaf-rag.mid', track: 1 },
  },
}
