import type { MidiFile } from '../music/midi'
import type { Note } from '../music/notation'

/** A note as it's heard: pitch and when it starts, in quarter-note beats. */
export interface SoundingNote {
  pitch: number
  onset: number
}

/** The melody as heard: rests dropped and tied notes merged into one. */
export function soundingNotes(melody: Note[]): SoundingNote[] {
  const sounding: SoundingNote[] = []
  let beat = 0
  melody.forEach((note, i) => {
    const tiedFromPrevious = i > 0 && melody[i - 1].tie && melody[i - 1].midi === note.midi
    if (note.midi !== null && !tiedFromPrevious) sounding.push({ pitch: note.midi, onset: beat })
    beat += note.beats
  })
  return sounding
}

/**
 * The top line of one MIDI track, which is where the tune usually is: at each moment a note
 * starts, the highest note sounding, kept only if it's the one starting then. That way an
 * inner voice moving under a held melody note isn't mistaken for the melody.
 */
export function topLine(midi: MidiFile, track: number): SoundingNote[] {
  const notes = midi.tracks[track] ?? []
  const starts = [...new Set(notes.map((note) => note.start))].sort((a, b) => a - b)
  const line: SoundingNote[] = []
  for (const start of starts) {
    let top: (typeof notes)[number] | undefined
    for (const note of notes) {
      if (note.start <= start && note.end > start && (!top || note.pitch > top.pitch)) top = note
    }
    if (top && top.start === start) line.push({ pitch: top.pitch, onset: start / midi.ticksPerQuarter })
  }
  return line
}

export interface SourceMatch {
  /** Where in the source the melody starts. */
  index: number
  /** Half steps added to the source to get our pitches (a key change or octave move). */
  transpose: number
  /** Our beats per source beat (2 when we write a 2/4 tune in 4/4 at double note values). */
  timeScale: number
}

const TIME_SCALES = [1, 2, 0.5]
const TOLERANCE = 0.02

/**
 * Looks for the melody inside the source, note for note: same pitches after one key
 * change, and the same rhythm after one tempo scale. Returns where it matched, or null.
 */
export function findInSource(melody: SoundingNote[], source: SoundingNote[]): SourceMatch | null {
  for (let index = 0; index + melody.length <= source.length; index++) {
    const transpose = melody[0].pitch - source[index].pitch
    for (const timeScale of TIME_SCALES) {
      const matches = melody.every((note, i) => {
        const from = source[index + i]
        const ours = note.onset - melody[0].onset
        const theirs = (from.onset - source[index].onset) * timeScale
        return from.pitch + transpose === note.pitch && Math.abs(ours - theirs) < TOLERANCE
      })
      if (matches) return { index, transpose, timeScale }
    }
  }
  return null
}

/**
 * When there's no exact match, the closest start in the source and the first note that
 * differs from it, to make a failed check easy to fix.
 */
export function closestMismatch(melody: SoundingNote[], source: SoundingNote[]) {
  let best = { index: 0, matched: -1 }
  for (let index = 0; index < source.length; index++) {
    const transpose = melody[0].pitch - source[index].pitch
    for (const timeScale of TIME_SCALES) {
      let matched = 0
      while (matched < melody.length && index + matched < source.length) {
        const from = source[index + matched]
        const ours = melody[matched].onset - melody[0].onset
        const theirs = (from.onset - source[index].onset) * timeScale
        if (from.pitch + transpose !== melody[matched].pitch || Math.abs(ours - theirs) >= TOLERANCE) break
        matched++
      }
      if (matched > best.matched) best = { index, matched }
    }
  }
  return { matchedNotes: best.matched, sourceIndex: best.index }
}
