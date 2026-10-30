import { useEffect, useId, useRef, useState } from 'react'
import { SETTING_OPTIONS, type GameMode, type Settings } from '../game/settings'
import { Icon } from './Icon'
import './SettingsMenu.css'

interface SettingsMenuProps {
  mode: GameMode
  settings: Settings
  onChange: (settings: Settings) => void
  /** Inside a song, settings that shape the song's setup only apply from the next one. */
  inRound?: boolean
}

/** A Settings button that opens the current mode's options in a small panel. */
export function SettingsMenu({ mode, settings, onChange, inRound = false }: SettingsMenuProps) {
  const panelId = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  // Close on a click outside the menu or on Escape.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        if (root.current?.contains(document.activeElement)) trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (SETTING_OPTIONS[mode].length === 0) return null

  return (
    <div className="settings-menu" ref={root} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
      <button type="button" className="settings-button" ref={trigger} aria-expanded={open} aria-controls={open ? panelId : undefined} onClick={() => setOpen(!open)}>
        <Icon name="settings" /> Settings
      </button>
      {open && (
        <div id={panelId} className="settings-panel" role="group" aria-label="Settings">
          {SETTING_OPTIONS[mode].map(({ key, label, nextSong }) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(event) => onChange({ ...settings, [key]: event.target.checked })}
              />
              <span>
                {label}
                {inRound && nextSong && <span className="settings-note"><Icon name="restart" /> Starts on the next song</span>}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
