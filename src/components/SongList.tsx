import { ECHO_LEVELS } from '../game/echoNote'
import type { GameMode, Settings } from '../game/settings'
import { hasSeenTutorial } from '../game/tutorial'
import type { Genre, Song } from '../songs/types'
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
    label: 'New key each round',
    about: 'Each round starts in a different key, like G or B♭ major, and the numbers move with it.',
  },
] as const

const ECHO_LENGTH_CHOICES = [
  { id: 'round', label: 'Rounds of 5', about: '5 mystery notes, then your results. Get 4 or more right to unlock the next notes.' },
  {
    id: 'endless',
    label: 'Endless practice',
    about: 'Notes keep coming until you press Finish. Then you see which numbers you missed most.',
  },
] as const

interface SongListProps {
  mode: GameMode
  onModeChange: (mode: GameMode) => void
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  songs: Song[]
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
  genre,
  onGenreChange,
  onSelect,
  onStartEcho,
}: SongListProps) {
  const genres = [...new Set(songs.map((song) => song.genre))]
  const visible = genre === null ? songs : songs.filter((song) => song.genre === genre)

  return (
    <section className="song-list" aria-labelledby="song-list-title">
      <div className="song-list-modes" role="group" aria-label="Game mode">
        {MODES.map((option) => (
          <button
            key={option.id}
            type="button"
            className="song-list-mode"
            aria-pressed={mode === option.id}
            onClick={() => onModeChange(option.id)}
          >
            <span className="song-list-mode-label">{option.label}</span>
            <span className="song-list-mode-blurb">{option.blurb}</span>
          </button>
        ))}
      </div>
      {mode === 'echo-note' ? (
        <div className="song-list-echo">
          <div className="song-list-heading">
            <h2 id="song-list-title">Echo Note</h2>
            <SettingsMenu mode={mode} settings={settings} onChange={onSettingsChange} />
          </div>
          <p>
            Ear training for playing by ear and improvising: learn to hear where a note sits in a key, and find it on
            the piano.
          </p>
          <div className="song-list-how">
            <h3>How it works</h3>
            <ol>
              <li>
                <strong>A chord sets the key.</strong> Its lowest note is home base, the <strong>1</strong>. The other
                notes of the key are numbered up from there: 1 2 3 4 5 6 7.
              </li>
              <li>
                <strong>A mystery note plays.</strong> Replay the chord and the note as often as you like (Space
                replays both).
              </li>
              <li>
                <strong>Find it on the piano.</strong> Tap keys to compare, then lock in one answer. You'll see its
                name and its number, like “C♯, the 3 of A major”.
              </li>
              <li>
                <strong>Keep going.</strong> Notes you miss come back more often. Score 4 of 5 or better to unlock the
                next set of notes.
              </li>
            </ol>
          </div>
          <div className="song-list-choice" role="group" aria-label="Notes in play">
            <span>Notes</span>
            {ECHO_LEVELS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="song-list-filter"
                aria-pressed={settings.echoLevel === option.id}
                onClick={() => onSettingsChange({ ...settings, echoLevel: option.id })}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="song-list-choice-about">
            {ECHO_LEVELS.find((option) => option.id === settings.echoLevel)?.about}
          </p>
          <div className="song-list-choice" role="group" aria-label="Key">
            <span>Key</span>
            {ECHO_KEY_CHOICES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className="song-list-filter"
                aria-pressed={settings.echoKey === id}
                onClick={() => onSettingsChange({ ...settings, echoKey: id })}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="song-list-choice-about">
            {ECHO_KEY_CHOICES.find((option) => option.id === settings.echoKey)?.about}
          </p>
          <div className="song-list-choice" role="group" aria-label="Session length">
            <span>Length</span>
            {ECHO_LENGTH_CHOICES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className="song-list-filter"
                aria-pressed={settings.echoLength === id}
                onClick={() => onSettingsChange({ ...settings, echoLength: id })}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="song-list-choice-about">
            {ECHO_LENGTH_CHOICES.find((option) => option.id === settings.echoLength)?.about}
          </p>
          <button type="button" className="song-list-start" onClick={onStartEcho}>
            ▶ Start
          </button>
        </div>
      ) : (
        <>
          <div className="song-list-heading">
            <h2 id="song-list-title">Pick a song</h2>
            <SettingsMenu mode={mode} settings={settings} onChange={onSettingsChange} />
          </div>
          {mode === 'missing-note' && !hasSeenTutorial() && (
            <p className="song-list-tip">
              New here? Each melody is missing one note, and your first song walks you through finding it.
              Twinkle, Twinkle is a gentle place to start.
            </p>
          )}
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
          <ul className="song-list-cards">
            {visible.map((song) => (
              <li key={song.id}>
                <button type="button" className="song-card" onClick={() => onSelect(song)}>
                  <span className="song-card-title">{song.title}</span>
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
