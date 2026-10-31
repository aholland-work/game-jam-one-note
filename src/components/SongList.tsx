import { useState } from 'react'
import { ECHO_LEVELS } from '../game/echoNote'
import { pickRandomSong } from '../game/progress'
import type { GameMode, Settings } from '../game/settings'
import { readFlag, writeFlag } from '../game/storage'
import { hasSeenTutorial } from '../game/tutorial'
import type { Genre, Song } from '../songs/types'
import { Icon } from './Icon'
import { ModeMark } from './ModeMark'
import { SettingsMenu } from './SettingsMenu'
import './SongList.css'

const MODES: { id: GameMode; label: string; blurb: string }[] = [
  { id: 'missing-note', label: 'Missing Note', blurb: 'One note is missing. Find it on the piano.' },
  { id: 'one-note-off', label: 'One Note Off', blurb: 'One note has changed. Spot which one.' },
  { id: 'echo-note', label: 'Echo Note', blurb: 'Ear training: hear a chord, then find one note on the piano.' },
]

const ECHO_KEY_CHOICES = [
  { id: 'c', label: 'C major', about: 'Always C major, so each number stays on the same piano key. Best to start with.' },
  {
    id: 'random',
    label: 'New key every note',
    about: 'Every mystery note comes in a different key, so listen to each chord for the new 1. Harder, and closer to playing with a band.',
  },
] as const

const ECHO_LENGTH_CHOICES = [
  { id: 'round', label: 'Set of 5', about: '5 mystery notes, then your results. Get 4 or more right to unlock the next notes.' },
  {
    id: 'endless',
    label: 'Free practice',
    about: 'No score to hit: notes keep coming until you press Finish, then you see how each number went.',
  },
] as const

interface SongListProps {
  mode: GameMode
  onModeChange: (mode: GameMode) => void
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  songs: Song[]
  /** Songs already solved in the current mode. */
  solvedIds: string[]
  genre: Genre | null
  onGenreChange: (genre: Genre | null) => void
  onSelect: (song: Song) => void
  /** Starts an Echo Note round, which doesn't use songs. */
  onStartEcho: () => void
}

