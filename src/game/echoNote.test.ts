import { describe, expect, it } from 'vitest'
import {
  C_MAJOR,
  ECHO_KEYS,
  ECHO_LEVELS,
  degreeName,
  describeNote,
  keyName,
  nextLevel,
  MAX_REPEATS,
  pickEchoNote,
  pickKey,
  scheduleReview,
  stepsForLevel,
} from './echoNote'

describe('pickEchoNote', () => {
  it.each(ECHO_LEVELS)('picks notes from $label, repeating at most twice in a row', ({ steps }) => {
    const recent: number[] = []
    let backToBack = 0
    for (let i = 0; i < 600; i++) {
      const { step } = pickEchoNote(steps, recent)
      expect(steps).toContain(step)
      expect(recent.slice(-MAX_REPEATS).every((previous) => previous === step) && recent.length >= MAX_REPEATS).toBe(false)
      if (step === recent.at(-1)) backToBack++
      recent.push(step)
    }
    // Repeats happen, so the last answer never rules a note out.
    expect(backToBack).toBeGreaterThan(20)
  })

  it('brings a missed note back 2 to 4 questions later', () => {
    for (const roll of [0, 0.5, 0.99]) {
      const reviews = scheduleReview([], 5, 3, () => roll)
      const due = reviews[0].due
      expect(due - 3).toBeGreaterThanOrEqual(2)
      expect(due - 3).toBeLessThanOrEqual(4)
      // Not before it's due (a random pick could still land on it, which gives nothing away).
      expect(pickEchoNote([0, 2, 4, 5], [0, 2, 4, 0], reviews, due - 1, () => 0).reviews).toHaveLength(1)
      const picked = pickEchoNote([0, 2, 4, 5], [0, 2, 4, 0], reviews, due, () => 0)
      expect(picked.step).toBe(5)
      expect(picked.reviews).toHaveLength(0)
    }
  })

  it('waits with a due review rather than repeat a note a third time', () => {
    const picked = pickEchoNote([0, 4, 7], [4, 4], [{ step: 4, due: 2 }], 2, () => 0)
    expect(picked.step).toBe(0)
    expect(picked.reviews).toEqual([{ step: 4, due: 2 }])
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
