import type { Settings } from '../game/settings'
import { hasSeenTutorial } from '../game/tutorial'
import type { Genre, Song } from '../songs/types'
import './SongList.css'

export type GameMode = 'missing-note' | 'one-note-off'

const MODES: { id: GameMode; label: string; blurb: string }[] = [
  { id: 'missing-note', label: 'Missing Note', blurb: 'One note is missing. Find it on the piano.' },
  { id: 'one-note-off', label: 'One Note Off', blurb: 'One note has changed. Spot which one.' },
]

// Each mode's optional rules, shown under the mode cards.
const SETTING_OPTIONS: Record<GameMode, { key: keyof Settings; label: string }[]> = {
  'missing-note': [{ key: 'missingNoteTries', label: 'Try it: hear your note in the melody before locking in (3 tries)' }],
  'one-note-off': [
    { key: 'oneNoteOffHighlight', label: 'Highlight notes on the staff as they play' },
    { key: 'oneNoteOffInKey', label: 'Harder: the changed note stays in the song’s key' },
    { key: 'oneNoteOffOneListen', label: 'Harder: hear the original only once' },
  ],
}

interface SongListProps {
  mode: GameMode
  onModeChange: (mode: GameMode) => void
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  songs: Song[]
  genre: Genre | null
  onGenreChange: (genre: Genre | null) => void
  onSelect: (song: Song) => void
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
      <details className="song-list-settings">
        <summary>Settings</summary>
        <div className="song-list-settings-options">
          {SETTING_OPTIONS[mode].map(({ key, label }) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(event) => onSettingsChange({ ...settings, [key]: event.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
      </details>
      <h2 id="song-list-title">Pick a song</h2>
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
    </section>
  )
}
