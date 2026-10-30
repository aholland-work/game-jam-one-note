import { useEffect } from 'react'
import { midiInput, useMidiState } from '../audio/midi'
import { midiToName } from '../music/notation'
import './MidiControl.css'

/** Connects a MIDI keyboard or wind instrument, and shows its settings once connected. */
export function MidiControl() {
  const midi = useMidiState()

  // Reconnect quietly if MIDI was on last time (browsers remember the permission).
  useEffect(() => {
    if (midiInput.wasEnabled) void midiInput.connect()
  }, [])

  if (midi.status === 'unsupported') {
    return <p className="midi-control midi-control-note">🎹 Playing along on a MIDI instrument works in Chrome, Edge and Firefox.</p>
  }

  if (midi.status === 'off' || midi.status === 'connecting') {
    return (
      <div className="midi-control">
        <button type="button" onClick={() => void midiInput.connect()} disabled={midi.status === 'connecting'}>
          🎹 {midi.status === 'connecting' ? 'Connecting…' : 'Connect a MIDI instrument'}
        </button>
      </div>
    )
  }

  if (midi.status === 'blocked') {
    return (
      <div className="midi-control">
        <p className="midi-control-note">MIDI access was blocked. Allow it in your browser's site settings, then try again.</p>
        <button type="button" onClick={() => midiInput.disconnect()}>
          OK
        </button>
      </div>
    )
  }

  return (
    <div className="midi-control is-on">
      <span className="midi-control-device">
        🎹{' '}
        {midi.devices.length > 0
          ? midi.devices.join(', ')
          : 'MIDI is on. Plug in an instrument or pair it over Bluetooth.'}
        {midi.lastNote !== null && <span className="midi-control-heard">Heard {midiToName(midi.lastNote)}</span>}
      </span>
      <label>
        <input type="checkbox" checked={midi.sound} onChange={(event) => midiInput.setSound(event.target.checked)} />{' '}
        Piano sound
      </label>
      <button type="button" className="midi-control-off" onClick={() => midiInput.disconnect()}>
        Turn off
      </button>
    </div>
  )
}
