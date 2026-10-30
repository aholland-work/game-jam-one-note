import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Brahms, "Wiegenlied" Op. 49 No. 4 (1868). Public domain.
export const brahmsLullaby: Song = {
  id: 'brahms-lullaby',
  title: "Brahms' Lullaby",
  genre: 'Classical',
  difficulty: 'Easy',
  bpm: 84,
  beatsPerBar: 3,
  pickupBeats: 1,
  melody: parseMelody(`
    E4/e E4/e | G4/q. E4/e E4/q | G4/h E4/e G4/e | C5/q B4/q. A4/e | A4/q G4/h
  `),
  // The high C at the top of the second phrase.
  missingIndex: 8,
  source: {
    url: 'https://www.mutopiaproject.org/ftp/BrahmsJ/LullabyBrahms-C/LullabyBrahms-C.ly',
    notes: 'Melody, pickup and bars 1-4, in C as in the source. The last G is held to end the excerpt; in the source the next phrase starts on its last beat.',
    midi: { file: 'brahms-lullaby.mid', track: 1 },
  },
}
