import { useState } from 'react'
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

  // "Next song" follows the list the player was looking at.
  const visible = genre === null ? songs : songs.filter((song) => song.genre === genre)
  const next = current ? visible[visible.indexOf(current) + 1] ?? null : null

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
      <h1 style={{ margin: '0 0 1rem' }}>One Note</h1>
      {current ? (
        mode === 'one-note-off' ? (
          <OneNoteOffRound
            key={`${mode}-${current.id}`}
            song={current}
            settings={settings}
            onSettingsChange={changeSettings}
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
          onSelect={setCurrent}
        />
      )}
    </main>
  )
}

export default App
