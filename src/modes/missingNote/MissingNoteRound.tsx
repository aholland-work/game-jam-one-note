import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { audioEngine } from '../../audio/engine'
import { useMelodyPlayer } from '../../audio/useMelodyPlayer'
import { Piano } from '../../components/Piano'
import { PlayingBars } from '../../components/PlayingBars'
import { Staff } from '../../components/Staff'
import { MAX_TRIES, answerMidi, pianoStartMidi, withGap, withGuess } from '../../game/puzzle'
import { readFlag, writeFlag } from '../../game/storage'
import { hasSeenTutorial, markTutorialSeen } from '../../game/tutorial'
import { usesFlats } from '../../music/notation'
import type { Song } from '../../songs/types'
import '../round.css'

type Status = 'guessing' | 'found' | 'missed'
// What's playing: the melody with its gap, a try with the player's note, or the result.
type Playback = 'gap' | 'try' | 'result'

// Pause between hearing a wrong answer and hearing the right one.
const CORRECTION_PAUSE_MS = 700

const DEFAULT_HINT = 'Listen to the melody, then find the missing note on the piano.'
const SHORTCUTS_KEY = 'one-note:show-shortcuts'

// First-time players are walked through one round, one step at a time.
type TutorialStep = 'play' | 'keys' | 'lock' | 'done'

const TUTORIAL_TEXT: Record<TutorialStep, string> = {
  play: 'Press ▶ Play to hear the melody. The dashed box on the staff is the missing note.',
  keys: 'Tap the piano keys to hear notes and look for the one that fills the gap. Replay the melody as often as you like. Prefer your keyboard? Open "Keyboard shortcuts" below the piano.',
  lock: "Found it? Make sure that key is selected, then press Lock in. You only get one answer, so take your time.",
  done: "That's the game! The notes slide to their real spots as the song plays. Pick another song whenever you're ready.",
}

interface MissingNoteRoundProps {
  song: Song
  onBack: () => void
  /** Goes to the next song, or null when this is the last one in the list. */
  onNext: (() => void) | null
  /** Called when the player finds the missing note. */
  onSolved: () => void
}

