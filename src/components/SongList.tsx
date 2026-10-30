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
          <h2 id="song-list-title">Echo Note</h2>
          <p>
            Train your ear. For each mystery note you hear a C major chord to set the key, then the note. Find it on the
            piano and lock in one answer. Notes you miss come back more often.
          </p>
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
          <div className="song-list-choice" role="group" aria-label="Session length">
            <span>Length</span>
            {(
              [
                ['round', 'Rounds of 5'],
                ['endless', 'Endless practice'],
              ] as const
            ).map(([id, label]) => (
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
          <button type="button" className="song-list-start" onClick={onStartEcho}>
            ▶ Start a round
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