/** Song cards with a genre filter. `genre` null means all genres. */
export function SongList({
  mode,
  onModeChange,
  settings,
  onSettingsChange,
  songs,
  solvedIds,
  genre,
  onGenreChange,
  onSelect,
  onStartEcho,
}: SongListProps) {
  const genres = [...new Set(songs.map((song) => song.genre))]
  const visible = genre === null ? songs : songs.filter((song) => song.genre === genre)
  const solvedCount = visible.filter((song) => solvedIds.includes(song.id)).length
  const playRandom = () => {
    const song = pickRandomSong(visible, solvedIds)
    if (song) onSelect(song)
  }

  return (
    <section className="song-list" aria-labelledby="song-list-title">
      <div className="song-list-hero" aria-hidden="true">
        <div>
          <p className="song-list-wordmark">ONE<span>NOTE.</span></p>
        </div>
        <div className="piano-sculpture">
          {Array.from({ length: 7 }, (_, i) => <i key={i} className="piano-sculpture-key" />)}
        </div>
      </div>
      <div className="song-list-modes" role="group" aria-label="Game mode">
        {MODES.map((option, index) => (
          <button
            key={option.id}
            type="button"
            className="song-list-mode"
            aria-pressed={mode === option.id}
            onClick={() => onModeChange(option.id)}
          >
            <span className="song-list-mode-mark" aria-hidden="true">
              <span>0{index + 1}</span><ModeMark mode={option.id} />
            </span>
            <span className="song-list-mode-label">{option.label}</span>
            <span className="song-list-mode-blurb">{option.blurb}</span>
          </button>
        ))}
      </div>
      {mode === 'echo-note' ? (
        <EchoStart settings={settings} onSettingsChange={onSettingsChange} onStart={onStartEcho} />
      ) : (
        <>
          <div className="song-list-heading">
            <h2 id="song-list-title" tabIndex={-1}>Pick a song</h2>
            <SettingsMenu mode={mode} settings={settings} onChange={onSettingsChange} />
          </div>
          {mode === 'missing-note' && !hasSeenTutorial() && (
            <p className="song-list-tip">
              New here? Each melody is missing one note, and your first song walks you through finding it.
              Twinkle, Twinkle is a gentle place to start.
            </p>
          )}
          <div className="song-list-toolbar">
            <div className="song-list-filters" role="group" aria-label="Filter by genre">
              {[null, ...genres].map((option) => (
                <button
                  key={option ?? 'all'}
                  type="button"
                  className="song-list-filter"
                  aria-pressed={genre === option}
                  onClick={() => onGenreChange(option)}
                >
                  {option ?? 'All'}
                </button>
              ))}
            </div>
            <div className="song-list-random">
              <span className="song-list-progress">
                {solvedCount} of {visible.length} solved
              </span>
              <button type="button" id="random-song" onClick={playRandom}>
                <Icon name="shuffle" /> Random song
              </button>
            </div>
          </div>
          <ul className="song-list-cards">
            {visible.map((song) => (
              <li key={song.id}>
                <button
                  type="button"
                  id={`song-${song.id}`}
                  className={`song-card${solvedIds.includes(song.id) ? ' is-solved' : ''}`}
                  onClick={() => onSelect(song)}
                >
                  <span className="song-card-title">
                    {song.title}
                    {solvedIds.includes(song.id) && (
                      <span className="song-card-solved" role="img" aria-label="solved" title="Solved in this mode">
                        ✓
                      </span>
                    )}
                  </span>
                  <span className="song-card-meta">
                    {song.genre}
                    <span className={`song-card-difficulty is-${song.difficulty.toLowerCase()}`}>{song.difficulty}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

// Set once the player has started Echo Note, after which How it works stays folded away.
const ECHO_STARTED_KEY = 'one-note:echo-started'

interface EchoStartProps {
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  onStart: () => void
}

/**
 * The Echo Note start screen: the current practice and a Start button, with the choices
 * behind Change practice so most days it's one click to play.
 */
function EchoStart({ settings, onSettingsChange, onStart }: EchoStartProps) {
  const [changing, setChanging] = useState(false)
  // Explain only the choice just made, rather than every option at once.
  const [lastPicked, setLastPicked] = useState<'level' | 'key' | 'length'>('level')
  const [firstVisit] = useState(() => !readFlag(ECHO_STARTED_KEY))

  const level = ECHO_LEVELS.find((option) => option.id === settings.echoLevel) ?? ECHO_LEVELS[0]
  const key = ECHO_KEY_CHOICES.find((option) => option.id === settings.echoKey) ?? ECHO_KEY_CHOICES[0]
  const length = ECHO_LENGTH_CHOICES.find((option) => option.id === settings.echoLength) ?? ECHO_LENGTH_CHOICES[0]
  const about = { level: level.about, key: key.about, length: length.about }[lastPicked]

  const start = () => {
    writeFlag(ECHO_STARTED_KEY, true)
    onStart()
  }

  const choice = <T extends string>(
    label: string,
    group: 'level' | 'key' | 'length',
    options: readonly { id: T; label: string }[],
    current: T,
    pick: (id: T) => void,
  ) => (
    <div className="song-list-choice" role="group" aria-label={label}>
      <span>{label}</span>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className="song-list-filter"
          aria-pressed={current === option.id}
          onClick={() => {
            pick(option.id)
            setLastPicked(group)
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="song-list-echo">
      <div className="song-list-heading">
        <h2 id="song-list-title" tabIndex={-1}>Echo Note</h2>
        <SettingsMenu mode="echo-note" settings={settings} onChange={onSettingsChange} />
      </div>
      <p>Hear a chord, then a mystery note. Find it on the piano and learn its number in the key.</p>

      <div className="echo-start-card">
        {changing ? (
          <div id="echo-practice-choices" className="echo-start-choices">
            {choice('Notes', 'level', ECHO_LEVELS, settings.echoLevel, (echoLevel) => onSettingsChange({ ...settings, echoLevel }))}
            {choice('Key', 'key', ECHO_KEY_CHOICES, settings.echoKey, (echoKey) => onSettingsChange({ ...settings, echoKey }))}
            {choice('Length', 'length', ECHO_LENGTH_CHOICES, settings.echoLength, (echoLength) =>
              onSettingsChange({ ...settings, echoLength }),
            )}
            <p className="echo-start-about" aria-live="polite">
              {about}
            </p>
          </div>
        ) : (
          <div>
            <p className="echo-start-label">Your practice</p>
            <p className="echo-start-summary">
              {level.label} · {key.label} · {length.label}
            </p>
          </div>
        )}
        <div className="echo-start-actions">
          <button type="button" id="start-echo" className="echo-start-button" onClick={start}>
            <Icon name="play" />
            Start
          </button>
          <button
            type="button"
            className="echo-start-change"
            aria-expanded={changing}
            aria-controls="echo-practice-choices"
            onClick={() => setChanging(!changing)}
          >
            {changing ? 'Done' : 'Change practice'}
          </button>
        </div>
      </div>

      <details className="echo-start-how" open={firstVisit}>
        <summary>How it works</summary>
        <div className="song-list-how">
          <ol>
            <li>
              <strong>A chord sets the key.</strong> Its lowest note is home base, the <strong>1</strong>. The other
              notes of the key are numbered up from there: 1 2 3 4 5 6 7.
            </li>
            <li>
              <strong>A mystery note plays.</strong> Replay the chord and the note as often as you like (Space replays
              both).
            </li>
            <li>
              <strong>Find it on the piano.</strong> Tap keys to compare, then lock in one answer. You'll see its name
              and its number, like “C♯, the 3 of A major”.
            </li>
            <li>
              <strong>Keep going.</strong> Your results show which numbers you missed most. Score 4 of 5 or better in a
              set to unlock the next level.
            </li>
          </ol>
        </div>
      </details>
    </div>
  )
}
