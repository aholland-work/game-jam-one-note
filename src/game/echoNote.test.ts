import { expect, it } from 'vitest'
import { REFERENCE_MIDI, ROUND_LENGTH, pickEchoNotes } from './echoNote'

it('picks a round of notes within the octave above the reference, never repeating back to back', () => {
  for (let run = 0; run < 200; run++) {
    const notes = pickEchoNotes()
    expect(notes).toHaveLength(ROUND_LENGTH)
    notes.forEach((midi, i) => {
      expect(midi).toBeGreaterThan(REFERENCE_MIDI)
      expect(midi).toBeLessThanOrEqual(REFERENCE_MIDI + 11)
      if (i > 0) expect(midi).not.toBe(notes[i - 1])
    })
  }
})

it('uses every note in the octave over many rounds', () => {
  const seen = new Set(Array.from({ length: 300 }, () => pickEchoNotes()).flat())
  expect(seen.size).toBe(11)
})