/** One Missing Note puzzle: listen, test keys on the piano, lock in one answer. */
export function MissingNoteRound({ song, onBack, onNext, onSolved }: MissingNoteRoundProps) {
  const [status, setStatus] = useState<Status>('guessing')
  const [selectedMidi, setSelectedMidi] = useState<number | null>(null)
  const [triesLeft, setTriesLeft] = useState(MAX_TRIES)
  const [revealedCount, setRevealedCount] = useState(0)
  const [hint, setHint] = useState(DEFAULT_HINT)
  // Remembered across songs, so players who like the shortcuts keep seeing them.
  const [showShortcuts, setShowShortcuts] = useState(() => readFlag(SHORTCUTS_KEY))
  const [tutorialStep, setTutorialStep] = useState<TutorialStep | null>(() => (hasSeenTutorial() ? null : 'play'))
  // After a miss, the player's wrong note is shown and played first, then the right one.
  const [showingWrongNote, setShowingWrongNote] = useState(false)
  const [awaitingCorrection, setAwaitingCorrection] = useState(false)
  const correctionTimer = useRef(0)
  // A paused try keeps its own melody, so resuming it can't test a different key for free.
  const player = useMelodyPlayer<Playback>(song.bpm)

  const answer = answerMidi(song)
  const isOver = status !== 'guessing'
  // Once the round is over, the piano and message follow what's on the staff:
  // orange while the wrong note plays, green once the right note is shown.
  const resultTone = showingWrongNote ? 'missed' : 'found'
  const resultPlaying = isOver && (player.playing !== null || awaitingCorrection)
  const playingMidi =
    player.playingNotes && player.activeIndex !== null ? player.playingNotes[player.activeIndex]?.midi ?? null : null
  const guessPlaying = !isOver && player.playing !== null

  const playWithGap = () => {
    if (tutorialStep === 'play') setTutorialStep('keys')
    player.play('gap', withGap(song.melody, song.missingIndex))
  }

  // Space plays, pauses and resumes while guessing.
  const onSpace = useEffectEvent(() => {
    if (isOver) return
    if (guessPlaying) player.pause()
    else if (player.paused) player.resume()
    else playWithGap()
  })

  const playComplete = () => {
    window.clearTimeout(correctionTimer.current)
    setShowingWrongNote(false)
    setRevealedCount(0)
    player.play('result', song.melody, { onNote: (index) => setRevealedCount(index + 1) })
  }

  const playCorrection = () => {
    setShowingWrongNote(false)
    setAwaitingCorrection(false)
    setHint("…and here's how it really goes.")
    player.play('result', song.melody)
  }

  /** Cuts the result playback short and jumps to the finished, corrected staff. */
  const stopResult = () => {
    window.clearTimeout(correctionTimer.current)
    player.stop()
    if (showingWrongNote || awaitingCorrection) {
      setShowingWrongNote(false)
      setAwaitingCorrection(false)
      setHint("…and here's how it really goes.")
    }
    setRevealedCount(song.melody.length)
  }

  const pressKey = (midi: number) => {
    audioEngine.playNote(midi)
    if (isOver) return
    setSelectedMidi(midi)
    if (tutorialStep === 'keys') setTutorialStep('lock')
  }

  const tryIt = () => {
    if (selectedMidi === null) return setHint('Tap a piano key first, then try it in the melody.')
    if (triesLeft === 0) return setHint('No tries left. Trust your ear and lock in an answer.')
    const remaining = triesLeft - 1
    setTriesLeft(remaining)
    setHint(remaining === 0 ? 'That was your last try.' : `Tries left: ${remaining}`)
    player.play('try', withGuess(song.melody, song.missingIndex, selectedMidi))
  }

  const lockIn = () => {
    if (selectedMidi === null) return setHint('Pick a piano key before you lock in.')
    if (tutorialStep) {
      setTutorialStep('done')
      markTutorialSeen()
    }
    if (selectedMidi === answer) {
      setStatus('found')
      setHint('You found it!')
      onSolved()
      playComplete()
      return
    }
    setStatus('missed')
    setShowingWrongNote(true)
    setAwaitingCorrection(true)
    setHint("Not quite. Here's how your note sounds…")
    setRevealedCount(0)
    player.play('result', withGuess(song.melody, song.missingIndex, selectedMidi), {
      onNote: (index) => setRevealedCount(index + 1),
      onComplete: () => {
        correctionTimer.current = window.setTimeout(playCorrection, CORRECTION_PAUSE_MS)
      },
    })
  }

  const skipTutorial = () => {
    setTutorialStep(null)
    markTutorialSeen()
  }

  /** Class that makes a control pulse while the tutorial is pointing at it. */
  const coached = (step: TutorialStep) => (tutorialStep === step ? 'is-coached' : '')

  // Space acts on the melody, unless a button has focus (it handles Space itself).
  // The player stops any sound when the round closes.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' || event.target instanceof HTMLButtonElement) return
      event.preventDefault()
      onSpace()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(correctionTimer.current)
    }
  }, [])

  return (
    <section className="round" aria-labelledby="round-title">
      <button type="button" className="round-back" onClick={onBack}>
        ← Songs
      </button>
      <header className="round-header">
        <h2 id="round-title">{song.title}</h2>
        <p className="round-genre">{song.genre}</p>
      </header>

      <Staff
        notes={
          showingWrongNote && selectedMidi !== null
            ? withGuess(song.melody, song.missingIndex, selectedMidi)
            : song.melody
        }
        beatsPerBar={song.beatsPerBar}
        pickupBeats={song.pickupBeats}
        beamBeats={song.compound ? 1.5 : undefined}
        gapIndex={song.missingIndex}
        revealedCount={revealedCount}
        showAnswer={isOver}
        answerTone={resultTone}
        activeIndex={player.activeIndex}
      />

      {/* While coaching, the generic hint would repeat the tutorial, so only show real messages. */}
      {!(tutorialStep && hint === DEFAULT_HINT) && (
        <p className={`round-hint${isOver ? ` is-${resultTone}` : ''}`} role="status">
          {hint}
        </p>
      )}

      {tutorialStep && (
        <div className="round-coach" role="note">
          <p>{TUTORIAL_TEXT[tutorialStep]}</p>
          {tutorialStep !== 'done' && (
            <button type="button" className="round-coach-skip" onClick={skipTutorial}>
              Skip tutorial
            </button>
          )}
        </div>
      )}

      {isOver ? (
        <div className="round-controls">
          <button type="button" onClick={playComplete} disabled={resultPlaying}>
            Play the whole song
          </button>
          {resultPlaying && (
            <button type="button" onClick={stopResult}>
              Skip
            </button>
          )}
          <span className="round-spacer" />
          {/* Leaving unmounts the round, which stops any playback. */}
          <button type="button" className="round-next" onClick={onNext ?? onBack}>
            {onNext ? 'Next song →' : 'Back to songs'}
          </button>
        </div>
      ) : (
        <div className="round-controls">
          {guessPlaying ? (
            <button type="button" onClick={player.pause}>
              ⏸ Pause <PlayingBars />
            </button>
          ) : player.paused ? (
            <>
              <button type="button" onClick={() => player.resume()}>
                {player.paused === 'try' ? '▶ Resume try' : '▶ Resume'}
              </button>
              <button type="button" onClick={() => player.resume(true)}>
                {player.paused === 'try' ? '⟲ Restart try' : '⟲ From the start'}
              </button>
            </>
          ) : (
            <button type="button" className={coached('play')} onClick={playWithGap}>
              ▶ Play
            </button>
          )}
          {MAX_TRIES > 0 && (
            <>
              <button type="button" onClick={tryIt}>
                Try it
              </button>
              <span className="round-tries" aria-label={`${triesLeft} of ${MAX_TRIES} tries left`}>
                {Array.from({ length: MAX_TRIES }, (_, i) => (
                  <span key={i} className={i < triesLeft ? 'is-left' : ''} />
                ))}
              </span>
            </>
          )}
          <span className="round-spacer" />
          <button type="button" className={`round-lock ${coached('lock')}`} onClick={lockIn}>
            Lock in
          </button>
        </div>
      )}

      <div className={`round-piano ${coached('keys')}`}>
        <Piano
          startMidi={pianoStartMidi(song)}
          flats={usesFlats(song.melody)}
          selectedMidi={isOver && !showingWrongNote ? answer : selectedMidi}
          selectedTone={isOver ? resultTone : 'selected'}
          // Lighting keys while guessing would give the answer away, so only show it in the result.
          playingMidi={isOver ? playingMidi : null}
          showShortcuts={showShortcuts}
          onPress={pressKey}
        />
      </div>
      <details
        className="round-shortcuts"
        open={showShortcuts}
        onToggle={(event) => {
          const open = event.currentTarget.open
          setShowShortcuts(open)
          writeFlag(SHORTCUTS_KEY, open)
        }}
      >
        <summary>Keyboard shortcuts</summary>
        <ul>
          <li>Press the letter shown on a piano key to play it.</li>
          <li>
            <kbd>Space</kbd> plays, pauses and resumes the melody.
          </li>
        </ul>
      </details>
    </section>
  )
}
