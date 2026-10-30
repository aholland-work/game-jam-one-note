import { describe, expect, it } from 'vitest'
import { ECHO_LEVELS, intervalFromC, nextLevel, notesForLevel, pickEchoNote } from './echoNote'

describe('pickEchoNote', () => {
  it.each(ECHO_LEVELS)('only picks notes from $label, never the previous one again', ({ notes }) => {
    let previous: number | null = null
    for (let i = 0; i < 300; i++) {
      const midi = pickEchoNote(notes, previous)
      expect(notes).toContain(midi)
      expect(midi).not.toBe(previous)
      previous = midi
    }
  })

  it('brings missed notes back more often', () => {
    const notes = notesForLevel('scale')
    const counts = new Map<number, number>()
    for (let i = 0; i < 4000; i++) {
      const midi = pickEchoNote(notes, null, { 65: 3 })
      counts.set(midi, (counts.get(midi) ?? 0) + 1)
    }
    // F (65) has weight 7 against 1 for each other note: about half of all picks.
    expect(counts.get(65)! / 4000).toBeGreaterThan(0.4)
    expect(counts.get(62)! / 4000).toBeLessThan(0.15)
  })
})

it('names intervals from the reference C', () => {
  expect(intervalFromC(60)).toBe('the same note as C')
  expect(intervalFromC(64)).toBe('a major third above C')
  expect(intervalFromC(67)).toBe('a perfect fifth above C')
  expect(intervalFromC(71)).toBe('a major seventh above C')
})

it('levels go from the chord notes, to the scale, to every note', () => {
  expect(notesForLevel('triad')).toEqual([60, 64, 67])
  expect(notesForLevel('scale')).toHaveLength(7)
  expect(notesForLevel('all')).toHaveLength(12)
  expect(nextLevel('triad')).toBe('scale')
  expect(nextLevel('all')).toBeNull()
})
