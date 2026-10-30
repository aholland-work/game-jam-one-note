import { useEffect, useEffectEvent, useState } from 'react'
import { audioEngine } from '../../audio/engine'
import { useMelodyPlayer } from '../../audio/useMelodyPlayer'
import { Piano } from '../../components/Piano'
import { Icon } from '../../components/Icon'
import { PlayingBars } from '../../components/PlayingBars'
import { SettingsMenu } from '../../components/SettingsMenu'
import {
  CHORD_TONES,
  C_MAJOR,
  ECHO_LEVELS,
  MAJOR_SCALE,
  NOTES_PER_KEY,
  ROUND_LENGTH,
  degreeName,
  describeNote,
  keyName,
  nextLevel,
  noteInKey,
  pickEchoNote,
  pickKey,
  stepsForLevel,
  type EchoKey,
  type EchoLevel,
} from '../../game/echoNote'
import type { Settings } from '../../game/settings'
import { midiToName, midiToPitch, type Note } from '../../music/notation'
import '../round.css'
import './EchoNoteRound.css'

type Playback = 'both' | 'chord' | 'mystery'

const BPM = 80
const note = (midi: number, beats: number): Note => ({ midi, pitch: midiToPitch(midi), beats })
const rest = (beats: number): Note => ({ midi: null, pitch: null, beats })

/** The key's own chord. Under a mystery note it sits an octave lower, so the note stands out. */
const chord = (key: EchoKey, beats: number, low: boolean): Note => {
  const [root, ...upper] = CHORD_TONES.map((step) => key.tonic + step - (low ? 12 : 0))
  return { ...note(root, beats), chord: upper }
}

const samePitchClass = (a: number, b: number) => a % 12 === b % 12

interface EchoNoteRoundProps {
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  onBack: () => void
  onPlayAgain: () => void
  /** Starts a new round at a harder level. */
  onLevelUp: (level: EchoLevel) => void
}

/**
 * One Echo Note session: for each mystery note, hear the key's chord and then the note,
 * find it on the piano, and lock in one answer. Notes the player misses come back more often.
 */
