import { midiToPitch, type Note } from '../music/notation'
import type { Song } from '../songs/types'

/** How many times a player can hear the melody with their chosen note in the gap, when "Try it" is on. */
export const MAX_TRIES = 3

/** The melody as the player first hears it: the missing note becomes silence. */
export function withGap(melody: Note[], missingIndex: number): Note[] {
  return melody.map((note, i) => (i === missingIndex ? { ...note, midi: null, pitch: null } : note))
}

/** The melody with the player's chosen note dropped into the gap. */
export function withGuess(melody: Note[], missingIndex: number, guessMidi: number): Note[] {
  return melody.map((note, i) =>
    i === missingIndex ? { ...note, midi: guessMidi, pitch: midiToPitch(guessMidi) } : note,
  )
}

export function answerMidi(song: Song): number {
  const midi = song.melody[song.missingIndex].midi
  if (midi === null) throw new Error(`${song.id}: the missing note is a rest`)
  return midi
}

/** The lowest key of the one-octave piano: the C at or below the answer. */
export function pianoStartMidi(song: Song): number {
  const answer = answerMidi(song)
  return answer - (answer % 12)
}
