import { describe, expect, it } from 'vitest'
import { diatonicStep, midiToName, midiToPitch, parseDuration, parseMelody, pitchToMidi, usesFlats } from './notation'

describe('pitchToMidi', () => {
  it('reads naturals, sharps and flats', () => {
    expect(pitchToMidi('C4')).toBe(60)
    expect(pitchToMidi('A4')).toBe(69)
    expect(pitchToMidi('D#5')).toBe(75)
    expect(pitchToMidi('Bb3')).toBe(58)
    expect(pitchToMidi('E#4')).toBe(pitchToMidi('F4'))
  })

  it('rejects nonsense', () => {
    expect(() => pitchToMidi('H2')).toThrow()
  })
})

it('spells MIDI numbers with sharps, or flats when asked', () => {
  expect(midiToPitch(60)).toBe('C4')
  expect(midiToPitch(63)).toBe('D#4')
  expect(midiToPitch(63, true)).toBe('Eb4')
  expect(midiToName(70)).toBe('A\u266F')
  expect(midiToName(70, true)).toBe('B\u266D')
})

it('tells melodies written in flats from ones in sharps', () => {
  expect(usesFlats(parseMelody('Ab4/q Eb5/q'))).toBe(true)
  expect(usesFlats(parseMelody('F#4/q B4/q'))).toBe(false)
})

it('counts staff steps by letter, ignoring accidentals', () => {
  expect(diatonicStep('E4')).toBe(30)
  expect(diatonicStep('B4')).toBe(34)
  expect(diatonicStep('C#4')).toBe(diatonicStep('C4'))
})

it('reads durations, including dotted ones', () => {
  expect(parseDuration('q')).toBe(1)
  expect(parseDuration('h.')).toBe(3)
  expect(parseDuration('s')).toBe(0.25)
  expect(() => parseDuration('x')).toThrow()
})

it('parses a melody with rests, ties and bar lines', () => {
  expect(parseMelody('C4/q r/e | D4/s~ D4/q')).toEqual([
    { midi: 60, pitch: 'C4', beats: 1 },
    { midi: null, pitch: null, beats: 0.5 },
    { midi: 62, pitch: 'D4', beats: 0.25, tie: true },
    { midi: 62, pitch: 'D4', beats: 1 },
  ])
})
