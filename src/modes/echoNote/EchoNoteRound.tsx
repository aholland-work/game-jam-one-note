import { useEffect, useEffectEvent, useState } from 'react'
import { audioEngine } from '../../audio/engine'
import { useMelodyPlayer } from '../../audio/useMelodyPlayer'
import { Piano } from '../../components/Piano'
import { PlayingBars } from '../../components/PlayingBars'
import {
  ECHO_LEVELS,
  KEY_CHORD,
  REFERENCE_MIDI,
  ROUND_LENGTH,
  intervalFromC,
  nextLevel,
  notesForLevel,
  pickEchoNote,
  type EchoLength,
  type EchoLevel,
} from '../../game/echoNote'
import { midiToName, midiToPitch, type Note } from '../../music/notation'
import '../round.css'
import './EchoNoteRound.css'

type Playback = 'both' | 'chord' | 'mystery'

const BPM = 80
const note = (midi: number, beats: number): Note => ({ midi, pitch: midiToPitch(midi), beats })
const chord = (beats: number): Note => ({ ...note(KEY_CHORD[0], beats), chord: KEY_CHORD.slice(1) })
const rest = (beats: number): Note => ({ midi: null, pitch: null, beats })

interface EchoNoteRoundProps {
  level: EchoLevel
  length: EchoLength
  onBack: () => void
  onPlayAgain: () => void
  /** Starts a new round at a harder level. */
  onLevelUp: (level: EchoLevel) => void
}

/**
 * One Echo Note session: for each mystery note, hear a C major chord and then the note,
 * find it on the piano, and lock in one answer. Notes the player misses come back more often.
 */
