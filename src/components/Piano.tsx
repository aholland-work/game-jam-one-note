import { useEffect, useEffectEvent, useRef, useState } from 'react'
import './Piano.css'

interface PianoProps {
  /** MIDI number of the leftmost key, a C. The piano spans one octave from there. */
  startMidi: number
  selectedMidi: number | null
  onPress: (midi: number) => void
}

const WHITE_SEMITONES = [0, 2, 4, 5, 7, 9, 11]
// Each black key sits on the boundary after this many white keys.
const BLACK_KEYS = [
  { semitone: 1, afterWhite: 1 },
  { semitone: 3, afterWhite: 2 },
  { semitone: 6, afterWhite: 4 },
  { semitone: 8, afterWhite: 5 },
  { semitone: 10, afterWhite: 6 },
]
// Computer keyboard shortcuts, in semitone order (the usual music-app layout).
const SHORTCUTS = ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j']

/** A one-octave piano. Keys carry no note names; players go by ear. */
export function Piano({ startMidi, selectedMidi, onPress }: PianoProps) {
  const [pressed, setPressed] = useState<number | null>(null)
  const releaseTimer = useRef(0)

  const press = (midi: number) => {
    onPress(midi)
    setPressed(midi)
    window.clearTimeout(releaseTimer.current)
    releaseTimer.current = window.setTimeout(() => setPressed(null), 180)
  }

  const onShortcut = useEffectEvent((semitone: number) => press(startMidi + semitone))

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
      const semitone = SHORTCUTS.indexOf(event.key.toLowerCase())
      if (semitone === -1) return
      event.preventDefault()
      onShortcut(semitone)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const keyClass = (base: string, midi: number) =>
    [base, midi === selectedMidi && 'is-selected', midi === pressed && 'is-pressed'].filter(Boolean).join(' ')

  return (
    <div className="piano" role="group" aria-label="Piano">
      {WHITE_SEMITONES.map((semitone, i) => {
        const midi = startMidi + semitone
        return (
          <button
            key={semitone}
            type="button"
            className={keyClass('piano-key piano-white', midi)}
            aria-label={`Piano key ${semitone + 1}`}
            aria-pressed={midi === selectedMidi}
            onPointerDown={(event) => {
              event.preventDefault()
              press(midi)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                press(midi)
              }
            }}
            style={{ left: `${(i / 7) * 100}%` }}
          >
            <span className="piano-shortcut">{SHORTCUTS[semitone].toUpperCase()}</span>
          </button>
        )
      })}
      {BLACK_KEYS.map(({ semitone, afterWhite }) => {
        const midi = startMidi + semitone
        return (
          <button
            key={semitone}
            type="button"
            className={keyClass('piano-key piano-black', midi)}
            aria-label={`Piano key ${semitone + 1}`}
            aria-pressed={midi === selectedMidi}
            onPointerDown={(event) => {
              event.preventDefault()
              press(midi)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                press(midi)
              }
            }}
            style={{ left: `${(afterWhite / 7) * 100}%` }}
          >
            <span className="piano-shortcut">{SHORTCUTS[semitone].toUpperCase()}</span>
          </button>
        )
      })}
    </div>
  )
}
