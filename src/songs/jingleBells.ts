import { parseMelody } from '../music/notation'
import type { Song } from './types'

// James Lord Pierpont (1857), chorus in C major. Public domain.
export const jingleBells: Song = {
  id: 'jingle-bells',
  title: 'Jingle Bells',
  genre: 'Holiday',
  difficulty: 'Easy',
  bpm: 120,
  beatsPerBar: 4,
  melody: parseMelody(`
    E4/q E4/q E4/h | E4/q E4/q E4/h | E4/q G4/q C4/q. D4/e | E4/w
  `),
  // The low dip on "all" in "jingle all the way".
  missingIndex: 8,
  source: {
    url: 'https://abcnotation.com/tunePage?a=pghardy.net/tunebooks/pgh_xmas_tunebook/0034',
    credit: "Paul Hardy's Christmas Tunebook, via abcnotation.com",
    notes: "Chorus, bars 1-4, transposed from G to C and written in 4/4 at double the note values of the 2/4 source. Colin Hume's ABC transcription agrees.",
    midi: { file: 'jingle-bells.mid', track: 1 },
  },
}