export function EchoNoteRound({ settings, onSettingsChange, onBack, onPlayAgain, onLevelUp }: EchoNoteRoundProps) {
  // The level, length and key choice are set for the whole session.
  const [{ echoLevel: level, echoLength: length, echoKey: keyChoice }] = useState(settings)
  const steps = stepsForLevel(level)
  const [key, setKey] = useState(() => (keyChoice === 'random' ? pickKey(null) : C_MAJOR))
  const [step, setStep] = useState(() => pickEchoNote(steps, null))
  // Bumped for every new mystery note, so it plays as soon as it comes up.
  const [turn, setTurn] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selectedMidi, setSelectedMidi] = useState<number | null>(null)
  const [history, setHistory] = useState<{ key: EchoKey; step: number; guess: number }[]>([])
  // Misses are counted by note number, so a tricky 7 keeps coming back in every key.
  const [misses, setMisses] = useState<Partial<Record<number, number>>>({})
  const [hint, setHint] = useState<string | null>(null)
  const [newKey, setNewKey] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const player = useMelodyPlayer<Playback>(BPM)

  const endless = length === 'endless'
  const target = noteInKey(key, step)
  const isRight = (entry: { key: EchoKey; step: number; guess: number }) =>
    samePitchClass(entry.guess, noteInKey(entry.key, entry.step))
  const correctCount = history.filter(isRight).length
  const roundOver = !endless && answered && history.length === ROUND_LENGTH

  const playBoth = () =>
    player.play(
      'both',
      settings.echoOverChord
        ? [{ ...chord(key, 1, true), sustain: 2 }, note(target, 2)]
        : [chord(key, 1, false), rest(0.5), note(target, 1.5)],
    )
  const playChord = () => player.play('chord', [chord(key, 1.5, settings.echoOverChord)])
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
    const entry = { key, step, guess: selectedMidi }
    const right = isRight(entry)
    setAnswered(true)
    setNewKey(false)
    setHistory([...history, entry])
    // A miss makes the note come up more often; getting it right eases it back.
    setMisses({ ...misses, [step]: Math.max(0, (misses[step] ?? 0) + (right ? -1 : 1)) })
    const picked = `${midiToName(selectedMidi, key.flats)}, the ${degreeName(selectedMidi - key.tonic)}`
    setHint(right ? `That's it: ${describeNote(key, step)}.` : `Not quite. It was ${describeNote(key, step)}. You picked ${picked}.`)
    // Play the right answer so the player hears it.
    player.play('mystery', [note(target, 1.5)])
  }

  const nextNote = () => {
    // Endless practice with random keys moves to a new key every so often.
    const changeKey = endless && keyChoice === 'random' && history.length % NOTES_PER_KEY === 0
    if (changeKey) setKey(pickKey(key))
    setNewKey(changeKey)
    setStep(pickEchoNote(steps, changeKey ? null : step, misses))
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
        <Icon name="stop" />
        Stop <PlayingBars />
      </button>
    ) : (
      <button type="button" className={kind === 'both' ? 'round-play' : undefined} onClick={onClick}>
        <Icon name="play" />
        {label}
      </button>
    )

  const levelLabel = ECHO_LEVELS.find((option) => option.id === level)?.label

  if (showSummary) {
    const harder = nextLevel(level)
    const strong = history.length > 0 && correctCount / history.length >= 0.8
    const missedSteps = [...new Set(history.filter((entry) => !isRight(entry)).map((entry) => entry.step))]
      .map((missed) => ({ missed, times: history.filter((entry) => entry.step === missed && !isRight(entry)).length }))
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
          missedSteps.length > 0 && (
            <p className="echo-practice">
              Notes to keep practicing:{' '}
              {missedSteps.map(({ missed, times }) => `the ${degreeName(missed)} (missed ${times}×)`).join(', ')}
            </p>
          )
        ) : (
          <ol className="echo-results">
            {history.map((entry, i) => {
              const right = isRight(entry)
              return (
                <li key={i} className={right ? 'is-found' : 'is-missed'}>
                  <span aria-hidden="true">{right ? '✓' : '✗'}</span> {describeNote(entry.key, entry.step)}
                  {!right && (
                    <span className="echo-guess">
                      {' '}
                      (you picked {midiToName(entry.guess, entry.key.flats)}, the{' '}
                      {degreeName(entry.guess - entry.key.tonic)})
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        )}
        {strong && harder && <p className="echo-level-up">Nice ear! Ready for more notes?</p>}
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

  const result = answered ? (isRight(history[history.length - 1]) ? 'found' : 'missed') : null
  // Number the key's scale from the 1 upward; tint only the notes that can come up at this level.
  const degrees = settings.echoShowScale
    ? Object.fromEntries(
        MAJOR_SCALE.map((scaleStep) => [
          noteInKey(key, scaleStep),
          { label: degreeName(scaleStep), inPlay: steps.includes(scaleStep) },
        ]),
      )
    : {}

  return (
    <section className="round" aria-labelledby="round-title">
      <button type="button" className="round-back" onClick={onBack}>
        ← Home
      </button>
      <header className="round-header">
        <h2 id="round-title">Echo Note</h2>
        <div className="round-header-side">
          <p className="round-genre">
            {levelLabel} ·{' '}
            {endless
              ? `${correctCount} of ${history.length} right`
              : `Note ${Math.min(history.length + (answered ? 0 : 1), ROUND_LENGTH)} of ${ROUND_LENGTH}`}
          </p>
          <SettingsMenu mode="echo-note" settings={settings} onChange={onSettingsChange} inRound />
        </div>
      </header>

      <p className="echo-key">
        Key: <strong>{keyName(key)}</strong>
        {newKey && <span className="echo-new-key">New key! Listen to the chord for the new 1.</span>}
      </p>
      {level === 'all' && (
        <p className="echo-tip">Tip: on this level the mystery note can also be one of the 5 notes outside the key.</p>
      )}

      {!endless && (
        <ol className="echo-progress" aria-label="Round progress">
          {Array.from({ length: ROUND_LENGTH }, (_, i) => (
            <li
              key={i}
              className={
                i < history.length
                  ? isRight(history[i])
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
          `The ${keyName(key)} chord sets home base (the 1). Which number is the mystery note? Tap keys to compare, then lock in.`}
      </p>

      <div className="round-controls">
        {playButton('both', settings.echoOverChord ? 'Mystery note over the chord' : 'Chord, then the mystery note', playBoth)}
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

      <div className="round-piano is-wide">
        <Piano
          startMidi={60}
          octaves={2}
          selectedMidi={answered ? target : selectedMidi}
          selectedTone={result ?? 'selected'}
          flats={key.flats}
          degrees={degrees}
          onPress={pressKey}
        />
      </div>
    </section>
  )
}
