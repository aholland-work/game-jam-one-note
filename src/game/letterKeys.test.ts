import { describe, expect, it } from 'vitest'
import { letterKeySemitone, type LetterKeyPress } from './letterKeys'

const press = (key: string, changes: Partial<LetterKeyPress> = {}): LetterKeyPress => ({
  key,
  repeat: false,
  modified: false,
  typing: false,
  inPiano: false,
  ...changes,
})

describe('letterKeySemitone', () => {
  it('plays letters from anywhere on the page by default', () => {
    expect(letterKeySemitone(press('a'), true)).toBe(0)
    expect(letterKeySemitone(press('W'), true)).toBe(1)
    expect(letterKeySemitone(press('j'), true)).toBe(11)
    expect(letterKeySemitone(press('k'), true)).toBeNull()
  })

  it('plays letters only on the piano when turned off', () => {
    expect(letterKeySemitone(press('a'), false)).toBeNull()
    expect(letterKeySemitone(press('a', { inPiano: true }), false)).toBe(0)
  })

  it('leaves typing, held keys and browser shortcuts alone', () => {
    expect(letterKeySemitone(press('a', { typing: true }), true)).toBeNull()
    expect(letterKeySemitone(press('a', { repeat: true }), true)).toBeNull()
    expect(letterKeySemitone(press('s', { modified: true, inPiano: true }), true)).toBeNull()
  })
})
