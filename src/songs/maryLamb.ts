import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Traditional American nursery song (1830). Public domain.
export const maryLamb: Song = {
  id: 'mary-had-a-little-lamb',
  title: 'Mary Had a Little Lamb',
  genre: 'Folk songs',
  difficulty: 'Easy',
  bpm: 112,
  beatsPerBar: 4,
  melody: parseMelody(`
    E4/q D4/q C4/q D4/q | E4/q E4/q E4/h | D4/q D4/q D4/h | E4/q G4/q G4/h
  `),
  // The jump up on "lamb".
  missingIndex: 11,
  source: {
    url: 'https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/demo/Tunes/MaryHadALittleLamb/0000',
    notes: 'First four bars, an octave lower and written in 4/4 at double the note values of the 2/4 source.',
    midi: { file: 'mary-had-a-little-lamb.mid', track: 1 },
  },
}
