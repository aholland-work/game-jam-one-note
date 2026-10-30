import './Icon.css'

const PATHS = {
  sun: <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></g>,
  moon: <path d="M20 14.2A8.5 8.5 0 0 1 9.8 4a8.5 8.5 0 1 0 10.2 10.2Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />,
  settings: <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 7h5m4 0h7M4 17h9m4 0h3" /><circle cx="11" cy="7" r="2" /><circle cx="15" cy="17" r="2" /></g>,
  shuffle: <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 4-3 6-6s4-6 6-6h3m-4-4 4 4-4 4" /></g>,
  keyboard: <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 5v8h3V5m4 0v8h3V5M9 13v6m6-6v6" /></g>,
  play: <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />,
  pause: <path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z" fill="currentColor" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" />,
  // Skip back to the start: a bar with a triangle pointing at it.
  restart: <path d="M5.5 4.5h3v15h-3zM19 4.5v15L9 12z" fill="currentColor" />,
}

/** A small icon drawn to sit beside button text, in the text's color. */
export function Icon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  )
}
