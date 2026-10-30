import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Johann Strauss II, "The Blue Danube" waltz, Op. 314 (1866), main theme. Public domain.
export const blueDanube: Song = {
  id: 'blue-danube',
  title: 'The Blue Danube',
  genre: 'Classical',
  difficulty: 'Easy',
  bpm: 150,
  beatsPerBar: 3,
  pickupBeats: 1,
  melody: parseMelody(`
    C4/q | C4/q E4/q G4/q | G4/h G5/q | G5/h E5/q | E5/h.
  `),
  // The E on the way up the opening chord.
  missingIndex: 2,
  source: {
    url: 'https://www.mutopiaproject.org/ftp/StraussJJ/O314/blue_danube/blue_danube.ly',
    credit: "Mutopia Project, typeset by Nikos Kouremenos (CC BY-SA 4.0)",
    notes: 'Melody, pickup and bars 1-4, in C as in the source. The last E is held to end the excerpt.',
    midi: { file: 'blue-danube.mid', track: 1 },
  },
}
