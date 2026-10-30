import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import { midiInput } from '../../audio/midi'
import { useMelodyPlayer } from '../../audio/useMelodyPlayer'
import { Piano } from '../../components/Piano'
import { RoundNavigation } from '../../components/RoundNavigation'
import { Icon } from '../../components/Icon'
import { PlayingBars } from '../../components/PlayingBars'
import { SettingsMenu } from '../../components/SettingsMenu'
import { Staff, type NoteMark } from '../../components/Staff'
import { pickChange, withChange } from '../../game/oneNoteOff'
import { pianoStartMidi } from '../../game/puzzle'
import type { Settings } from '../../game/settings'
import { midiToName, usesFlats } from '../../music/notation'
import type { Song } from '../../songs/types'
import '../round.css'
import './OneNoteOffRound.css'

type Status = 'guessing' | 'found' | 'missed'
type Version = 'original' | 'changed'

const VERSIONS: Record<Version, string> = { changed: 'Changed', original: 'Original' }

interface OneNoteOffRoundProps {
  song: Song
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  /** Starts this song over with the current settings. */
  onRestart: () => void
  onBack: () => void
  /** Goes to the next song, or null when this is the last one in the list. */
  onNext: (() => void) | null
  /** Called when the player spots the changed note. */
  onSolved: () => void
}

