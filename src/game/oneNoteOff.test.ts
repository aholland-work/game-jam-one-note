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
  const changes = Array.from({ length: 200 }, (_, i) => pickChange(song, seeded(i + 1)))

  it('only changes notes long enough to hear, and never a tie', () => {
    for (const { index } of changes) {
      const note = song.melody[index]
      expect(note.midi).not.toBeNull()
      expect(note.beats).toBeGreaterThanOrEqual(0.5)
      expect(note.tie).toBeFalsy()
      expect(song.melody[index - 1]?.tie).toBeFalsy()
    }
  })

  it('moves the note up to 4 half steps, to a note already in the melody, away from its neighbors', () => {
    const inKey = melodyPitchClasses(song.melody)
    for (const { index, midi } of changes) {
      const distance = Math.abs(midi - (song.melody[index].midi as number))
      expect(distance).toBeGreaterThanOrEqual(1)
      expect(distance).toBeLessThanOrEqual(4)
      expect(inKey.has(midi % 12)).toBe(true)
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
