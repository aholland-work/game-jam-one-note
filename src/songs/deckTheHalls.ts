import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Traditional Welsh carol "Nos Galan" (18th century). Public domain.
export const deckTheHalls: Song = {
  id: 'deck-the-halls',
  title: 'Deck the Halls',
  genre: 'Holiday',
  difficulty: 'Medium',
  bpm: 116,
  beatsPerBar: 4,
  melody: parseMelody(`
    A4/q. G4/e F#4/q E4/q | D4/q E4/q F#4/q D4/q | E4/e F#4/e G4/e E4/e F#4/q. E4/e | D4/q C#4/q D4/h
  `),
  // The C♯ just before the phrase lands on D.
  missingIndex: 15,
  source: {
    url: 'https://abcnotation.com/tunePage?a=pghardy.net/tunebooks/pgh_xmas_tunebook/0014',
    notes: 'First four bars, unchanged (D major).',
    midi: { file: 'deck-the-halls.mid', track: 1 },
  },
}
