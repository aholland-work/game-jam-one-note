import { useEffect, useRef, useState } from 'react'
import { audioEngine } from './audio/engine'
import { MidiControl } from './components/MidiControl'
import { SongList } from './components/SongList'
import { ThemeToggle } from './components/ThemeToggle'
import { EchoNoteRound } from './modes/echoNote/EchoNoteRound'
import { MissingNoteRound } from './modes/missingNote/MissingNoteRound'
import { OneNoteOffRound } from './modes/oneNoteOff/OneNoteOffRound'
import { loadSolved, saveSolved, withSolved } from './game/progress'
import { loadSettings, saveSettings, type GameMode, type Settings } from './game/settings'
import { songs } from './songs'
import type { Genre, Song } from './songs/types'
import './App.css'

function App() {
  const contentRef = useRef<HTMLElement>(null)
  const returnFocus = useRef<string | null>(null)
  const previousScreen = useRef('home')
  const [mode, setMode] = useState<GameMode>('missing-note')
  const [settings, setSettings] = useState<Settings>(loadSettings)

  const changeSettings = (next: Settings) => {
    setSettings(next)
    saveSettings(next)
  }
  const [solved, setSolved] = useState(loadSolved)
  const markSolved = (song: Song) => {
    const next = withSolved(solved, mode, song.id)
    setSolved(next)
    saveSolved(next)
  }
  const [genre, setGenre] = useState<Genre | null>(null)
  const [current, setCurrent] = useState<Song | null>(null)
  // Bumped to restart the current song from scratch (for example to apply Hard mode now).
  const [attempt, setAttempt] = useState(0)
  // Echo Note rounds don't use songs; this is set while one is open.
  const [echoRound, setEchoRound] = useState<number | null>(null)
  const startEcho = () => {
    if (echoRound === null) returnFocus.current = document.activeElement?.id ?? null
    audioEngine.warmUp()
    setEchoRound((n) => (n ?? 0) + 1)
  }

  const screen = echoRound !== null ? `echo-${echoRound}` : current ? `${mode}-${current.id}-${attempt}` : 'home'
  useEffect(() => {
    if (screen === previousScreen.current) return
    previousScreen.current = screen
    const trigger = screen === 'home' && returnFocus.current ? document.getElementById(returnFocus.current) : null
    if (trigger) trigger.focus()
    else contentRef.current?.querySelector<HTMLElement>('.round h2, #song-list-title')?.focus()
  }, [screen])

  // "Next song" follows the list the player was looking at.
  const visible = genre === null ? songs : songs.filter((song) => song.genre === genre)
  const next = current ? visible[visible.indexOf(current) + 1] ?? null : null

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">Skip to game</a>
      <header className="app-header">
        <h1 className="app-brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>One Note</h1>
        <div className="app-header-actions">
          <MidiControl />
          <ThemeToggle />
        </div>
      </header>
      <main id="main-content" tabIndex={-1} ref={contentRef}>
        {echoRound !== null ? (
          <EchoNoteRound
            key={echoRound}
            settings={settings}
            onSettingsChange={changeSettings}
            onBack={() => setEchoRound(null)}
            onPlayAgain={startEcho}
            onLevelUp={(echoLevel) => {
              changeSettings({ ...settings, echoLevel })
              startEcho()
            }}
          />
        ) : current ? (
          mode === 'one-note-off' ? (
            <OneNoteOffRound
              key={`${mode}-${current.id}-${attempt}`}
              song={current}
              settings={settings}
              onSettingsChange={changeSettings}
              onRestart={() => setAttempt((n) => n + 1)}
              onBack={() => setCurrent(null)}
              onNext={next ? () => setCurrent(next) : null}
              onSolved={() => markSolved(current)}
            />
          ) : (
            <MissingNoteRound
              key={`${mode}-${current.id}`}
              song={current}
              onBack={() => setCurrent(null)}
              onNext={next ? () => setCurrent(next) : null}
              onSolved={() => markSolved(current)}
            />
          )
        ) : (
          <SongList
            mode={mode}
            onModeChange={setMode}
            settings={settings}
            onSettingsChange={changeSettings}
            songs={songs}
            solvedIds={solved[mode] ?? []}
            genre={genre}
            onGenreChange={setGenre}
            onSelect={(song) => {
              returnFocus.current = document.activeElement?.id ?? null
              // Opening a song is a click, so audio can start and the piano samples begin loading.
              audioEngine.warmUp()
              setCurrent(song)
            }}
            onStartEcho={startEcho}
          />
        )}
      </main>
      {/* Credits belong on the home page, not inside a song. */}
      {!current && echoRound === null && (
        <footer className="app-footer">
          Songs are public domain (
          <a href="https://github.com/aholland-work/game-jam-one-note#song-sources-and-credits">sources and credits</a>).
          Piano sound:{' '}
          <a href="https://github.com/sfzinstruments/SalamanderGrandPiano">Salamander Grand Piano</a> by Alexander Holm (
          <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>). Icon:{' '}
          <a href="https://github.com/twitter/twemoji">Twemoji</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>).
        </footer>
      )}
    </div>
  )
}

export default App
