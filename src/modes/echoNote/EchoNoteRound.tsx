import { useEffect, useEffectEvent, useState } from 'react'
import { audioEngine } from '../../audio/engine'
import { useMelodyPlayer } from '../../audio/useMelodyPlayer'
import { Piano } from '../../components/Piano'
import { PlayingBars } from '../../components/PlayingBars'
import { REFERENCE_MIDI, pickEchoNotes } from '../../game/echoNote'
import { midiToName, midiToPitch, type Note } from '../../music/notation'
import '../round.css'
import './EchoNoteRound.css'

type Playback = 'both' | 'reference' | 'mystery'

const BPM = 80
const note = (midi: number, beats: number): Note => ({ midi, pitch: midiToPitch(midi), beats })
const rest = (beats: number): Note => ({ midi: null, pitch: null, beats })

interface EchoNoteRoundProps {
  onBack: () => void
  onPlayAgain: () => void
}

/**
 * One Echo Note round: for each mystery note, hear the reference C and then the mystery
 * note, find it on the piano, and lock in one answer.
 */
export function EchoNoteRound({ onBack, onPlayAgain }: EchoNoteRoundProps) {
  const [targets] = useState(() => pickEchoNotes())
  const [position, setPosition] = useState(0)
  const [selectedMidi, setSelectedMidi] = useState<number | null>(null)
  const [guesses, setGuesses] = useState<number[]>([])
  const [hint, setHint] = useState<string | null>(null)
  const player = useMelodyPlayer<Playback>(BPM)

  const target = targets[position]
  const answered = guesses.length > position
  const finished = answered && position === targets.length - 1
  const [showSummary, setShowSummary] = useState(false)
  const correctCount = guesses.filter((guess, i) => guess === targets[i]).length

  const playBoth = (midi = target) =>
    player.play('both', [note(REFERENCE_MIDI, 1), rest(0.5), note(midi, 1.5)])
  const playReference = () => player.play('reference', [note(REFERENCE_MIDI, 1.5)])
  const playMystery = () => player.play('mystery', [note(target, 1.5)])

  // Each new mystery note plays as soon as it comes up (the click that got here allows audio).
  const onNewNote = useEffectEvent(() => {
    if (!showSummary) playBoth()
  })
  useEffect(() => {
    onNewNote()
  }, [position])

  const pressKey = (midi: number) => {
    audioEngine.playNote(midi)
    if (!answered) setSelectedMidi(midi)
  }

  const lockIn = () => {
    if (selectedMidi === null) return setHint('Tap the piano key you think the mystery note is first.')
    setGuesses([...guesses, selectedMidi])
    setHint(
      selectedMidi === target
        ? `That's it: ${midiToName(target)}.`
        : `Not quite. It was ${midiToName(target)}, and you picked ${midiToName(selectedMidi)}.`,
    )
    // Play the right answer so the player hears what it was.
    player.play('mystery', [note(target, 1.5)])
  }

  const nextNote = () => {
    setSelectedMidi(null)
    setHint(null)
    setPosition(position + 1)
  }

  // Space plays the reference and mystery note again.
  const onSpace = useEffectEvent(() => {
    if (!showSummary) playBoth()
  })
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' || event.target instanceof HTMLButtonElement) return
      event.preventDefault()
      onSpace()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const playButton = (kind: Playback, label: string, onClick: () => void) =>
    player.playing === kind ? (
      <button type="button" onClick={player.stop}>
        ■ Stop <PlayingBars />
      </button>
    ) : (
      <button type="button" onClick={onClick}>
        ▶ {label}
      </button>
    )

  if (showSummary) {
    return (
      <section className="round" aria-labelledby="round-title">
        <button type="button" className="round-back" onClick={onBack}>
          ← Home
        </button>
        <header className="round-header">
          <h2 id="round-title">Echo Note</h2>
          <p className="round-genre">Round complete</p>
        </header>
        <p className="echo-score">
          You matched <strong>{correctCount}</strong> of {targets.length} notes.
        </p>
        <ol className="echo-results">
          {targets.map((midi, i) => {
            const right = guesses[i] === midi
            return (
              <li key={i} className={right ? 'is-found' : 'is-missed'}>
                <span aria-hidden="true">{right ? '✓' : '✗'}</span> {midiToName(midi)}
                {!right && <span className="echo-guess"> (you picked {midiToName(guesses[i])})</span>}
              </li>
            )
          })}
        </ol>
        <div className="round-controls">
          <span className="round-spacer" />
          <button type="button" className="round-next" onClick={onPlayAgain}>
            Play another round
          </button>
        </div>
      </section>
    )
  }

  const result = answered ? (guesses[position] === target ? 'found' : 'missed') : null

  return (
    <section className="round" aria-labelledby="round-title">
      <button type="button" className="round-back" onClick={onBack}>
        ← Home
      </button>
      <header className="round-header">
        <h2 id="round-title">Echo Note</h2>
        <p className="round-genre">
          Note {position + 1} of {targets.length}
        </p>
      </header>

      <ol className="echo-progress" aria-label="Round progress">
        {targets.map((midi, i) => (
          <li
            key={i}
            className={
              i < guesses.length ? (guesses[i] === midi ? 'is-found' : 'is-missed') : i === position ? 'is-current' : ''
            }
          />
        ))}
      </ol>

      <p className={`round-hint${result ? ` is-${result}` : ''}`} role="status">
        {hint ??
          'You hear C first, then the mystery note. Find the mystery note on the piano, then lock in. Listen as often as you like.'}
      </p>

      <div className="round-controls">
        {playButton('both', 'Play C, then the mystery note', () => playBoth())}
        {playButton('reference', 'C', playReference)}
        {!answered && playButton('mystery', 'Mystery note', playMystery)}
        <span className="round-spacer" />
        {!answered ? (
          <button type="button" className="round-lock" onClick={lockIn}>
            Lock in
          </button>
        ) : finished ? (
          <button type="button" className="round-next" onClick={() => setShowSummary(true)}>
            See results
          </button>
        ) : (
          <button type="button" className="round-next" onClick={nextNote}>
            Next note →
          </button>
        )}
      </div>

      <div className="round-piano">
        <Piano
          startMidi={REFERENCE_MIDI}
          selectedMidi={answered ? target : selectedMidi}
          selectedTone={result ?? 'selected'}
          onPress={pressKey}
        />
      </div>
    </section>
  )
}
