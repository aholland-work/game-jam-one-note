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
        <path d="M17 28V10M47 15V2M76 24V6" />
        <ellipse cx="42" cy="30" rx="5" ry="3.5" strokeDasharray="2 4" transform="rotate(-20 42 30)" />
      </>}
      {mode === 'echo-note' && <>
        <ellipse cx="18" cy="28" rx="5" ry="3.5" fill="currentColor" transform="rotate(-20 18 28)" />
        <path d="M23 27V5M39 15q5 5 0 10M53 10q9 10 0 20M67 5q13 15 0 30" />
      </>}
    </svg>
  )
}
