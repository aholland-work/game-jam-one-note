import type { GameMode } from '../game/settings'

/** Decorative miniature scores; the card's text supplies its accessible name. */
export function ModeMark({ mode }: { mode: GameMode }) {
  return (
    <svg className="mode-mark" viewBox="0 0 88 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {mode === 'missing-note' && <>
        <ellipse cx="12" cy="29" rx="5" ry="3.5" fill="currentColor" transform="rotate(-20 12 29)" />
        <path d="M17 28V10M76 24V6" />
        <ellipse cx="71" cy="25" rx="5" ry="3.5" fill="currentColor" transform="rotate(-20 71 25)" />
        <ellipse cx="42" cy="26" rx="6" ry="4.5" strokeDasharray="2 4" />
        <path d="M48 22V8" strokeDasharray="2 4" />
      </>}
      {mode === 'one-note-off' && <>
        <ellipse cx="12" cy="29" rx="5" ry="3.5" fill="currentColor" transform="rotate(-20 12 29)" />
        <ellipse cx="42" cy="16" rx="5" ry="3.5" fill="currentColor" transform="rotate(-20 42 16)" />
        <ellipse cx="71" cy="25" rx="5" ry="3.5" fill="currentColor" transform="rotate(-20 71 25)" />
        <path d="M17 28V10M47 15V2M76 24V6M36 29h12M54 28V14m-3 3 3-3 3 3" />
      </>}
      {mode === 'echo-note' && <>
        <ellipse cx="15" cy="31" rx="5" ry="3.5" fill="currentColor" transform="rotate(-20 15 31)" />
        <ellipse cx="15" cy="23" rx="5" ry="3.5" fill="currentColor" transform="rotate(-20 15 23)" />
        <ellipse cx="15" cy="15" rx="5" ry="3.5" fill="currentColor" transform="rotate(-20 15 15)" />
        <path d="M20 30V3M35 16q4 5 0 10m9-15q8 10 0 20M76 26V8" />
        <ellipse cx="71" cy="27" rx="5" ry="3.5" fill="currentColor" transform="rotate(-20 71 27)" />
      </>}
    </svg>
  )
}
