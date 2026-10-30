import { expect, it } from 'vitest'
import { foldIntoPiano, parseNoteOn } from './midi'

it('reads note-on messages on any channel and ignores the rest', () => {
  expect(parseNoteOn(new Uint8Array([0x90, 60, 100]))).toBe(60)
  expect(parseNoteOn(new Uint8Array([0x93, 67, 1]))).toBe(67)
  // Note-on with velocity 0 means the note was released.
  expect(parseNoteOn(new Uint8Array([0x90, 60, 0]))).toBeNull()
  expect(parseNoteOn(new Uint8Array([0x80, 60, 64]))).toBeNull()
  expect(parseNoteOn(new Uint8Array([0xb0, 7, 100]))).toBeNull()
})

it('folds any octave onto the piano', () => {
  expect(foldIntoPiano(60, 60, 1)).toBe(60)
  expect(foldIntoPiano(48, 60, 1)).toBe(60)
  expect(foldIntoPiano(79, 60, 1)).toBe(67)
  expect(foldIntoPiano(79, 60, 2)).toBe(79)
  expect(foldIntoPiano(91, 60, 2)).toBe(67)
  expect(foldIntoPiano(35, 60, 2)).toBe(83)
})
