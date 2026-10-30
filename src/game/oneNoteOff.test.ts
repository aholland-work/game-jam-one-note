import { describe, expect, it } from 'vitest'
import { songs } from '../songs'
import { melodyPitchClasses, pickChange, withChange } from './oneNoteOff'

// A small seeded generator (mulberry32) so every run checks the same spread of picks.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe.each(songs)('One Note Off: $title', (song) => {
  const changes = Array.from({ length: 200 }, (_, i) => pickChange(song, { difficulty: 'hard' }, seeded(i + 1)))
  const anyPitch = Array.from({ length: 200 }, (_, i) => pickChange(song, { difficulty: 'easy' }, seeded(i + 1)))

  it('never changes a rest or a tie, and on Easy only notes long enough to hear', () => {
    for (const { index } of anyPitch) expect(song.melody[index].beats).toBeGreaterThanOrEqual(0.5)
    for (const { index } of [...changes, ...anyPitch]) {
      const note = song.melody[index]
      expect(note.midi).not.toBeNull()
      expect(note.tie).toBeFalsy()
      expect(song.melody[index - 1]?.tie).toBeFalsy()
    }
  })

  it('on Hard, moves the note to the next scale note above or below, away from its neighbors', () => {
    const inKey = melodyPitchClasses(song.melody)
    for (const { index, midi } of changes) {
      const original = song.melody[index].midi as number
      const distance = Math.abs(midi - original)
      expect(distance).toBeGreaterThanOrEqual(1)
      expect(distance).toBeLessThanOrEqual(2)
      expect(inKey.has(midi % 12)).toBe(true)
      // Nothing in key sits between the original and the new pitch.
      if (distance === 2) expect(inKey.has(((original + midi) / 2) % 12)).toBe(false)
      expect(midi).not.toBe(song.melody[index - 1]?.midi)
      expect(midi).not.toBe(song.melody[index + 1]?.midi)
    }
  })

  it('on Easy, moves the note 1 to 3 half steps up or down', () => {
    for (const { index, midi } of anyPitch) {
      const distance = Math.abs(midi - (song.melody[index].midi as number))
      expect(distance).toBeGreaterThanOrEqual(1)
      expect(distance).toBeLessThanOrEqual(3)
      expect(midi).not.toBe(song.melody[index - 1]?.midi)
      expect(midi).not.toBe(song.melody[index + 1]?.midi)
    }
  })

  it('varies which note gets changed', () => {
    expect(new Set(changes.map((change) => change.index)).size).toBeGreaterThan(1)
  })

  it('changes exactly one note', () => {
    const changed = withChange(song.melody, changes[0])
    const differences = changed.filter((note, i) => note.midi !== song.melody[i].midi)
    expect(differences).toHaveLength(1)
  })
})
