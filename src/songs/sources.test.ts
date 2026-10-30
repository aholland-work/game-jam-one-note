/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseMidi } from '../music/midi'
import { songs } from '.'
import { closestMismatch, findInSource, soundingNotes, topLine } from './sourceMatch'

// Each song's melody must appear, note for note, in a MIDI rendering of the public-domain
// source it names (allowing one key change and one tempo scale).
describe.each(songs)('$title matches its source', (song) => {
  it(`is found in song-sources/${song.source.midi.file}`, () => {
    const file = new URL(`../../song-sources/${song.source.midi.file}`, import.meta.url)
    const source = topLine(parseMidi(new Uint8Array(readFileSync(file))), song.source.midi.track)
    const melody = soundingNotes(song.melody)
    const match = findInSource(melody, source)
    if (!match) {
      const { matchedNotes } = closestMismatch(melody, source)
      expect.fail(`No match in the source; the closest start agrees for ${matchedNotes} of ${melody.length} notes`)
    }
    expect(match).not.toBeNull()
  })
})
