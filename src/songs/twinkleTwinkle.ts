import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Traditional French melody (1761), English words 1806. Public domain.
export const twinkleTwinkle: Song = {
  id: 'twinkle-twinkle',
  title: 'Twinkle, Twinkle, Little Star',
  genre: 'Folk and kids',
  difficulty: 'Easy',
  bpm: 100,
  beatsPerBar: 4,
  melody: parseMelody(`
    C4/q C4/q G4/q G4/q | A4/q A4/q G4/h | F4/q F4/q E4/q E4/q | D4/q D4/q C4/h
  `),
  // The jump up on the second "twin-".
  missingIndex: 2,
  source: {
    url: 'https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/demo/Tunes/AhVousDiraiJeMaman/0000',
    notes: "First four bars, unchanged (Musica Viva ABC transcription of \"Ah! vous dirai-je, maman\").",
    midi: { file: 'twinkle-twinkle.mid', track: 0 },
  },
}
