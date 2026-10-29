import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { audioEngine } from '../../audio/engine'
import { Piano } from '../../components/Piano'
import { Staff } from '../../components/Staff'
import { MAX_TRIES, answerMidi, pianoStartMidi, withGap, withGuess } from '../../game/puzzle'
import { hasSeenTutorial, markTutorialSeen } from '../../game/tutorial'
import type { Note } from '../../music/notation'
import type { Song } from '../../songs/types'
import './MissingNoteRound.css'

type Status = 'guessing' | 'found' | 'missed'

// Pause between hearing a wrong answer and hearing the right one.
const CORRECTION_PAUSE_MS = 700

const DEFAULT_HINT = 'Listen to the melody, then find the missing note on the piano.'

// First-time players are walked through one round, one step at a time.
type TutorialStep = 'play' | 'keys' | 'lock' | 'done'

const TUTORIAL_TEXT: Record<TutorialStep, string> = {
  play: 'Press ▶ Play to hear the melody. The dashed box on the staff is the missing note.',
  keys: 'Tap the piano keys, or type the letters shown on them, to hear notes. Look for the one that fills the gap, and replay the melody as often as you like.',
  lock: "Found it? Make sure that key is selected, then press Lock in. You only get one answer, so take your time.",
  done: "That's the game! The notes slide to their real spots as the song plays. Pick another song whenever you're ready.",
}

interface MissingNoteRoundProps {
  song: Song
  onBack: () => void
  /** Goes to the next song, or null when this is the last one in the list. */
  onNext: (() => void) | null
}

/** One Missing Note puzzle: listen, test keys, use up to three tries, lock in one answer. */
export function MissingNoteRound({ song, onBack, onNext }: MissingNoteRoundProps) {
  const [status, setStatus] = useState<Status>('guessing')
  const [selectedMidi, setSelectedMidi] = useState<number | null>(null)
  const [triesLeft, setTriesLeft] = useState(MAX_TRIES)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [revealedCount, setRevealedCount] = useState(0)
  const [hint, setHint] = useState(DEFAULT_HINT)
  const [tutorialStep, setTutorialStep] = useState<TutorialStep | null>(() => (hasSeenTutorial() ? null : 'play'))
  // After a miss, the player's wrong note is shown and played first, then the right one.
  const [showingWrongNote, setShowingWrongNote] = useState(false)
  const [awaitingCorrection, setAwaitingCorrection] = useState(false)
  const correctionTimer = useRef(0)
  // The melody currently sounding, so the piano can light up each note as it plays.
  const [playingNotes, setPlayingNotes] = useState<Note[] | null>(null)
  const [playingTry, setPlayingTry] = useState(false)
  // A melody paused while guessing. A paused try keeps its own note, so resuming it
  // can't be used to test a different key for free.
  const [paused, setPaused] = useState<{ notes: Note[]; index: number; isTry: boolean } | null>(null)

  const answer = answerMidi(song)
  const isOver = status !== 'guessing'
  // Once the round is over, the piano and message follow what's on the staff:
  // orange while the wrong note plays, green once the right note is shown.
  const resultTone = showingWrongNote ? 'missed' : 'found'
  const resultPlaying = isOver && (playingNotes !== null || awaitingCorrection)
  const playingMidi = playingNotes && activeIndex !== null ? playingNotes[activeIndex]?.midi ?? null : null
  const guessPlaying = !isOver && playingNotes !== null

  const play = (
    notes: Note[],
    { reveal = false, startIndex = 0, onComplete }: { reveal?: boolean; startIndex?: number; onComplete?: () => void } = {},
  ) => {
    // Starting a melody stops the previous one, whose onEnd clears state; set ours afterwards.
    audioEngine.playMelody(notes, {
      bpm: song.bpm,
      startIndex,
      onNote: (index) => {
        setActiveIndex(index)
        if (reveal) setRevealedCount(index + 1)
      },
      onEnd: (completed) => {
        setActiveIndex(null)
        setPlayingNotes(null)
        if (completed) onComplete?.()
      },
    })
    setPlayingNotes(notes)
  }

  const playWithGap = () => {
    if (tutorialStep === 'play') setTutorialStep('keys')
    setPaused(null)
    setPlayingTry(false)
    play(withGap(song.melody, song.missingIndex))
  }

  const pause = () => {
    if (!playingNotes) return
    const index = activeIndex ?? 0
    audioEngine.stop()
    setPaused({ notes: playingNotes, index, isTry: playingTry })
    // Keep the highlight on the note where playback stopped.
    setActiveIndex(index)
  }

  const resume = (fromStart = false) => {
    if (!paused) return
    setPaused(null)
    setPlayingTry(paused.isTry)
    play(paused.notes, { startIndex: fromStart ? 0 : paused.index })
  }

  // Space plays, pauses and resumes while guessing.
  const onSpace = useEffectEvent(() => {
    if (isOver) return
    if (guessPlaying) pause()
    else if (paused) resume()
    else playWithGap()
  })

  const playComplete = () => {
    window.clearTimeout(correctionTimer.current)
    setShowingWrongNote(false)
    setRevealedCount(0)
    play(song.melody, { reveal: true })
  }

  const playCorrection = () => {
    setShowingWrongNote(false)
    setAwaitingCorrection(false)
    setHint("…and here's how it really goes.")
    play(song.melody)
  }

  /** Cuts the result playback short and jumps to the finished, corrected staff. */
  const stopResult = () => {
    window.clearTimeout(correctionTimer.current)
    audioEngine.stop()
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
    setPaused(null)
    setPlayingTry(true)
    play(withGuess(song.melody, song.missingIndex, selectedMidi))
  }

  const lockIn = () => {
    if (selectedMidi === null) return setHint('Pick a piano key before you lock in.')
    setPaused(null)
    if (tutorialStep) {
      setTutorialStep('done')
      markTutorialSeen()
    }
    if (selectedMidi === answer) {
      setStatus('found')
      setHint('You found it!')
      playComplete()
      return
    }
    setStatus('missed')
    setShowingWrongNote(true)
    setAwaitingCorrection(true)
    setHint("Not quite. Here's how your note sounds…")
    setRevealedCount(0)
    play(withGuess(song.melody, song.missingIndex, selectedMidi), {
      reveal: true,
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
      audioEngine.stop()
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
        gapIndex={song.missingIndex}
        revealedCount={revealedCount}
        showAnswer={isOver}
        answerTone={resultTone}
        activeIndex={activeIndex}
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
            <button type="button" onClick={pause}>
              ⏸ Pause
            </button>
          ) : paused ? (
            <>
              <button type="button" onClick={() => resume()}>
                {paused.isTry ? '▶ Resume try' : '▶ Resume'}
              </button>
              <button type="button" onClick={() => resume(true)}>
                {paused.isTry ? '⟲ Restart try' : '⟲ From the start'}
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
          selectedMidi={isOver && !showingWrongNote ? answer : selectedMidi}
          selectedTone={isOver ? resultTone : 'selected'}
          // Lighting keys while guessing would give the answer away, so only show it in the result.
          playingMidi={isOver ? playingMidi : null}
          onPress={pressKey}
        />
      </div>
      <p className="round-shortcuts">
        Keyboard: press the letter on a key to play it
        {!isOver && (
          <>
            {' · '}
            <kbd>Space</kbd> plays and pauses the melody
          </>
        )}
      </p>
    </section>
  )
}
