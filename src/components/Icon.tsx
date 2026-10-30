import './Icon.css'

const PATHS = {
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
