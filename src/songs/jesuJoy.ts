import { parseMelody } from '../music/notation'
import type { Song } from './types'

// J. S. Bach, "Jesu, Joy of Man's Desiring" from Cantata BWV 147 (1723). Public domain.
export const jesuJoy: Song = {
  id: 'jesu-joy',
  title: "Jesu, Joy of Man's Desiring",
  genre: 'Classical',
  difficulty: 'Hard',
  bpm: 72,
  beatsPerBar: 3,
  melody: parseMelody(`
    r/e3 G4/e3 A4/e3 B4/e3 D5/e3 C5/e3 C5/e3 E5/e3 D5/e3 |
    D5/e3 G5/e3 F#5/e3 G5/e3 D5/e3 B4/e3 G4/e3 A4/e3 B4/e3 |
    C5/e3 D5/e3 E5/e3 D5/e3 C5/e3 B4/e3 A4/e3 B4/e3 G4/e3 |
    F#4/e3 G4/e3 A4/e3 D4/h
  `),
  // The high G at the top of the second bar.
  missingIndex: 10,
  source: {
    url: 'https://abcnotation.com/tunePage?a=gitlab.com/chrisspen/abc-music/abc-music-master.zip/abc-music-master/general/jesu-joy-of-mans-desiring/0000',
    notes: 'Bars 1-4 of the triplet melody, unchanged (G major). The low D is held to end the excerpt.',
    midi: { file: 'jesu-joy.mid', track: 1 },
  },
}
