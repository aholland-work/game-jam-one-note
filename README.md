# One Note

A music puzzle game for the "Only One" game jam, with three modes:

- **Missing Note:** a short, well-known melody is missing one note. Listen, test notes on the piano, then lock in your one answer.
- **One Note Off:** one note in the melody has been changed. Compare the original with the changed version, tap the note that's off, then lock in.
- **Echo Note:** ear training for playing by ear and improvising. A chord sets the key, a mystery note plays, and you find it on the piano and learn its number in the key ("C♯, the 3 of A major"). Start with the chord tones (1, 3, 5), move up to the major scale, then all 12 notes. Stay in C major or get a new key each round, and play rounds of 5 or practice endlessly: notes you miss come back more often.

When a round ends, the staff turns into the real sheet music as the melody plays.

You can play the piano with the mouse, your computer keyboard, or a MIDI instrument (keyboard or wind controller) in Chrome, Edge or Firefox: press **Connect a MIDI instrument** under the piano. On a Mac, pair Bluetooth MIDI instruments first in Audio MIDI Setup (Window → Show MIDI Studio → Bluetooth).

All songs are public-domain melodies. The musical note icon is from [Twemoji](https://github.com/twitter/twemoji) (© Twitter, Inc and other contributors), licensed under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/). The piano sound uses samples from the [Salamander Grand Piano](https://github.com/sfzinstruments/SalamanderGrandPiano) by Alexander Holm, licensed under [CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/) (MP3 versions from [Tone.js](https://github.com/Tonejs/audio)), in `public/samples/piano/`.

## The jam theme: "Only One"

> Your game is built around something there's **only one** of — only one life, one button, one room, one enemy, one color... whatever you dream up.

**Why this theme**

- A single word that's easy to grasp — no staring at a blank page trying to decode it.
- It naturally keeps scope small, which is exactly what you want in a single day.
- It rewards a clever idea over technical firepower, so anyone can shine.
- Easy floor, high ceiling — a first-timer can finish something, and an ambitious take can still wow.

**Ways people might interpret it**

- **Only one life** — permadeath; one mistake and it's over.
- **Only one button** — the whole game controlled by a single key.
- **Only one enemy** — a boss fight that's the entire game.
- **Only one room** — everything happens on a single screen.
- **Only one color** — a monochrome visual constraint.
- **Only one bullet** — fire once, then chase it down to reuse it.
- **Only one of you** — no clones or reinforcements; the last one standing.

**Our take: only one note.** Each melody is missing exactly one note, and you get exactly one answer to find it.

## Song sources and credits

Every melody is public domain, copied from and checked note for note against public-domain scores and transcriptions from:

- [The Mutopia Project](https://www.mutopiaproject.org): free classical and ragtime scores, typeset by volunteers.
- [abcnotation.com](https://abcnotation.com): an archive of folk, holiday and traditional tunes, including the Digital Tradition folk song collection and Paul Hardy's Christmas Tunebook.

Thanks to everyone who typeset and transcribed them. Each song file links its exact source. `song-sources/` holds MIDI renderings of those sources, used only by the tests; The Blue Danube's comes from a Mutopia edition licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) (typeset by Nikos Kouremenos), and the rest are public domain or traditional.

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
   - Duration: `w` whole, `h` half, `q` quarter, `e` eighth, `s` sixteenth. Add `.` for dotted (`q.`), `3` for a triplet (`C4/e3 D4/e3 E4/e3` is three eighths in one beat) and `~` to tie into the next note (`C5/s~ C5/q`).
   - `|` bar lines are optional and only for readability.
3. Set `missingIndex` to the note players have to find (counting from 0), plus `beatsPerBar` and, for songs that start mid-bar, `pickupBeats`. For 6/8, use `beatsPerBar: 3` and `compound: true` so eighths are beamed in threes.
4. Add it to the list in `src/songs/index.ts`.
5. Save a MIDI file of the public-domain source in `song-sources/` (Mutopia and abcnotation.com both offer one) and point the song's `source.midi` at it, with the track that holds the tune.
6. Run `npm test`. It checks the bars add up, the song fits on one line, the missing note is a real note on the piano, and the melody appears note for note in the source MIDI (allowing a key change and doubled or halved note values).

## How it's built

- Vite, React and TypeScript, no backend.
- `src/audio/engine.ts`: plays notes with the piano samples (a simple synth until they load). Notes are scheduled on the audio clock, and the on-screen highlights follow the same clock.
- `src/components/`: the staff (hand-drawn SVG), the one-octave piano and the song list, shared by any game mode.
- `src/modes/missingNote/`, `src/modes/oneNoteOff/` and `src/modes/echoNote/`: one folder per game mode. Shared round styles live in `src/modes/round.css`.
