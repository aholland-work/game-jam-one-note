import { parseMelody } from '../music/notation'
import type { Song } from './types'

// "Hark! The Herald Angels Sing", Felix Mendelssohn's tune (1840). Public domain.
export const harkTheHerald: Song = {
  id: 'hark-the-herald',
  title: 'Hark! The Herald Angels Sing',
  genre: 'Holiday',
  difficulty: 'Easy',
  bpm: 100,
  beatsPerBar: 4,
  melody: parseMelody(`
    D4/q G4/q G4/q. F#4/e | G4/q B4/q B4/q A4/q | D5/q D5/q D5/q. C5/e | B4/q A4/q B4/h
  `),
  // The high D on "Glory".
  missingIndex: 8,
  source: {
    url: 'https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/mirror/LesterBailey/Hark_The_Herald_Angels_Sing/0000',
    notes: 'Bars 1-4, unchanged (G major).',
    midi: { file: 'hark-the-herald.mid', track: 0 },
  },
}
