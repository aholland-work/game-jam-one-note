import { useState } from 'react'
import { audioEngine } from './audio/engine'
import { withGap } from './game/puzzle'
import { songs } from './songs'

// Temporary sound check for milestone 1: play a song with and without its gap and
// watch the highlight follow the audio. The real puzzle screen replaces this.
const song = songs[0]

function App() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [gapMode, setGapMode] = useState(false)

  const play = (withMissingNote: boolean) => {
    setGapMode(withMissingNote)
    const notes = withMissingNote ? withGap(song.melody, song.missingIndex) : song.melody
    audioEngine.playMelody(notes, {
      bpm: song.bpm,
      onNote: setActiveIndex,
      onEnd: () => setActiveIndex(null),
    })
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>One Note</h1>
      <h2>{song.title}</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => play(true)}>Play with gap</button>
        <button onClick={() => play(false)}>Play full melody</button>
        <button onClick={() => audioEngine.stop()}>Stop</button>
      </div>
      <ol
        aria-label="Melody notes"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 0, listStyle: 'none' }}
      >
        {song.melody.map((note, i) => {
          const isGap = gapMode && i === song.missingIndex
          return (
            <li
              key={i}
              data-active={activeIndex === i}
              style={{
                width: 28 * Math.max(note.beats, 0.5),
                minWidth: 20,
                height: 28,
                borderRadius: 6,
                border: `1px ${isGap ? 'dashed' : 'solid'} var(--border)`,
                background: activeIndex === i ? 'var(--accent)' : 'var(--surface)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 12,
              }}
            >
              {isGap ? '?' : ''}
            </li>
          )
        })}
      </ol>
      <div style={{ display: 'flex', gap: 4 }} aria-label="Test keys">
        {Array.from({ length: 12 }, (_, i) => 60 + i).map((midi) => (
          <button key={midi} onClick={() => audioEngine.playNote(midi)} aria-label={`Note ${midi}`}>
            {midi - 59}
          </button>
        ))}
      </div>
    </main>
  )
}

export default App
