import { useEffect } from 'react'
import { midiInput, useMidiState } from '../audio/midi'
import { midiToName } from '../music/notation'
import './MidiControl.css'

/**
 * Playing the piano from a MIDI instrument. Most players won't have one, so until it's
 * connected this is a small link under the piano; once connected it shows a status line.
 */
export function MidiControl() {
  const midi = useMidiState()

  // Reconnect quietly if MIDI was on last time (browsers remember the permission).
  useEffect(() => {
    if (midiInput.wasEnabled) void midiInput.connect()
  }, [])

  if (midi.status === 'on') {
    return (
      <div className="midi-control">
        <span className="midi-control-device">
          🎹{' '}
          {midi.devices.length > 0 ? midi.devices.join(', ') : 'MIDI is on. Plug in an instrument or pair it over Bluetooth.'}
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

  return (
    <details className="midi-details">
      <summary>Play with a MIDI instrument</summary>
      <div className="midi-control">
        {midi.status === 'unsupported' ? (
          <p className="midi-control-note">Playing on a MIDI instrument works in Chrome, Edge and Firefox.</p>
        ) : midi.status === 'blocked' ? (
          <>
            <p className="midi-control-note">MIDI access was blocked. Allow it in your browser's site settings, then try again.</p>
            <button type="button" onClick={() => midiInput.disconnect()}>
              OK
            </button>
          </>
        ) : (
          <>
            <p className="midi-control-note">Play the piano keys from a MIDI keyboard or wind instrument.</p>
            <button type="button" onClick={() => void midiInput.connect()} disabled={midi.status === 'connecting'}>
              🎹 {midi.status === 'connecting' ? 'Connecting…' : 'Connect'}
            </button>
          </>
        )}
      </div>
    </details>
  )
}
