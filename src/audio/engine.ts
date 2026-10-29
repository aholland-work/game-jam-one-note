import { midiToFrequency, type Note } from '../music/notation'

export interface PlayMelodyOptions {
  bpm: number
  /** Called when each note (rests included) starts sounding, in sync with the audio. */
  onNote?: (index: number) => void
  /** Called once, when the melody finishes (`completed`) or is stopped early. */
  onEnd?: (completed: boolean) => void
}

export interface Playback {
  stop: () => void
}

// Small lead time so the first note is never scheduled in the past.
const START_DELAY = 0.08
// Portion of each note that sounds before the release, so repeated notes stay distinct.
const LEGATO = 0.88
const RELEASE = 0.08

/**
 * A soft synth voice built on the Web Audio API. Everything is scheduled on the
 * audio clock; the visual callbacks poll that same clock so they stay in sync.
 *
 * Browsers keep audio suspended until a user gesture, so the first call into the
 * engine must happen inside a click or key handler.
 */
class AudioEngine {
  private context: AudioContext | null = null
  private output: GainNode | null = null
  private current: Playback | null = null

  private ensureContext(): { context: AudioContext; output: GainNode } {
    if (!this.context || !this.output) {
      this.context = new AudioContext()
      const compressor = this.context.createDynamicsCompressor()
      this.output = this.context.createGain()
      this.output.gain.value = 0.7
      this.output.connect(compressor).connect(this.context.destination)
    }
    if (this.context.state === 'suspended') void this.context.resume()
    return { context: this.context, output: this.output }
  }

  /** Plays a single note right away, e.g. when a piano key is tapped. */
  playNote(midi: number, seconds = 0.7): void {
    const { context } = this.ensureContext()
    this.scheduleVoice(midi, context.currentTime + 0.01, seconds)
  }

  /** Plays a melody, stopping anything already playing. */
  playMelody(notes: Note[], { bpm, onNote, onEnd }: PlayMelodyOptions): Playback {
    this.current?.stop()
    const { context } = this.ensureContext()

    const secondsPerBeat = 60 / bpm
    const origin = context.currentTime + START_DELAY
    const starts: number[] = []
    const sources: OscillatorNode[] = []
    let time = origin
    for (const note of notes) {
      starts.push(time)
      const duration = note.beats * secondsPerBeat
      if (note.midi !== null) sources.push(...this.scheduleVoice(note.midi, time, duration))
      time += duration
    }
    const end = time

    let nextIndex = 0
    let frame = 0
    let finished = false
    const finish = (completed: boolean) => {
      if (finished) return
      finished = true
      cancelAnimationFrame(frame)
      if (this.current === playback) this.current = null
      onEnd?.(completed)
    }
    const tick = () => {
      // Visuals lag by the output latency so highlights land when the note is heard.
      const heardTime = context.currentTime - (context.outputLatency || 0)
      while (nextIndex < starts.length && heardTime >= starts[nextIndex]) {
        onNote?.(nextIndex)
        nextIndex++
      }
      if (heardTime >= end) finish(true)
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    const playback: Playback = {
      stop: () => {
        for (const source of sources) {
          try {
            source.stop()
          } catch {
            // Already stopped.
          }
        }
        finish(false)
      },
    }
    this.current = playback
    return playback
  }

  stop(): void {
    this.current?.stop()
  }

  private scheduleVoice(midi: number, start: number, duration: number): OscillatorNode[] {
    const { context, output } = this.ensureContext()
    const frequency = midiToFrequency(midi)

    const body = context.createOscillator()
    body.type = 'triangle'
    body.frequency.value = frequency

    // A quiet octave overtone gives the tone a little sparkle.
    const overtone = context.createOscillator()
    overtone.type = 'sine'
    overtone.frequency.value = frequency * 2
    const overtoneLevel = context.createGain()
    overtoneLevel.gain.value = 0.12

    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = Math.min(frequency * 6, 8000)

    const envelope = context.createGain()
    const releaseAt = start + Math.max(duration * LEGATO, 0.06)
    envelope.gain.setValueAtTime(0.0001, start)
    envelope.gain.linearRampToValueAtTime(0.45, start + 0.012)
    envelope.gain.setTargetAtTime(0.2, start + 0.012, 0.15)
    envelope.gain.setTargetAtTime(0, releaseAt, RELEASE / 3)

    body.connect(filter)
    overtone.connect(overtoneLevel).connect(filter)
    filter.connect(envelope).connect(output)

    const stopAt = releaseAt + RELEASE * 2
    for (const oscillator of [body, overtone]) {
      oscillator.start(start)
      oscillator.stop(stopAt)
    }
    body.onended = () => envelope.disconnect()
    return [body, overtone]
  }
}

export const audioEngine = new AudioEngine()
