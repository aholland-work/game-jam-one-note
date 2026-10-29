import type { Genre, Song } from '../songs/types'
import './SongList.css'

interface SongListProps {
  songs: Song[]
  genre: Genre | null
  onGenreChange: (genre: Genre | null) => void
  onSelect: (song: Song) => void
}

/** Song cards with a genre filter. `genre` null means all genres. */
export function SongList({ songs, genre, onGenreChange, onSelect }: SongListProps) {
  const genres = [...new Set(songs.map((song) => song.genre))]
  const visible = genre === null ? songs : songs.filter((song) => song.genre === genre)

  return (
    <section className="song-list" aria-labelledby="song-list-title">
      <h2 id="song-list-title">Pick a song</h2>
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