export function EchoNoteRound({ level, length, onBack, onPlayAgain, onLevelUp }: EchoNoteRoundProps) {
  const notes = notesForLevel(level)
  const [target, setTarget] = useState(() => pickEchoNote(notes, null))
  // Bumped for every new mystery note, so it plays as soon as it comes up.
  const [turn, setTurn] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selectedMidi, setSelectedMidi] = useState<number | null>(null)
  const [history, setHistory] = useState<{ target: number; guess: number }[]>([])
  const [misses, setMisses] = useState<Partial<Record<number, number>>>({})
  const [hint, setHint] = useState<string | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const player = useMelodyPlayer<Playback>(BPM)

  const endless = length === 'endless'
  const correctCount = history.filter((entry) => entry.guess === entry.target).length
  const roundOver = !endless && answered && history.length === ROUND_LENGTH

  const playBoth = () => player.play('both', [chord(1), rest(0.5), note(target, 1.5)])
  const playChord = () => player.play('chord', [chord(1.5)])
  const playMystery = () => player.play('mystery', [note(target, 1.5)])

  const onNewNote = useEffectEvent(() => playBoth())
  useEffect(() => {
    onNewNote()
  }, [turn])

  const pressKey = (midi: number) => {
    audioEngine.playNote(midi)
    if (!answered) setSelectedMidi(midi)
  }

  const lockIn = () => {
    if (selectedMidi === null) return setHint('Tap the piano key you think the mystery note is first.')
    const right = selectedMidi === target
    setAnswered(true)
    setHistory([...history, { target, guess: selectedMidi }])
    // A miss makes the note come up more often; getting it right eases it back.
    setMisses({ ...misses, [target]: Math.max(0, (misses[target] ?? 0) + (right ? -1 : 1)) })
    const name = `${midiToName(target)}, ${intervalFromC(target)}`
    setHint(right ? `That's it: ${name}.` : `Not quite. It was ${name}. You picked ${midiToName(selectedMidi)}.`)
    // Play the right answer so the player hears it.
    player.play('mystery', [note(target, 1.5)])
  }

  const nextNote = () => {
    setTarget(pickEchoNote(notes, target, misses))
    setTurn(turn + 1)
    setAnswered(false)
    setSelectedMidi(null)
    setHint(null)
  }

  const finish = () => {
    player.stop()
    setShowSummary(true)
  }

  // Space plays the chord and the mystery note again.
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

  const levelLabel = ECHO_LEVELS.find((option) => option.id === level)?.label

  if (showSummary) {
    const harder = nextLevel(level)
    const strong = history.length > 0 && correctCount / history.length >= 0.8
    const missedNotes = [...new Set(history.filter((entry) => entry.guess !== entry.target).map((entry) => entry.target))]
      .map((midi) => ({ midi, times: history.filter((entry) => entry.target === midi && entry.guess !== midi).length }))
      .sort((a, b) => b.times - a.times)
    return (
      <section className="round" aria-labelledby="round-title">
        <button type="button" className="round-back" onClick={onBack}>
          ← Home
        </button>
        <header className="round-header">
          <h2 id="round-title">Echo Note</h2>
          <p className="round-genre">{levelLabel}</p>
        </header>
        <p className="echo-score">
          You matched <strong>{correctCount}</strong> of {history.length} notes.
        </p>
        {endless ? (
          missedNotes.length > 0 && (
            <p className="echo-practice">
              Notes to keep practicing:{' '}
              {missedNotes.map(({ midi, times }) => `${midiToName(midi)} (missed ${times}×)`).join(', ')}
            </p>
          )
        ) : (
          <ol className="echo-results">
            {history.map((entry, i) => {
              const right = entry.guess === entry.target
              return (
                <li key={i} className={right ? 'is-found' : 'is-missed'}>
                  <span aria-hidden="true">{right ? '✓' : '✗'}</span> {midiToName(entry.target)}
                  <span className="echo-guess">
                    {' '}
                    ({intervalFromC(entry.target)}
                    {!right && `; you picked ${midiToName(entry.guess)}`})
                  </span>
                </li>
              )
            })}
          </ol>
        )}
        {strong && harder && (
          <p className="echo-level-up">Nice ear! Ready for more notes?</p>
        )}
        <div className="round-controls">
          <span className="round-spacer" />
          {strong && harder && (
            <button type="button" className="round-next" onClick={() => onLevelUp(harder)}>
              Next level: {ECHO_LEVELS.find((option) => option.id === harder)?.label}
            </button>
          )}
          <button type="button" className={strong && harder ? '' : 'round-next'} onClick={onPlayAgain}>
            {endless ? 'Practice again' : 'Play another round'}
          </button>
        </div>
      </section>
    )
  }

  const result = answered ? (history[history.length - 1].guess === target ? 'found' : 'missed') : null

  return (
    <section className="round" aria-labelledby="round-title">
      <button type="button" className="round-back" onClick={onBack}>
        ← Home
      </button>
      <header className="round-header">
        <h2 id="round-title">Echo Note</h2>
        <p className="round-genre">
          {levelLabel} ·{' '}
          {endless
            ? `${correctCount} of ${history.length} right`
            : `Note ${Math.min(history.length + (answered ? 0 : 1), ROUND_LENGTH)} of ${ROUND_LENGTH}`}
        </p>
      </header>

      {!endless && (
        <ol className="echo-progress" aria-label="Round progress">
          {Array.from({ length: ROUND_LENGTH }, (_, i) => (
            <li
              key={i}
              className={
                i < history.length
                  ? history[i].guess === history[i].target
                    ? 'is-found'
                    : 'is-missed'
                  : i === history.length
                    ? 'is-current'
                    : ''
              }
            />
          ))}
        </ol>
      )}

      <p className={`round-hint${result ? ` is-${result}` : ''}`} role="status">
        {hint ??
          'You hear a C major chord to set the key, then the mystery note. Find it on the piano, then lock in. Listen as often as you like.'}
      </p>

      <div className="round-controls">
        {playButton('both', 'Chord, then the mystery note', playBoth)}
        {playButton('chord', 'Chord', playChord)}
        {!answered && playButton('mystery', 'Mystery note', playMystery)}
        <span className="round-spacer" />
        {endless && history.length > 0 && (
          <button type="button" onClick={finish}>
            Finish
          </button>
        )}
        {!answered ? (
          <button type="button" className="round-lock" onClick={lockIn}>
            Lock in
          </button>
        ) : roundOver ? (
          <button type="button" className="round-next" onClick={finish}>
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
