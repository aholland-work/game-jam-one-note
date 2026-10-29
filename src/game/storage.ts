// Small per-browser flags. Storage can be unavailable (private windows, blocked site
// data); reads then return false and writes are dropped, which is harmless here.

export function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === 'yes'
  } catch {
    return false
  }
}

export function writeFlag(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, value ? 'yes' : 'no')
  } catch {
    // Nothing to do; see above.
  }
}
