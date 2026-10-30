import { describe, expect, it } from 'vitest'
import { answerMidi, pianoStartMidi } from '../game/puzzle'
import { songs } from '.'

// Every song entry has to be a fair, playable puzzle that fits on one line of staff.
describe.each(songs)('$title', (song) => {
  const totalBeats = song.melody.reduce((sum, note) => sum + note.beats, 0)
  const pickup = song.pickupBeats ?? 0

  it('fills whole bars after the pickup', () => {
    expect(pickup).toBeLessThan(song.beatsPerBar)
    const bars = (totalBeats - pickup) / song.beatsPerBar
    expect(bars).toBeCloseTo(Math.round(bars), 6)
  })

  it('fits on one line of staff', () => {
    expect((totalBeats - pickup) / song.beatsPerBar).toBeLessThanOrEqual(6)
    expect(song.melody.length).toBeLessThanOrEqual(32)
  })

  it('misses a real note that is not part of a tie', () => {
    const missing = song.melody[song.missingIndex]
    expect(missing, 'missingIndex is out of range').toBeDefined()
    expect(missing.midi, 'the missing note is a rest').not.toBeNull()
    expect(missing.tie, 'the missing note is tied to the next note').toBeFalsy()
    expect(song.melody[song.missingIndex - 1]?.tie, 'the missing note is tied from the previous note').toBeFalsy()
  })

  it('puts the answer on the piano', () => {
    const start = pianoStartMidi(song)
    expect(start % 12).toBe(0)
    expect(answerMidi(song) - start).toBeGreaterThanOrEqual(0)
    expect(answerMidi(song) - start).toBeLessThan(12)
  })

  it('only ties notes of the same pitch', () => {
    song.melody.forEach((note, i) => {
      if (note.tie) expect(song.melody[i + 1]?.midi).toBe(note.midi)
    })
  })

  it('stays in a range the staff and synth handle (A3 to E6)', () => {
    for (const note of song.melody) {
      if (note.midi === null) continue
      expect(note.midi).toBeGreaterThanOrEqual(57)
      expect(note.midi).toBeLessThanOrEqual(88)
    }
  })

  it('names the transcription it was checked against', () => {
    expect(song.source.url).toMatch(/^https:\/\//)
    expect(song.source.notes.length).toBeGreaterThan(0)
  })

  it('has a sensible tempo', () => {
    expect(song.bpm).toBeGreaterThanOrEqual(40)
    expect(song.bpm).toBeLessThanOrEqual(240)
  })
})

it('gives every song a unique id', () => {
  const ids = songs.map((song) => song.id)
  expect(new Set(ids).size).toBe(ids.length)
})
