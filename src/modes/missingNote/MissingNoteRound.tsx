import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { audioEngine } from '../../audio/engine'
import { Piano } from '../../components/Piano'
import { Staff } from '../../components/Staff'
import { MAX_TRIES, answerMidi, pianoStartMidi, withGap, withGuess } from '../../game/puzzle'
import type { Note } from '../../music/notation'
import type { Song } from '../../songs/types'
import './MissingNoteRound.css'

type Status = 'guessing' | 'found' | 'missed'

// Pause between hearing a wrong answer and hearing the right one.
const CORRECTION_PAUSE_MS = 700

interface MissingNoteRoundProps {
  song: Song
  onRestart: () => void
}

/** One Missing Note puzzle: listen, test keys, use up to three tries, lock in one answer. */
export function MissingNoteRound({ song, onRestart }: MissingNoteRoundProps) {
  const [status, setStatus] = useState<Status>('guessing')
  const [selectedMidi, setSelectedMidi] = useState<number | null>(null)
  const [triesLeft, setTriesLeft] = useState(MAX_TRIES)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [revealedCount, setRevealedCount] = useState(0)
  const [hint, setHint] = useState('Listen to the melody, then find the missing note on the piano.')
  // After a miss, the player's wrong note is shown and played first, then the right one.
  const [showingWrongNote, setShowingWrongNote] = useState(false)
  const correctionTimer = useRef(0)

  const answer = answerMidi(song)
  const isOver = status !== 'guessing'

  const play = (notes: Note[], { reveal = false, onComplete }: { reveal?: boolean; onComplete?: () => void } = {}) => {
    audioEngine.playMelody(notes, {
      bpm: song.bpm,
      onNote: (index) => {
        setActiveIndex(index)
        if (reveal) setRevealedCount(index + 1)
      },
      onEnd: (completed) => {
        setActiveIndex(null)
        if (completed) onComplete?.()
      },
    })
  }

  const playWithGap = () => play(withGap(song.melody, song.missingIndex))
  const onSpace = useEffectEvent(playWithGap)

  const playComplete = () => {
    window.clearTimeout(correctionTimer.current)
    setShowingWrongNote(false)
    setRevealedCount(0)
    play(song.melody, { reveal: true })
  }

  const playCorrection = () => {
    setShowingWrongNote(false)
    setHint("…and here's how it really goes.")
    play(song.melody)
  }

  const pressKey = (midi: number) => {
    audioEngine.playNote(midi)
    if (!isOver) setSelectedMidi(midi)
  }

  const tryIt = () => {
    if (selectedMidi === null) return setHint('Tap a piano key first, then try it in the melody.')
    if (triesLeft === 0) return setHint('No tries left. Trust your ear and lock in an answer.')
    const remaining = triesLeft - 1
    setTriesLeft(remaining)
    setHint(remaining === 0 ? 'That was your last try.' : `Tries left: ${remaining}`)
    play(withGuess(song.melody, song.missingIndex, selectedMidi))
  }

  const lockIn = () => {
    if (selectedMidi === null) return setHint('Pick a piano key before you lock in.')
    if (selectedMidi === answer) {
      setStatus('found')
      setHint('You found it!')
      playComplete()
      return
    }
    setStatus('missed')
    setShowingWrongNote(true)
    setHint("Not quite. Here's how your note sounds…")
    setRevealedCount(0)
    play(withGuess(song.melody, song.missingIndex, selectedMidi), {
      reveal: true,
      onComplete: () => {
        correctionTimer.current = window.setTimeout(playCorrection, CORRECTION_PAUSE_MS)
      },
    })
  }

  // Space replays the melody, unless a button has focus (it handles Space itself).
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
        gapIndex={song.missingIndex}
        revealedCount={revealedCount}
        showAnswer={isOver}
        answerTone={showingWrongNote ? 'missed' : 'found'}
        activeIndex={activeIndex}
      />

      <p className={`round-hint is-${status}`} role="status">
        {hint}
      </p>

      {isOver ? (
        <div className="round-controls">
          <button type="button" onClick={playComplete}>
            Play the whole song
          </button>
          <button type="button" onClick={onRestart}>
            Play this puzzle again
          </button>
        </div>
      ) : (
        <div className="round-controls">
          <button type="button" onClick={playWithGap}>
            Play
          </button>
          <button type="button" onClick={tryIt}>
            Try it
          </button>
          <span className="round-tries" aria-label={`${triesLeft} of ${MAX_TRIES} tries left`}>
            {Array.from({ length: MAX_TRIES }, (_, i) => (
              <span key={i} className={i < triesLeft ? 'is-left' : ''} />
            ))}
          </span>
          <span className="round-spacer" />
          <button type="button" className="round-lock" onClick={lockIn}>
            Lock in
          </button>
        </div>
      )}

      <Piano startMidi={pianoStartMidi(song)} selectedMidi={selectedMidi} onPress={pressKey} />
    </section>
  )
}
