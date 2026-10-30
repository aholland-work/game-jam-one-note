import { describe, expect, it } from 'vitest'
import {
  C_MAJOR,
  ECHO_KEYS,
  ECHO_LEVELS,
  degreeName,
  describeNote,
  keyName,
  nextLevel,
  pickEchoNote,
  pickKey,
  stepsForLevel,
} from './echoNote'

describe('pickEchoNote', () => {
  it.each(ECHO_LEVELS)('only picks notes from $label, never the previous one again', ({ steps }) => {
    let previous: number | null = null
    for (let i = 0; i < 300; i++) {
      const step = pickEchoNote(steps, previous)
      expect(steps).toContain(step)
      expect(step).not.toBe(previous)
      previous = step
    }
  })

  it('brings missed notes back more often', () => {
    const steps = stepsForLevel('scale')
    const counts = new Map<number, number>()
    for (let i = 0; i < 4000; i++) {
      const step = pickEchoNote(steps, null, { 5: 3 })
      counts.set(step, (counts.get(step) ?? 0) + 1)
    }
    // The 4 (5 half steps up) has weight 7 against 1 for each other note: about half of all picks.
    expect(counts.get(5)! / 4000).toBeGreaterThan(0.4)
    expect(counts.get(2)! / 4000).toBeLessThan(0.15)
  })
})

describe('keys', () => {
  it('never picks the same key twice in a row', () => {
    let previous = C_MAJOR
    for (let i = 0; i < 200; i++) {
      const key = pickKey(previous)
      expect(ECHO_KEYS).toContain(key)
      expect(key.tonic).not.toBe(previous.tonic)
      previous = key
    }
  })

  it('spells each key with sharps or flats to match', () => {
    expect(ECHO_KEYS.map(keyName)).toEqual([
      'C major',
      'D♭ major',
      'D major',
      'E♭ major',
      'E major',
      'F major',
      'G major',
      'A♭ major',
      'A major',
      'B♭ major',
      'B major',
    ])
  })
})

it('names notes by their number in the key', () => {
  expect(degreeName(0)).toBe('1')
  expect(degreeName(4)).toBe('3')
  expect(degreeName(10)).toBe('♭7')
  expect(describeNote(C_MAJOR, 4)).toBe('E, the 3 of C major')
  expect(describeNote({ tonic: 69, flats: false }, 4)).toBe('C♯, the 3 of A major')
  expect(describeNote({ tonic: 70, flats: true }, 7)).toBe('F, the 5 of B♭ major')
  expect(describeNote({ tonic: 63, flats: true }, 3)).toBe('G♭, the ♭3 of E♭ major')
})

it('levels go from the chord notes, to the scale, to every note', () => {
  expect(stepsForLevel('triad')).toEqual([0, 4, 7])
  expect(stepsForLevel('scale')).toHaveLength(7)
  expect(stepsForLevel('all')).toHaveLength(12)
  expect(nextLevel('triad')).toBe('scale')
  expect(nextLevel('all')).toBeNull()
})
