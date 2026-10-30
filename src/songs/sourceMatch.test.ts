import { describe, expect, it } from 'vitest'
import { parseMidi } from '../music/midi'
import { parseMelody } from '../music/notation'
import { findInSource, soundingNotes, topLine } from './sourceMatch'

// A one-track MIDI file (96 ticks per quarter) with a track-name meta event, then
// C4 C4 G4 G4 as quarter notes. The repeated notes are struck before the earlier one is
// released, which some files do.
const bytes = new Uint8Array([
  ...[0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0, 96],
  ...[0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, 42],
  ...[0x00, 0xff, 0x03, 0x02, 0x41, 0x42], // track name "AB"
  ...[0x00, 0x90, 60, 100],
  ...[0x60, 0x90, 60, 100, 0x00, 0x80, 60, 0], // C again, then the first C ends
  ...[0x60, 0x80, 60, 0, 0x00, 0x90, 67, 100],
  ...[0x60, 0x90, 67, 100, 0x00, 0x80, 67, 0],
  ...[0x60, 0x80, 67, 0],
  ...[0x00, 0xff, 0x2f, 0x00],
])

describe('parseMidi', () => {
  it('reads notes after meta events and pairs repeated notes in order', () => {
    const midi = parseMidi(bytes)
    expect(midi.ticksPerQuarter).toBe(96)
    expect(midi.tracks[0].map(({ pitch, start, end }) => [pitch, start, end])).toEqual([
      [60, 0, 96],
      [60, 96, 192],
      [67, 192, 288],
      [67, 288, 384],
    ])
  })
})

describe('findInSource', () => {
  const source = topLine(parseMidi(bytes), 0)

  it('finds a melody after a key change', () => {
    expect(findInSource(soundingNotes(parseMelody('D4/q D4/q A4/q A4/q')), source)).toEqual({
      index: 0,
      transpose: 2,
      timeScale: 1,
    })
  })

  it('finds a melody written at double note values', () => {
    expect(findInSource(soundingNotes(parseMelody('C4/h C4/h G4/h')), source)?.timeScale).toBe(2)
  })

  it('rejects a wrong note', () => {
    expect(findInSource(soundingNotes(parseMelody('C4/q C4/q A4/q G4/q')), source)).toBeNull()
  })

  it('rejects a wrong rhythm', () => {
    expect(findInSource(soundingNotes(parseMelody('C4/q C4/h G4/q G4/q')), source)).toBeNull()
  })
})
