import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { midiInput } from '../../audio/midi'
import { useMelodyPlayer } from '../../audio/useMelodyPlayer'
import { Piano } from '../../components/Piano'
import { RoundNavigation } from '../../components/RoundNavigation'
import { Icon } from '../../components/Icon'
import { PlayingBars } from '../../components/PlayingBars'
import { SettingsMenu } from '../../components/SettingsMenu'
import {
  CHORD_TONES,
  C_MAJOR,
  ECHO_LEVELS,
  LEVEL_UP_SCORE,
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

/** How many recent answers free practice shows. */
const TRAIL_LENGTH = 10

interface Answer {
  key: EchoKey
  step: number
  guess: number
}

const isRight = (entry: Answer) => samePitchClass(entry.guess, noteInKey(entry.key, entry.step))

/** One answer in a trail: a colored bar, with a label for screen readers. */
function TrailMark({ entry, number }: { entry: Answer; number: number }) {
  const right = isRight(entry)
  return (
    <li className={right ? 'is-found' : 'is-missed'}>
      <span className="sr-only">{`Note ${number}: ${right ? 'right' : 'missed'}, the ${degreeName(entry.step)}`}</span>
    </li>
  )
}

interface EchoNoteRoundProps {
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  onBack: () => void
  onPlayAgain: () => void
  /** Starts a new session with some settings changed, e.g. the next level or a set. */
  onStartWith: (changes: Partial<Pick<Settings, 'echoLevel' | 'echoLength'>>) => void
}

/**
 * One Echo Note session, a set of 5 notes or free practice: for each mystery note, hear the
 * key's chord and then the note, find it on the piano, and lock in one answer.
 */
export function EchoNoteRound({ settings, onSettingsChange, onBack, onPlayAgain, onStartWith }: EchoNoteRoundProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  // The level, length and key choice are set for the whole session.
  const [{ echoLevel: level, echoLength: length, echoKey: keyChoice }] = useState(settings)
  const steps = stepsForLevel(level)
  const [key, setKey] = useState(() => (keyChoice === 'random' ? pickKey(null) : C_MAJOR))
  const [step, setStep] = useState(() => pickEchoNote(steps, []))
  // Bumped for every new mystery note, so it plays as soon as it comes up.
  const [turn, setTurn] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selectedMidi, setSelectedMidi] = useState<number | null>(null)
  const [history, setHistory] = useState<Answer[]>([])
  const [hint, setHint] = useState<string | null>(null)
  const [newKey, setNewKey] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const player = useMelodyPlayer<Playback>(BPM)
  const lockButton = useRef<HTMLButtonElement>(null)
  const nextButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (showSummary) heading.current?.focus()
  }, [showSummary])

  const endless = length === 'endless'
  const target = noteInKey(key, step)
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

  // Keep keyboard players moving: after answering, focus goes to the next step, then back to Lock in.
  const lockFocus = useRef(false)
  useEffect(() => {
    if (answered) {
      nextButton.current?.focus()
      lockFocus.current = true
    } else if (lockFocus.current) {
      lockButton.current?.focus()
    }
  }, [answered])

  const pressKey = (midi: number, fromMidi: boolean) => {
    midiInput.playKey(midi, fromMidi)
    if (!answered) setSelectedMidi(midi)
  }

  const lockIn = () => {
    if (selectedMidi === null) return setHint('Tap the piano key you think the mystery note is first.')
    const entry = { key, step, guess: selectedMidi }
    const right = isRight(entry)
    setAnswered(true)
    setNewKey(false)
    setHistory([...history, entry])
    const answer = `${midiToName(target, key.flats)}, the ${degreeName(step)}`
    const picked = `${midiToName(selectedMidi, key.flats)}, the ${degreeName(selectedMidi - key.tonic)}`
    setHint(right ? `Right: ${describeNote(key, step)}.` : `Not quite. It was ${answer}. You picked ${picked}.`)
    // Play the right answer so the player hears it.
    player.play('mystery', [note(target, 1.5)])
  }

  const nextNote = () => {
    // Endless practice with random keys moves to a new key every so often.
    const changeKey = endless && keyChoice === 'random' && history.length % NOTES_PER_KEY === 0
    if (changeKey) setKey(pickKey(key))
    setNewKey(changeKey)
    setStep(pickEchoNote(steps, history.map((entry) => entry.step)))
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
      if (event.key !== ' ' || (event.target instanceof Element && event.target.closest('button, input, select, textarea, summary, a, [role="button"]'))) return
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
    const fullSet = !endless && history.length === ROUND_LENGTH
    // Only a full set counts toward the next level, so a lucky few answers can't unlock it.
    const earned = fullSet && correctCount >= LEVEL_UP_SCORE && harder !== null
    // How each note number went, hardest first.
    const byStep = [...new Set(history.map((entry) => entry.step))]
      .map((asked) => {
        const tries = history.filter((entry) => entry.step === asked)
        return { asked, right: tries.filter(isRight).length, total: tries.length }
      })
      .sort((a, b) => a.right / a.total - b.right / b.total || a.asked - b.asked)
    return (
      <section className="round echo-round" aria-labelledby="round-title">
        <RoundNavigation onBack={onBack} backLabel="Home" />
        <p className="round-mode">Ear training</p>
        <header className="round-header">
          <h2 id="round-title" ref={heading} tabIndex={-1}>Echo Note</h2>
          <p className="round-genre">{levelLabel}</p>
        </header>
        <p className="echo-score" role="status">
          You matched <strong>{correctCount}</strong> of {history.length} {history.length === 1 ? 'note' : 'notes'}.
        </p>
        {!endless && !fullSet && (
          <p className="echo-practice">You ended the set early, so it doesn't count toward the next level.</p>
        )}
        <table className="echo-by-step">
          <caption>How each note went</caption>
          <thead>
            <tr>
              <th scope="col">Note</th>
              <th scope="col">Right</th>
            </tr>
          </thead>
          <tbody>
            {byStep.map(({ asked, right, total }) => (
              <tr key={asked} className={right === total ? 'is-found' : 'is-missed'}>
                <th scope="row">the {degreeName(asked)}</th>
                <td>
                  {right} of {total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <details className="echo-each">
          <summary>See each answer</summary>
          <ol className="echo-results">
            {history.map((entry, i) => {
              const right = isRight(entry)
              return (
                <li key={i} className={right ? 'is-found' : 'is-missed'}>
                  <span className="sr-only">{right ? 'Right: ' : 'Missed: '}</span>
                  <span aria-hidden="true">{right ? '✓' : '×'}</span> {describeNote(entry.key, entry.step)}
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
        </details>
        {earned && <p className="echo-level-up">Nice ear! Ready for more notes?</p>}
        {endless && history.length >= 5 && (
          <p className="echo-practice-note">Want to see if you're ready for the next level? Try a set of {ROUND_LENGTH}.</p>
        )}
        <div className="round-controls">
          <span className="round-spacer" />
          {earned && (
            <button type="button" className="round-next" onClick={() => onStartWith({ echoLevel: harder })}>
              Next level: {ECHO_LEVELS.find((option) => option.id === harder)?.label}
            </button>
          )}
          {endless && (
            <button type="button" onClick={() => onStartWith({ echoLength: 'round' })}>
              Try a set of {ROUND_LENGTH}
            </button>
          )}
          <button type="button" className={earned ? '' : 'round-next'} onClick={onPlayAgain}>
            {endless ? 'Practice again' : 'Play another set'}
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

  // Where the player is: the question number in a set, or a running count in free practice.
  const position = endless
    ? history.length === 0
      ? 'Ready when you are'
      : `${history.length} played · ${correctCount} right`
    : `Note ${Math.min(history.length + (answered ? 0 : 1), ROUND_LENGTH)} of ${ROUND_LENGTH}`
  const trailStart = endless ? Math.max(0, history.length - TRAIL_LENGTH) : 0

  return (
    <section className="round echo-round" aria-labelledby="round-title">
      <RoundNavigation onBack={onBack} backLabel="Home">
        <SettingsMenu mode="echo-note" settings={settings} onChange={onSettingsChange} inRound />
      </RoundNavigation>
      <p className="round-mode">Ear training</p>
      <header className="round-header">
        <h2 id="round-title" ref={heading} tabIndex={-1}>Echo Note</h2>
        <div className="round-header-side">
          <p className="round-genre">{levelLabel}</p>
        </div>
      </header>

      <div className="echo-context">
        <p className="echo-key">
          Key: <strong>{keyName(key)}</strong>
          {newKey && <span className="echo-new-key">New key! Listen to the chord for the new 1.</span>}
        </p>
        <div className="echo-position">
          <span className="echo-position-text">{position}</span>
          {endless ? (
            history.length > 0 && (
              <ol className="echo-progress" aria-label={`Your last ${Math.min(history.length, TRAIL_LENGTH)} answers`}>
                {history.slice(trailStart).map((entry, i) => (
                  <TrailMark key={trailStart + i} entry={entry} number={trailStart + i + 1} />
                ))}
              </ol>
            )
          ) : (
            <ol className="echo-progress" aria-label="Set progress">
              {Array.from({ length: ROUND_LENGTH }, (_, i) =>
                i < history.length ? (
                  <TrailMark key={i} entry={history[i]} number={i + 1} />
                ) : (
                  <li
                    key={i}
                    aria-current={!answered && i === history.length ? 'step' : undefined}
                    className={!answered && i === history.length ? 'is-current' : ''}
                  >
                    <span className="sr-only">{`Note ${i + 1}: ${!answered && i === history.length ? 'current' : 'not played yet'}`}</span>
                  </li>
                ),
              )}
            </ol>
          )}
        </div>
      </div>

      <p className={`round-hint${result ? ` is-${result}` : ''}`} role="status">
        {hint ??
          `The ${keyName(key)} chord sets home base (the 1). Which number is the mystery note?`}
        {answered && !endless && <span className="sr-only">{` ${history.length} of ${ROUND_LENGTH} done.`}</span>}
      </p>
      {level === 'all' && (
        <p className="echo-tip">Tip: on this level the mystery note can also be one of the 5 notes outside the key.</p>
      )}

      <div className="round-controls">
        {playButton('both', settings.echoOverChord ? 'Mystery note over the chord' : 'Chord, then the mystery note', playBoth)}
        {playButton('chord', 'Chord', playChord)}
        {!answered && playButton('mystery', 'Mystery note', playMystery)}
        <span className="round-spacer" />
        {history.length > 0 && !roundOver && (
          <button type="button" onClick={finish}>
            {endless ? 'Finish' : 'End set'}
          </button>
        )}
        {!answered ? (
          <button type="button" className="round-lock" ref={lockButton} onClick={lockIn}>
            Lock in
          </button>
        ) : roundOver ? (
          <button type="button" className="round-next" ref={nextButton} onClick={finish}>
            See results
          </button>
        ) : (
          <button type="button" className="round-next" ref={nextButton} onClick={nextNote}>
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
          lettersAnywhere={settings.lettersAnywhere}
          onPress={pressKey}
        />
      </div>
    </section>
  )
}
