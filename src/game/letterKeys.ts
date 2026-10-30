// Computer keyboard shortcuts, in semitone order (the usual music-app layout).
export const LETTER_KEYS = ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j']

export interface LetterKeyPress {
  key: string
  /** Held down and repeating. */
  repeat: boolean
  /** ⌘, Ctrl or Alt held, so it's a browser or system shortcut. */
  modified: boolean
  /** Focus is in a text field or menu, where letters are typing. */
  typing: boolean
  /** Focus is on the piano itself. */
  inPiano: boolean
}

/**
 * The semitone above the piano's first C that a key press plays, or null when it plays nothing.
 * With `anywhere` off, letters play only while the piano has focus, so voice control and
 * screen reader users can keep single letters from playing notes (WCAG 2.1.4).
 */
export function letterKeySemitone(press: LetterKeyPress, anywhere: boolean): number | null {
  if (press.repeat || press.modified || press.typing) return null
  if (!anywhere && !press.inPiano) return null
  const semitone = LETTER_KEYS.indexOf(press.key.toLowerCase())
  return semitone === -1 ? null : semitone
}
