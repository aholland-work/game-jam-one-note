import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Franz Xaver Gruber, "Stille Nacht" / "Silent Night" (1818). Public domain.
export const silentNight: Song = {
  id: 'silent-night',
  title: 'Silent Night',
  genre: 'Holiday',
  difficulty: 'Medium',
  bpm: 84,
  beatsPerBar: 3,
  compound: true,
  melody: parseMelody(`
    D5/e. E5/s D5/e B4/q. | D5/e. E5/s D5/e B4/q. | A5/q A5/e F#5/q. | G5/q G5/e D5/q.
  `),
  // The high A on "All is calm".
  missingIndex: 8,
  source: {
    url: 'https://www.mutopiaproject.org/ftp/GruberFX/stille-nacht/stille-nacht.ly',
    notes: 'Bars 1-4, unchanged (G major, 6/8), written at half the source note values.',
    midi: { file: 'silent-night.mid', track: 1 },
  },
}
