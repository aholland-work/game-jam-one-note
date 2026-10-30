import { useEffect, useId, useRef, useState } from 'react'
import { midiInput, useMidiState } from '../audio/midi'
import { midiToName } from '../music/notation'
import { Icon } from './Icon'
import './MidiControl.css'

/**
 * A button in the page header for playing the piano from a MIDI instrument. Once one is
 * connected, it shows the instrument and opens a small menu with its options.
 */
export function MidiControl() {
  const midi = useMidiState()
  const panelId = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const restoreFocus = useRef(false)
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  // Reconnect quietly if MIDI was on last time (browsers remember the permission).
  useEffect(() => {
    if (midiInput.wasEnabled) void midiInput.connect()
  }, [])

  // Close the menu on a click outside it or on Escape.
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

  useEffect(() => {
    if (restoreFocus.current && midi.status !== 'on') {
      restoreFocus.current = false
      trigger.current?.focus()
    }
  }, [midi.status])

  // Safari has no Web MIDI, so there's nothing to offer there.
  if (midi.status === 'unsupported') return null

  if (midi.status !== 'on') {
    return (
      <div className="midi-control" ref={root} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
        <button
          type="button"
          className="midi-button"
          ref={trigger}
          onClick={() => void midiInput.connect()}
          disabled={midi.status === 'connecting'}
        >
          <Icon name="keyboard" /> {midi.status === 'connecting' ? 'Connecting…' : 'Connect a MIDI instrument'}
        </button>
        {midi.status === 'blocked' && (
          <p className="midi-panel">
            MIDI access was blocked. Allow it in your browser's site settings, then press the button again.
          </p>
        )}
      </div>
    )
  }

  const device = midi.devices.length > 0 ? midi.devices.join(', ') : 'MIDI on, no instrument found'
  return (
    <div className="midi-control" ref={root} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
      <button type="button" className="midi-button is-on" ref={trigger} aria-expanded={open} aria-controls={open ? panelId : undefined} onClick={() => setOpen(!open)}>
        <Icon name="keyboard" /> {device}
        {midi.lastNote !== null && <span className="midi-heard">{midiToName(midi.lastNote)}</span>}
      </button>
      {open && (
        <div id={panelId} className="midi-panel" role="group" aria-label="MIDI instrument">
          {midi.devices.length === 0 && <p>Plug in an instrument, or pair it over Bluetooth, and it shows up here.</p>}
          <label>
            <input type="checkbox" checked={midi.sound} onChange={(event) => midiInput.setSound(event.target.checked)} />
            <span>Play the piano sound for notes from the instrument</span>
          </label>
          <button
            type="button"
            onClick={() => {
              restoreFocus.current = true
              midiInput.disconnect()
              setOpen(false)
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
