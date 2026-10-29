const STORAGE_KEY = 'one-note:tutorial-done'

// Storage can be unavailable (private windows, blocked site data); the tutorial then
// simply shows again next time.
export function hasSeenTutorial(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'yes'
  } catch {
    return false
  }
}

export function markTutorialSeen(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, 'yes')
  } catch {
    // Nothing to do; see above.
  }
}