/** One One Note Off puzzle: compare two versions, tap the note that changed, lock in once. */
export function OneNoteOffRound({
  song,
  settings,
  onSettingsChange,
  onRestart,
  onBack,
  onNext,
  onSolved,
}: OneNoteOffRoundProps) {
  // Hard mode shapes how the puzzle is set up, so the song keeps the setting it opened with;
  // a change made mid-song applies from the next one. Highlighting applies right away.
  const [hard] = useState(settings.oneNoteOffHard)
  // A new random change every time the round opens.
  const [change] = useState(() => pickChange(song, { difficulty: hard ? 'hard' : 'easy' }))
  const [status, setStatus] = useState<Status>('guessing')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [revealedCount, setRevealedCount] = useState(0)
  // Null shows the instructions.
  const [hint, setHint] = useState<string | null>(null)
  // On Hard, the original can be heard only once while guessing.
  const oneListen = hard
  const instructions = oneListen
    ? 'One note in the changed version is off. You can hear the original only once, and the changed version as often as you like. Tap the note that sounds different, then lock in.'
    : 'One note in the changed version is off. Compare the two as often as you like, tap the note that sounds different, then lock in.'
  // Pausing and resuming the original still counts as one listen.
  const [originalHeard, setOriginalHeard] = useState(false)
  // The reveal plays the changed version first (odd note in orange), then the original.
  const [showingChanged, setShowingChanged] = useState(false)
  const [awaitingOriginal, setAwaitingOriginal] = useState(false)
  const originalTimer = useRef(0)
  const player = useMelodyPlayer<Version>(song.bpm)
  const originalLimitId = useId()

  const changedMelody = withChange(song.melody, change)
  const originalMidi = song.melody[change.index].midi as number
  const isOver = status !== 'guessing'
  const resultPlaying = isOver && (player.playing !== null || awaitingOriginal)
  const melodyFor = (version: Version) => (version === 'original' ? song.melody : changedMelody)
  const playingMidi =
    player.playingNotes && player.activeIndex !== null ? player.playingNotes[player.activeIndex]?.midi ?? null : null

  const toggle = (version: Version) => {
    if (player.playing === version) return player.pause()
    if (player.paused === version) return player.resume()
    if (version === 'original' && !isOver) {
      if (oneListen && originalHeard) return
      setOriginalHeard(true)
    }
    player.play(version, melodyFor(version))
  }

  const flats = usesFlats(song.melody)
  const originalName = midiToName(originalMidi, flats)
  const changedName = midiToName(change.midi, flats)
  const originalBackHint = `…and here's the original, with the ${originalName} back in place (green).`

  const lockIn = () => {
    if (selectedIndex === null) return setHint('Tap the note on the staff that sounds different first.')
    const found = selectedIndex === change.index
    setStatus(found ? 'found' : 'missed')
    if (found) onSolved()
    setHint(
      found
        ? `You found it! Here's the changed version: the orange note played ${changedName} instead of ${originalName}…`
        : `Not quite (your pick is in purple). Here's the changed version: the orange note played ${changedName} instead of ${originalName}…`,
    )
    // First the changed version, with its notes sliding to their real spots…
    setShowingChanged(true)
    setAwaitingOriginal(true)
    setRevealedCount(0)
    player.play('changed', changedMelody, {
      onNote: (index) => setRevealedCount(index + 1),
      onComplete: () => {
        originalTimer.current = window.setTimeout(playOriginalBack, 700)
      },
    })
  }

  // …then the original, with the changed note back at its real pitch.
  const playOriginalBack = () => {
    setShowingChanged(false)
    setAwaitingOriginal(false)
    setHint(originalBackHint)
    player.play('original', song.melody)
  }

  const skipReveal = () => {
    window.clearTimeout(originalTimer.current)
    player.stop()
    setShowingChanged(false)
    setAwaitingOriginal(false)
    setHint(originalBackHint)
    setRevealedCount(song.melody.length)
  }

  // Space plays, pauses and resumes the changed version while guessing.
  const onSpace = useEffectEvent(() => {
    if (!isOver) toggle(player.paused ?? 'changed')
  })
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' || (event.target instanceof Element && event.target.closest('button, input, select, textarea, summary, a, [role="button"]'))) return
      event.preventDefault()
      onSpace()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(originalTimer.current)
    }
  }, [])

  // While guessing, the pick is purple. In the result, the changed note is orange at its
  // wrong pitch, then green at its real one; a wrong pick stays purple.
  const marks: Partial<Record<number, NoteMark>> = {}
  if (selectedIndex !== null && (!isOver || selectedIndex !== change.index)) marks[selectedIndex] = 'selected'
  if (isOver) marks[change.index] = showingChanged ? 'missed' : 'found'

  // Both versions stay directly playable; the filled segment follows playback and pause.
  const versionButton = (version: Version) => {
    const playing = player.playing === version
    const paused = player.paused === version
    // On Hard, restarting the original would be a second listen, so it only offers Resume.
    const limited = version === 'original' && !isOver && oneListen
    const used = limited && originalHeard && !playing && !paused
    const action = playing ? 'Pause' : paused ? 'Resume' : 'Play'
    return (
        <button
          type="button"
          className={`version-button is-${version}`}
          aria-pressed={playing || paused}
          aria-label={`${action} ${version} melody`}
          aria-describedby={limited ? originalLimitId : undefined}
          onClick={playing ? player.pause : paused ? () => player.resume() : () => toggle(version)}
          disabled={used || (resultPlaying && !playing && !paused)}
        >
          <Icon name={playing ? 'pause' : 'play'} />
          {VERSIONS[version]}
          {playing && <PlayingBars />}
        </button>
    )
  }

  const nowPlaying = player.playing ?? player.paused
  const comparisonControls = (
    <div className="melody-comparison">
      <div className="comparison-status">
        <p className="comparison-now-playing" role="status">
          {nowPlaying
            ? `${player.playing ? 'Now playing' : 'Paused'}: ${nowPlaying} melody`
            : 'Compare versions'}
        </p>
        {oneListen && !isOver && (
          <span id={originalLimitId} className="comparison-limit">
            Original: {originalHeard && nowPlaying !== 'original' ? 'already heard' : 'one listen only'}
          </span>
        )}
      </div>
      <div className="comparison-playback">
        <div className="comparison-strip" role="group" aria-label="Compare versions">
          {versionButton('changed')}
          {versionButton('original')}
        </div>
        {player.paused && !(player.paused === 'original' && !isOver && oneListen) && (
          <button type="button" onClick={() => player.resume(true)}>
            <Icon name="restart" /> Restart
          </button>
        )}
      </div>
    </div>
  )

  return (
    <section className="round is-one-note-off" aria-labelledby="round-title">
      <RoundNavigation onBack={onBack}>
        <SettingsMenu mode="one-note-off" settings={settings} onChange={onSettingsChange} inRound />
      </RoundNavigation>
      <p className="round-mode">One Note Off</p>
      <header className="round-header">
        <h2 id="round-title" tabIndex={-1}>{song.title}</h2>
        <div className="round-header-side">
          <p className="round-genre">{song.genre}</p>
        </div>
      </header>

      {/* Hard mode can't change partway through a song, so say so plainly and offer a restart. */}
      {settings.oneNoteOffHard !== hard && (
        <div className="round-pending" role="status">
          <span className="round-pending-icon" aria-hidden="true">
            <Icon name="restart" />
          </span>
          <p>
            <strong>{settings.oneNoteOffHard ? 'Hard mode' : 'Easy mode'} starts on the next song.</strong> This song
            stays on {hard ? 'Hard' : 'Easy'}.
          </p>
          <button type="button" onClick={onRestart}>
            Restart this song in {settings.oneNoteOffHard ? 'Hard' : 'Easy'} mode
          </button>
        </div>
      )}

      <Staff
        notes={showingChanged ? changedMelody : song.melody}
        beatsPerBar={song.beatsPerBar}
        pickupBeats={song.pickupBeats}
        beamBeats={song.compound ? 1.5 : undefined}
        revealedCount={revealedCount}
        showAnswer={isOver}
        activeIndex={isOver || settings.oneNoteOffHighlight ? player.activeIndex : null}
        marks={marks}
        onNoteSelect={isOver ? undefined : setSelectedIndex}
      />

      <p className={`round-hint${isOver ? ` is-${status}` : ''}`} role="status">
        {hint ?? instructions}
      </p>

      <div className="round-controls">
        {comparisonControls}
        {isOver ? (
          <>
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
          flats={flats}
          selectedMidi={null}
          // Lighting keys while guessing would point at the changed note, so only show it in the result.
          playingMidi={isOver ? playingMidi : null}
          // lettersAnywhere={settings.lettersAnywhere}
          onPress={(midi, fromMidi) => midiInput.playKey(midi, fromMidi)}
        />
      </div>
    </section>
  )
}
