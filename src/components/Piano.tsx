import { useEffect, useEffectEvent, useId, useRef, useState, type CSSProperties } from 'react'
import { foldIntoPiano, useMidiNotes } from '../audio/midi'
import { LETTER_KEYS as SHORTCUTS, letterKeySemitone } from '../game/letterKeys'
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
  /** Letter keys play notes wherever focus is on the page, not just on the piano. */
  lettersAnywhere?: boolean
  /** Numbers to show on keys, by MIDI note. A "1" marks home and gets a stronger tint. */
  degrees?: Partial<Record<number, KeyDegree>>
  /** A key was pressed: clicked, typed, or played on a connected MIDI instrument. */
  onPress: (midi: number, fromMidi: boolean) => void
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

/** A piano of one or more octaves with note names on the keys, and optionally their keyboard shortcuts. */
export function Piano({
  startMidi,
  octaves = 1,
  selectedMidi,
  selectedTone = 'selected',
  playingMidi = null,
  showShortcuts = false,
  flats = false,
  lettersAnywhere = true,
  degrees = {},
  onPress,
}: PianoProps) {
  const helpId = useId()
  const root = useRef<HTMLDivElement>(null)
  const [pressed, setPressed] = useState<number | null>(null)
  const releaseTimer = useRef(0)

  const press = (midi: number, fromMidi = false) => {
    onPress(midi, fromMidi)
    setPressed(midi)
    window.clearTimeout(releaseTimer.current)
    releaseTimer.current = window.setTimeout(() => setPressed(null), 180)
  }

  const onShortcut = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target instanceof Element ? event.target : null
    const semitone = letterKeySemitone(
      {
        key: event.key,
        repeat: event.repeat,
        modified: event.metaKey || event.ctrlKey || event.altKey,
        typing: Boolean(target?.closest('input, select, textarea, [contenteditable]')),
        inPiano: Boolean(root.current?.contains(document.activeElement)),
      },
      lettersAnywhere,
    )
    if (semitone === null) return
    event.preventDefault()
    press(startMidi + semitone)
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => onShortcut(event)
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // A note played on a MIDI instrument presses the same-named key, in whatever octave.
  useMidiNotes((midi) => press(foldIntoPiano(midi, startMidi, octaves), true))

  const span = 12 * octaves
  const playingKey =
    playingMidi === null ? null : startMidi + ((((playingMidi - startMidi) % span) + span) % span)
  const whiteCount = 7 * octaves

  const renderKey = (color: 'white' | 'black', midi: number, whiteIndex: number) => {
    const semitone = (midi - startMidi) % 12
    // Numbers go only on the keys given, so a scale reads 1 to 7 from its 1 upward. Repeating
    // them in every octave would put the 4 to 7 before the 1 in most keys.
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
    const result = midi === selectedMidi && selectedTone !== 'selected'
      ? selectedTone === 'found' ? ', correct answer' : ', highlighted note'
      : ''
    const shortcut = showShortcuts && midi - startMidi < 12 ? SHORTCUTS[semitone].toUpperCase() : null
    const visibleLabel = [degree?.label, shortcut, (flats ? FLAT_LABELS : SHARP_LABELS)[semitone]].filter(Boolean).join(' ')
    const scaleLabel = degree ? `, scale degree ${degree.label}${degree.label === '1' ? ', home base' : ''}` : ''
    return (
      <button
        key={midi}
        type="button"
        className={className}
        aria-label={`${visibleLabel}, octave ${Math.floor(midi / 12) - 1}${result}`}
        aria-description={`${spoken}${scaleLabel}${shortcut ? `, keyboard shortcut ${shortcut}` : ''}`}
        aria-keyshortcuts={showShortcuts && midi - startMidi < 12 ? SHORTCUTS[semitone] : undefined}
        aria-pressed={midi === selectedMidi}
        onPointerDown={(event) => {
          event.preventDefault()
          event.currentTarget.focus({ preventScroll: true })
          press(midi)
        }}
        // Pointer notes sound immediately; native clicks cover keyboard and assistive technology.
        onClick={(event) => { if (event.detail === 0) press(midi) }}
        onKeyDown={(event) => {
          const keys = root.current?.querySelectorAll<HTMLButtonElement>('.piano-key')
          if (!keys) return
          const index = midi - startMidi
          const next = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? Math.min(index + 1, keys.length - 1)
            : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? Math.max(index - 1, 0)
            : event.key === 'Home' ? 0 : event.key === 'End' ? keys.length - 1 : null
          if (next === null) return
          event.preventDefault()
          keys[next]?.focus()
        }}
        style={{ left: `${(whiteIndex / whiteCount) * 100}%` }}
      >
        {degree && <><span className={`piano-degree${degree.inPlay ? '' : ' is-faint'}`}>{degree.label}</span>{' '}</>}
        {shortcut && <><kbd className="piano-kbd" aria-hidden="true">{shortcut}</kbd>{' '}</>}
        <span className="piano-label">{(flats ? FLAT_LABELS : SHARP_LABELS)[semitone]}</span>
      </button>
    )
  }

  return (
    <div ref={root} className="piano" role="group" aria-label="Piano" aria-describedby={helpId} style={{ '--octaves': octaves } as CSSProperties}>
      <span id={helpId} className="sr-only">Use arrow keys to move between notes, Home or End to jump to either end, and Enter or Space to play. {lettersAnywhere ? 'Letter shortcuts work anywhere on the page; you can turn that off in Settings.' : 'Letter shortcuts work while the piano has focus.'}</span>
      {Array.from({ length: 12 * octaves }, (_, index) => {
        const octave = Math.floor(index / 12)
        const semitone = index % 12
        const white = WHITE_SEMITONES.indexOf(semitone)
        const black = BLACK_KEYS.find((key) => key.semitone === semitone)
        return renderKey(white >= 0 ? 'white' : 'black', startMidi + index, 7 * octave + (white >= 0 ? white : black!.afterWhite))
      })}
    </div>
  )
}
