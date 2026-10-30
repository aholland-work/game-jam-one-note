import { useEffect, useEffectEvent, useRef, useState, type CSSProperties } from 'react'
import './Piano.css'

/** A number shown on a key, e.g. its step in a scale, and whether it's tinted as a possible answer. */
export interface KeyDegree {
  label: string
  inPlay: boolean
}

interface PianoProps {
  /** MIDI number of the leftmost key, a C. */
  startMidi: number
  /** How many octaves the piano spans from `startMidi`. */
  octaves?: number
  selectedMidi: number | null
  /** How to color the selected key: the player's pick, a wrong answer, or the right one. */
  selectedTone?: 'selected' | 'missed' | 'found'
  /** The note sounding in a melody right now. Notes outside the piano light up their same-named key. */
  playingMidi?: number | null
  /** Show each key's computer-keyboard shortcut on the key (first octave only). */
  showShortcuts?: boolean
  /** Name the black keys with flats (B♭) instead of sharps (A♯), to match songs written in flats. */
  flats?: boolean
  /** Numbers to show on keys, by MIDI note. A "1" marks home and gets a stronger tint. */
  degrees?: Partial<Record<number, KeyDegree>>
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
const SHARP_LABELS = ['C', 'C\u266F', 'D', 'D\u266F', 'E', 'F', 'F\u266F', 'G', 'G\u266F', 'A', 'A\u266F', 'B']
const FLAT_LABELS = ['C', 'D\u266D', 'D', 'E\u266D', 'E', 'F', 'G\u266D', 'G', 'A\u266D', 'A', 'B\u266D', 'B']
const SPOKEN_SHARPS = ['C', 'C sharp', 'D', 'D sharp', 'E', 'F', 'F sharp', 'G', 'G sharp', 'A', 'A sharp', 'B']
const SPOKEN_FLATS = ['C', 'D flat', 'D', 'E flat', 'E', 'F', 'G flat', 'G', 'A flat', 'A', 'B flat', 'B']
// Computer keyboard shortcuts, in semitone order (the usual music-app layout).
const SHORTCUTS = ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j']

/** A piano of one or more octaves with note names on the keys, and optionally their keyboard shortcuts. */
export function Piano({
  startMidi,
  octaves = 1,
  selectedMidi,
  selectedTone = 'selected',
  playingMidi = null,
  showShortcuts = false,
  flats = false,
  degrees = {},
  onPress,
}: PianoProps) {
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

  const span = 12 * octaves
  const playingKey =
    playingMidi === null ? null : startMidi + ((((playingMidi - startMidi) % span) + span) % span)
  const whiteCount = 7 * octaves

  const renderKey = (color: 'white' | 'black', midi: number, whiteIndex: number) => {
    const semitone = (midi - startMidi) % 12
    const degree = degrees[midi]
    const className = [
      `piano-key piano-${color}`,
      degree?.inPlay && 'is-in-key',
      degree?.inPlay && degree.label === '1' && 'is-home',
      midi === selectedMidi && `is-${selectedTone}`,
      midi === playingKey && 'is-playing',
      midi === pressed && 'is-pressed',
    ]
      .filter(Boolean)
      .join(' ')
    const spoken = (flats ? SPOKEN_FLATS : SPOKEN_SHARPS)[semitone]
    return (
      <button
        key={midi}
        type="button"
        className={className}
        aria-label={octaves > 1 ? `${spoken} ${Math.floor(midi / 12) - 1}` : spoken}
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
        style={{ left: `${(whiteIndex / whiteCount) * 100}%` }}
      >
        {degree && <span className={`piano-degree${degree.inPlay ? '' : ' is-faint'}`}>{degree.label}</span>}
        {showShortcuts && midi - startMidi < 12 && <kbd className="piano-kbd">{SHORTCUTS[semitone].toUpperCase()}</kbd>}
        <span className="piano-label">{(flats ? FLAT_LABELS : SHARP_LABELS)[semitone]}</span>
      </button>
    )
  }

  const octaveStarts = Array.from({ length: octaves }, (_, octave) => octave)
  return (
    <div className="piano" role="group" aria-label="Piano" style={{ '--octaves': octaves } as CSSProperties}>
      {octaveStarts.flatMap((octave) =>
        WHITE_SEMITONES.map((semitone, i) => renderKey('white', startMidi + 12 * octave + semitone, 7 * octave + i)),
      )}
      {octaveStarts.flatMap((octave) =>
        BLACK_KEYS.map(({ semitone, afterWhite }) =>
          renderKey('black', startMidi + 12 * octave + semitone, 7 * octave + afterWhite),
        ),
      )}
    </div>
  )
}
