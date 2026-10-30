import type { GameMode } from "./settings";

const STORAGE_KEY = "one-note:solved";

/** The songs each mode has been solved for, by song id. */
export type Solved = Partial<Record<GameMode, string[]>>;

// Storage can be unavailable (private windows, blocked site data); progress then lasts
// only until the page closes.
export function loadSolved(): Solved {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "{}",
    ) as unknown;
    return saved && typeof saved === "object" ? (saved as Solved) : {};
  } catch {
    return {};
  }
}

export function saveSolved(solved: Solved): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(solved));
  } catch {
    // Nothing to do; see above.
  }
}

/** Marks a song solved in one mode. */
export function withSolved(
  solved: Solved,
  mode: GameMode,
  songId: string,
): Solved {
  const ids = solved[mode] ?? [];
  return ids.includes(songId)
    ? solved
    : { ...solved, [mode]: [...ids, songId] };
}

/** A random song, picking from the ones not solved yet while there are any. */
export function pickRandomSong<T extends { id: string }>(
  songs: T[],
  solvedIds: string[],
  random: () => number = Math.random,
): T | null {
  const unsolved = songs.filter((song) => !solvedIds.includes(song.id));
  const pool = unsolved.length > 0 ? unsolved : songs;
  return pool.length > 0 ? pool[Math.floor(random() * pool.length)] : null;
}
