import { parseMelody } from '../music/notation'
import type { Song } from './types'

// Beethoven, Bagatelle No. 25 "Für Elise" (published 1867), opening right-hand melody in 3/8. Public domain.
export const furElise: Song = {
  id: 'fur-elise',
  title: 'Für Elise',
  genre: 'Classical',
  difficulty: 'Medium',
  bpm: 72,
  beatsPerBar: 1.5,
  pickupBeats: 0.5,
  melody: parseMelody(`
    E5/s D#5/s | E5/s D#5/s E5/s B4/s D5/s C5/s | A4/e r/s C4/s E4/s A4/s | B4/e r/s E4/s G#4/s B4/s | C5/q.
  `),
  // The black-key note in the famous opening wiggle.
  missingIndex: 1,
  source: {
    url: 'https://www.mutopiaproject.org/ftp/BeethovenLv/WoO59/fur_Elise_WoO59/fur_Elise_WoO59.ly',
    credit: "Mutopia Project, typeset by Stelios Samelis (public domain)",
    notes: "Right hand, pickup and bars 1-4 at the score's tempo (quarter = 72). The final C is held to end the excerpt; in the score it moves on.",
    midi: { file: 'fur-elise.mid', track: 1 },
  },
}
