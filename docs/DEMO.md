# One Note: demo notes

Play link: **https://aholland-work.github.io/game-jam-one-note/**

The jam's demo format is under 7 minutes. Here's a run-through that fits.

## Before you start

- Hard refresh the page (Cmd+Shift+R) so you have the latest version.
- Turn your volume up and check that sound comes through the screen share.
- Have a private window ready if you want to show the first-time tutorial.

## 1. Our take on the theme (~1 min)

"Only One" → **only one note.**

- **Missing Note:** a well-known melody is missing exactly one note, and you get exactly one answer.
- **One Note Off:** exactly one note has changed. Spot which one.

Everyone can play by ear. No sheet-music reading needed, but musicians get a staff to look at.

## 2. Live demo (~2 min)

1. **Song list:** three modes, genre filter, 26 public-domain songs, from Twinkle to Maple Leaf Rag.
2. **Missing Note, Ode to Joy:**
   - Press **Play**. The staff shows rhythm only; the dashed box is the gap.
   - Tap a few piano keys to hunt for the note.
   - Lock in a **wrong** note on purpose (C). Your note shows orange and plays first, then the right note drops in green and the notes slide to their real places as the song plays.
3. **One Note Off, Twinkle:**
   - Play **Changed** (purple ≠), then **Original** (green ✓). The "Now playing" line says which is which.
   - Tap the note that sounds off and lock in. The reveal plays the changed version, then the original.
   - Mention **Hard mode** in ⚙ Settings: the change stays in key and you get one listen to the original.

## 3. Hand it off

Drop the link in the chat: "Pick a song, press Play, find the note. Your first song walks you through it."

## 4. Deep dive while people play (3 min max)

- **Stack:** Vite + React + TypeScript, no backend. GitHub Pages redeploys on every push, after the tests pass.
- **Sound:** Web Audio with Salamander Grand Piano samples. Notes are scheduled on the audio clock, and the staff and piano highlights follow that same clock, so they stay in sync.
- **Staff:** drawn by hand in SVG: rhythm-only while guessing, then each note slides to its real pitch as it plays. Beams, ties, sharps, flats and naturals included.
- **Songs are checked, not guessed:** every song is compared note for note against a public-domain MIDI of its source in the tests. That caught a rhythm I'd written from memory for The Entertainer.
- **One Note Off picks a new change every time:** Easy moves a note 1–3 half steps anywhere; Hard moves it one step within the key.
