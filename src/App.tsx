import { useState } from 'react'
import { MissingNoteRound } from './modes/missingNote/MissingNoteRound'
import { songs } from './songs'

// Milestone 2: a single playable puzzle. The song list comes in milestone 3.
function App() {
  const [roundKey, setRoundKey] = useState(0)

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
      <h1 style={{ margin: '0 0 1rem' }}>One Note</h1>
      <MissingNoteRound key={roundKey} song={songs[0]} onRestart={() => setRoundKey((k) => k + 1)} />
    </main>
  )
}

export default App
