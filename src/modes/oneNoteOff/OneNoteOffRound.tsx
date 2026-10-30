import { useEffect, useEffectEvent, useState } from 'react'
import { audioEngine } from '../../audio/engine'
import { useMelodyPlayer } from '../../audio/useMelodyPlayer'
import { Piano } from '../../components/Piano'
import { SettingsMenu } from '../../components/SettingsMenu'
import { Staff, type NoteMark } from '../../components/Staff'
import { pickChange, withChange } from '../../game/oneNoteOff'
import { pianoStartMidi } from '../../game/puzzle'
import type { Settings } from '../../game/settings'
import { midiToName } from '../../music/notation'
import type { Song } from '../../songs/types'
import '../round.css'

type Status = 'guessing' | 'found' | 'missed'
type Version = 'original' | 'changed'

const VERSION_LABELS: Record<Version, string> = { original: 'Original', changed: 'Changed' }

interface OneNoteOffRoundProps {
  song: Song
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  onBack: () => void
  /** Goes to the next song, or null when this is the last one in the list. */
  onNext: (() => void) | null
}

/** One One Note Off puzzle: compare two versions, tap the note that changed, lock in once. */
export function OneNoteOffRound({ song, settings, onSettingsChange, onBack, onNext }: OneNoteOffRoundProps) {
  // Settings as they were when the song opened. Only highlighting can change during a song;
  // the others shape how the puzzle is set up and apply from the next one.
  const [startSettings] = useState(settings)
  // A new random change every time the round opens.
  const [change] = useState(() => pickChange(song, { inKey: startSettings.oneNoteOffInKey }))
  const [status, setStatus] = useState<Status>('guessing')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [revealedCount, setRevealedCount] = useState(0)
  const [hint, setHint] = useState(
    startSettings.oneNoteOffOneListen
      ? 'One note in the changed version is off. You can hear the original only once, and the changed version as often as you like. Tap the note that sounds different, then lock in.'
      : 'One note in the changed version is off. Compare the two as often as you like, tap the note that sounds different, then lock in.',
  )
  // With the one-listen setting, the original can be heard once while guessing
  // (pausing and resuming is fine).
  const [originalHeard, setOriginalHeard] = useState(false)
  const player = useMelodyPlayer<Version>(song.bpm)

  const changedMelody = withChange(song.melody, change)
  const originalMidi = song.melody[change.index].midi as number
  const isOver = status !== 'guessing'
  const resultPlaying = isOver && player.playing !== null
  const melodyFor = (version: Version) => (version === 'original' ? song.melody : changedMelody)
  const playingMidi =
    player.playingNotes && player.activeIndex !== null ? player.playingNotes[player.activeIndex]?.midi ?? null : null

  const toggle = (version: Version) => {
    if (player.playing === version) return player.pause()
    if (player.paused === version) return player.resume()
    if (version === 'original' && !isOver && startSettings.oneNoteOffOneListen) {
      if (originalHeard) return
      setOriginalHeard(true)
    }
    player.play(version, melodyFor(version))
  }

  const lockIn = () => {
    if (selectedIndex === null) return setHint('Tap the note on the staff that sounds different first.')
    const found = selectedIndex === change.index
    const swap = `${midiToName(originalMidi)} was played as ${midiToName(change.midi)}`
    setStatus(found ? 'found' : 'missed')
    setHint(found ? `You found it! That ${swap}.` : `Not quite. The green note was the changed one: its ${swap}.`)
    revealOriginal()
  }

  const revealOriginal = () => {
    setRevealedCount(0)
    player.play('original', song.melody, { onNote: (index) => setRevealedCount(index + 1) })
  }

  const skipReveal = () => {
    player.stop()
    setRevealedCount(song.melody.length)
  }

  // Space plays, pauses and resumes the changed version while guessing.
  const onSpace = useEffectEvent(() => {
    if (!isOver) toggle(player.paused ?? 'changed')
  })
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' || event.target instanceof HTMLButtonElement || event.target instanceof SVGElement) return
      event.preventDefault()
      onSpace()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const marks: Partial<Record<number, NoteMark>> = isOver
    ? { ...(status === 'missed' && selectedIndex !== null ? { [selectedIndex]: 'missed' as const } : {}), [change.index]: 'found' }
    : selectedIndex !== null
      ? { [selectedIndex]: 'selected' }
      : {}

  const versionButton = (version: Version) => {
    if (player.playing === version) {
      return (
        <button type="button" onClick={player.pause}>
          ⏸ Pause
        </button>
      )
    }
    // Restarting the original would be a second listen, so it only offers Resume.
    const limited = version === 'original' && !isOver && startSettings.oneNoteOffOneListen
    if (player.paused === version) {
      return (
        <>
          <button type="button" onClick={() => player.resume()}>
            ▶ Resume {VERSION_LABELS[version].toLowerCase()}
          </button>
          {!limited && (
            <button type="button" onClick={() => player.resume(true)}>
              ⟲ From the start
            </button>
          )}
        </>
      )
    }
    if (limited && originalHeard) {
      return (
        <button type="button" disabled>
          Original heard
        </button>
      )
    }
    if (limited) {
      return (
        <button type="button" onClick={() => toggle(version)}>
          ▶ Original (one listen)
        </button>
      )
    }
    return (
      <button type="button" onClick={() => toggle(version)} disabled={resultPlaying}>
        ▶ {VERSION_LABELS[version]}
      </button>
    )
  }

  return (
    <section className="round" aria-labelledby="round-title">
      <button type="button" className="round-back" onClick={onBack}>
        ← Songs
      </button>
      <header className="round-header">
        <h2 id="round-title">{song.title}</h2>
        <div className="round-header-side">
          <p className="round-genre">{song.genre}</p>
          <SettingsMenu mode="one-note-off" settings={settings} onChange={onSettingsChange} inRound />
        </div>
      </header>

      <Staff
        notes={song.melody}
        beatsPerBar={song.beatsPerBar}
        pickupBeats={song.pickupBeats}
        revealedCount={revealedCount}
        showAnswer={isOver}
        activeIndex={isOver || settings.oneNoteOffHighlight ? player.activeIndex : null}
        marks={marks}
        onNoteSelect={isOver ? undefined : setSelectedIndex}
      />

      <p className={`round-hint${isOver ? ` is-${status}` : ''}`} role="status">
        {hint}
      </p>

      <div className="round-controls">
        {isOver ? (
          <>
            {versionButton('original')}
            {versionButton('changed')}
            {resultPlaying && (
              <button type="button" onClick={skipReveal}>
                Skip
              </button>
            )}
            <span className="round-spacer" />
            {/* Leaving unmounts the round, which stops any playback. */}
            <button type="button" className="round-next" onClick={onNext ?? onBack}>
              {onNext ? 'Next song →' : 'Back to songs'}
            </button>
          </>
        ) : (
          <>
            {versionButton('original')}
            {versionButton('changed')}
            <span className="round-spacer" />
            <button type="button" className="round-lock" onClick={lockIn}>
              Lock in
            </button>
          </>
        )}
      </div>

      <div className="round-piano">
        <Piano
          startMidi={pianoStartMidi(song)}
          selectedMidi={null}
          // Lighting keys while guessing would point at the changed note, so only show it in the result.
          playingMidi={isOver ? playingMidi : null}
          onPress={(midi) => audioEngine.playNote(midi)}
        />
      </div>
    </section>
  )
}
