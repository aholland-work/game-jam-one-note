# One Note

A music puzzle game for the "Only One" game jam. A short, well-known melody is missing one note. Listen, test notes on the piano, use up to three tries to hear your note in the melody, then lock in your one answer. When the round ends, the staff turns into the real sheet music as the completed melody plays.

All songs are public-domain melodies.

## Run it

```bash
npm install
npm run dev
```

## Checks

```bash
npm test        # song and notation checks (Vitest)
npm run lint    # oxlint
npm run build   # type-check and production build
```

## Add a song

1. Create a file in `src/songs/` (copy an existing one, such as `odeToJoy.ts`).
2. Write the melody as space-separated `pitch/duration` tokens:
   - Pitch: `C4`, `F#5`, `Bb3`, or `r` for a rest.
   - Duration: `w` whole, `h` half, `q` quarter, `e` eighth, `s` sixteenth. Add `.` for dotted (`q.`) and `~` to tie into the next note (`C5/s~ C5/q`).
   - `|` bar lines are optional and only for readability.
3. Set `missingIndex` to the note players have to find (counting from 0), plus `beatsPerBar` and, for songs that start mid-bar, `pickupBeats`.
4. Add it to the list in `src/songs/index.ts`.
5. Run `npm test`. It checks the bars add up, the song fits on one line, and the missing note is a real note on the piano.

## How it's built

- Vite, React and TypeScript, no backend.
- `src/audio/engine.ts`: a Web Audio synth. Notes are scheduled on the audio clock, and the on-screen highlights follow the same clock.
- `src/components/`: the staff (hand-drawn SVG), the one-octave piano and the song list, shared by any game mode.
- `src/modes/missingNote/`: the Missing Note round. Future modes get their own folder next to it.
