import { useEffect, useState } from 'react'
import type { Note } from '../music/notation'
import { audioEngine } from './engine'

interface PlayOptions {
  startIndex?: number
  onNote?: (index: number) => void
  onComplete?: () => void
}

/**
 * Plays, pauses and resumes melodies for a round. `K` names what's playing (for example
 * "original" or "changed") so buttons can show Pause or Resume for the right version.
 */
export function useMelodyPlayer<K extends string>(bpm: number) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [current, setCurrent] = useState<{ key: K; notes: Note[] } | null>(null)
  const [paused, setPaused] = useState<{ key: K; notes: Note[]; index: number } | null>(null)

  const play = (key: K, notes: Note[], { startIndex = 0, onNote, onComplete }: PlayOptions = {}) => {
    setPaused(null)
    // Starting a melody stops the previous one, whose onEnd clears state; set ours afterwards.
    audioEngine.playMelody(notes, {
      bpm,
      startIndex,
      onNote: (index) => {
        setActiveIndex(index)
        onNote?.(index)
      },
      onEnd: (completed) => {
        setActiveIndex(null)
        setCurrent(null)
        if (completed) onComplete?.()
      },
    })
    setCurrent({ key, notes })
  }

  const pause = () => {
    if (!current) return
    const index = activeIndex ?? 0
    audioEngine.stop()
    setPaused({ ...current, index })
    // Keep the highlight on the note where playback stopped.
    setActiveIndex(index)
  }

  const resume = (fromStart = false) => {
    if (paused) play(paused.key, paused.notes, { startIndex: fromStart ? 0 : paused.index })
  }

  const stop = () => {
    audioEngine.stop()
    setPaused(null)
  }

  useEffect(() => () => audioEngine.stop(), [])

  return {
    activeIndex,
    playing: current?.key ?? null,
    playingNotes: current?.notes ?? null,
    paused: paused?.key ?? null,
    play,
    pause,
    resume,
    stop,
  }
}
