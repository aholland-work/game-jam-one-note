/** The key every mystery note is heard in: a C major chord, then the note. */
export const REFERENCE_MIDI = 60
export const KEY_CHORD = [60, 64, 67]
/** How many mystery notes make up a round (endless practice has no limit). */
export const ROUND_LENGTH = 5

export type EchoLevel = 'triad' | 'scale' | 'all'
export type EchoLength = 'round' | 'endless'

/** Levels add notes as the player improves: the chord's own notes, the scale, then every note. */
export const ECHO_LEVELS: { id: EchoLevel; label: string; notes: number[] }[] = [
  { id: 'triad', label: 'C, E and G', notes: [60, 64, 67] },
  { id: 'scale', label: 'The C major scale', notes: [60, 62, 64, 65, 67, 69, 71] },
  { id: 'all', label: 'All 12 notes', notes: Array.from({ length: 12 }, (_, i) => 60 + i) },
]

export const notesForLevel = (level: EchoLevel) =>
  (ECHO_LEVELS.find((option) => option.id === level) ?? ECHO_LEVELS[0]).notes

export const nextLevel = (level: EchoLevel): EchoLevel | null => {
  const index = ECHO_LEVELS.findIndex((option) => option.id === level)
  return ECHO_LEVELS[index + 1]?.id ?? null
}

const INTERVALS = [
  'the same note as C',
  'a minor second above C',
  'a major second above C',
  'a minor third above C',
  'a major third above C',
  'a perfect fourth above C',
  'a tritone above C',
  'a perfect fifth above C',
  'a minor sixth above C',
  'a major sixth above C',
  'a minor seventh above C',
  'a major seventh above C',
]

/** How a note relates to the reference C, e.g. 64 -> "a major third above C". */
export const intervalFromC = (midi: number) => INTERVALS[(midi - REFERENCE_MIDI + 120) % 12]

/**
 * Picks the next mystery note from the level's notes, never the same as the previous one.
 * Notes the player has missed come up more often: each miss adds two extra chances.
 */
export function pickEchoNote(
  notes: number[],
  previous: number | null,
  misses: Partial<Record<number, number>> = {},
  random: () => number = Math.random,
): number {
  const choices = notes.filter((midi) => midi !== previous)
  const weights = choices.map((midi) => 1 + 2 * (misses[midi] ?? 0))
  let pick = random() * weights.reduce((sum, weight) => sum + weight, 0)
  for (let i = 0; i < choices.length; i++) {
    pick -= weights[i]
    if (pick < 0) return choices[i]
  }
  return choices[choices.length - 1]
}
