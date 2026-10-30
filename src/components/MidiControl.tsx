import { useEffect, useRef, useState } from 'react'
import { midiInput, useMidiState } from '../audio/midi'
import { midiToName } from '../music/notation'
import './MidiControl.css'

/**
 * A button in the page header for playing the piano from a MIDI instrument. Once one is
 * connected, it shows the instrument and opens a small menu with its options.
 */
export function MidiControl() {
  const midi = useMidiState()
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
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // Safari has no Web MIDI, so there's nothing to offer there.
  if (midi.status === 'unsupported') return null

  if (midi.status !== 'on') {
    return (
      <div className="midi-control" ref={root}>
        <button
          type="button"
          className="midi-button"
          onClick={() => void midiInput.connect()}
          disabled={midi.status === 'connecting'}
        >
          🎹 {midi.status === 'connecting' ? 'Connecting…' : 'Connect a MIDI instrument'}
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
    <div className="midi-control" ref={root}>
      <button type="button" className="midi-button is-on" aria-expanded={open} onClick={() => setOpen(!open)}>
        🎹 {device}
        {midi.lastNote !== null && <span className="midi-heard">{midiToName(midi.lastNote)}</span>}
      </button>
      {open && (
        <div className="midi-panel" role="group" aria-label="MIDI instrument">
          {midi.devices.length === 0 && <p>Plug in an instrument, or pair it over Bluetooth, and it shows up here.</p>}
          <label>
            <input type="checkbox" checked={midi.sound} onChange={(event) => midiInput.setSound(event.target.checked)} />
            <span>Play the piano sound for notes from the instrument</span>
          </label>
          <button
            type="button"
            onClick={() => {
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
