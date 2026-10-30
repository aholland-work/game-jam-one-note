import { useState } from 'react'
import { audioEngine } from './audio/engine'
import { SongList } from './components/SongList'
import { MissingNoteRound } from './modes/missingNote/MissingNoteRound'
import { OneNoteOffRound } from './modes/oneNoteOff/OneNoteOffRound'
import { loadSettings, saveSettings, type GameMode, type Settings } from './game/settings'
import { songs } from './songs'
import type { Genre, Song } from './songs/types'

function App() {
  const [mode, setMode] = useState<GameMode>('missing-note')
  const [settings, setSettings] = useState<Settings>(loadSettings)

  const changeSettings = (next: Settings) => {
    setSettings(next)
    saveSettings(next)
  }
  const [genre, setGenre] = useState<Genre | null>(null)
  const [current, setCurrent] = useState<Song | null>(null)
  // Bumped to restart the current song from scratch (for example to apply Hard mode now).
  const [attempt, setAttempt] = useState(0)

  // "Next song" follows the list the player was looking at.
  const visible = genre === null ? songs : songs.filter((song) => song.genre === genre)
  const next = current ? visible[visible.indexOf(current) + 1] ?? null : null

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
      <h1 style={{ margin: '0 0 1rem' }}>One Note</h1>
      {current ? (
        mode === 'one-note-off' ? (
          <OneNoteOffRound
            key={`${mode}-${current.id}-${attempt}`}
            song={current}
            settings={settings}
            onSettingsChange={changeSettings}
            onRestart={() => setAttempt((n) => n + 1)}
            onBack={() => setCurrent(null)}
            onNext={next ? () => setCurrent(next) : null}
          />
        ) : (
          <MissingNoteRound
            key={`${mode}-${current.id}`}
            song={current}
            onBack={() => setCurrent(null)}
            onNext={next ? () => setCurrent(next) : null}
          />
        )
      ) : (
        <SongList
          mode={mode}
          onModeChange={setMode}
          settings={settings}
          onSettingsChange={changeSettings}
          songs={songs}
          genre={genre}
          onGenreChange={setGenre}
          onSelect={(song) => {
            // Opening a song is a click, so audio can start and the piano samples begin loading.
            audioEngine.warmUp()
            setCurrent(song)
          }}
        />
      )}
      <footer style={{ marginTop: '3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Songs are public domain (
        <a href="https://github.com/aholland-work/game-jam-one-note#song-sources-and-credits">sources and credits</a>).
        Piano sound:{' '}
        <a href="https://github.com/sfzinstruments/SalamanderGrandPiano">Salamander Grand Piano</a> by Alexander Holm (
        <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>). Icon:{' '}
        <a href="https://github.com/twitter/twemoji">Twemoji</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>).
      </footer>
    </main>
  )
}

export default App
