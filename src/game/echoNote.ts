/** The note played first every time, so players judge the mystery note against it. */
export const REFERENCE_MIDI = 60
/** How many mystery notes make up a round. */
export const ROUND_LENGTH = 5

/**
 * Picks the mystery notes for a round: notes from the C♯ to the B above the reference C,
 * never the same note twice in a row, so each one is a fresh listen.
 */
export function pickEchoNotes(count = ROUND_LENGTH, random: () => number = Math.random): number[] {
  const notes: number[] = []
  while (notes.length < count) {
    const midi = REFERENCE_MIDI + 1 + Math.floor(random() * 11)
    if (midi !== notes[notes.length - 1]) notes.push(midi)
  }
  return notes
}
