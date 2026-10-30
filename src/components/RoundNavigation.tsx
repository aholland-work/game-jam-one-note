import type { ReactNode } from 'react'
import './RoundNavigation.css'

/** Shared back control and optional actions above a round's title. */
export function RoundNavigation({ onBack, backLabel = 'Songs', children }: {
  onBack: () => void
  backLabel?: 'Songs' | 'Home'
  children?: ReactNode
}) {
  return (
    <div className="round-navigation">
      <button type="button" className="round-back" onClick={onBack}>← {backLabel}</button>
      {children}
    </div>
  )
}
