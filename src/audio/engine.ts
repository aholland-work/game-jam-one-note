import { midiToFrequency, type Note } from '../music/notation'

export interface PlayMelodyOptions {
  bpm: number
  /** Start partway through, at this note index (e.g. to resume after pausing). */
  startIndex?: number
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

// Salamander Grand Piano samples (Alexander Holm, CC BY 3.0), one every minor third across
// the range the songs and piano use. Other notes are played by pitching the nearest one.
const PIANO_SAMPLES: Record<number, string> = {
  57: 'A3',
  60: 'C4',
  63: 'Ds4',
  66: 'Fs4',
  69: 'A4',
  72: 'C5',
  75: 'Ds5',
  78: 'Fs5',
  81: 'A5',
  84: 'C6',
  87: 'Ds6',
  90: 'Fs6',
  93: 'A6',
  96: 'C7',
}
const PIANO_LEVEL = 1.1
const PIANO_RELEASE = 0.08

/**
 * Plays notes with sampled piano, falling back to a soft synth voice until the samples
 * have loaded (or if they can't be). Everything is scheduled on the audio clock; the
 * visual callbacks poll that same clock so they stay in sync.
 *
 * Browsers keep audio suspended until a user gesture, so the first call into the
 * engine must happen inside a click or key handler.
 */
class AudioEngine {
  private context: AudioContext | null = null
  private output: GainNode | null = null
  private current: Playback | null = null
  /** Piano samples by MIDI note, filled in once they've all loaded. */
  private samples = new Map<number, AudioBuffer>()

  private ensureContext(): { context: AudioContext; output: GainNode } {
    if (!this.context || !this.output) {
      this.context = new AudioContext()
      const compressor = this.context.createDynamicsCompressor()
      this.output = this.context.createGain()
      this.output.gain.value = 0.7
      this.output.connect(compressor).connect(this.context.destination)
      void this.loadPianoSamples(this.context)
    }
    if (this.context.state === 'suspended') void this.context.resume()
    return { context: this.context, output: this.output }
  }

  /**
   * Sets up audio and starts loading the piano samples. Call it from a click (browsers only
   * allow audio after one) before the first note is needed, e.g. when a song is opened.
   */
  warmUp(): void {
    this.ensureContext()
  }

  /** Plays a single note right away, e.g. when a piano key is tapped. */
  playNote(midi: number, seconds = 0.7): void {
    const { context } = this.ensureContext()
    this.scheduleVoice(midi, context.currentTime + 0.01, seconds)
  }

  /** Plays a melody, stopping anything already playing. */
  playMelody(notes: Note[], { bpm, startIndex = 0, onNote, onEnd }: PlayMelodyOptions): Playback {
    this.current?.stop()
    const { context } = this.ensureContext()

    const secondsPerBeat = 60 / bpm
    const origin = context.currentTime + START_DELAY
    const starts: number[] = []
    const sources: AudioScheduledSourceNode[] = []
    let time = origin
    notes.forEach((note, i) => {
      if (i < startIndex) {
        starts.push(-Infinity)
        return
      }
      starts.push(time)
      const tiedFromPrevious = i > startIndex && notes[i - 1].tie && notes[i - 1].midi === note.midi
      if (note.midi !== null && !tiedFromPrevious) {
        // A tied chain sounds as one held note.
        let beats = note.beats
        for (let j = i; notes[j].tie && notes[j + 1]?.midi === note.midi; j++) beats += notes[j + 1].beats
        sources.push(...this.scheduleVoice(note.midi, time, beats * secondsPerBeat))
      }
      for (const midi of note.chord ?? []) sources.push(...this.scheduleVoice(midi, time, note.beats * secondsPerBeat))
      time += note.beats * secondsPerBeat
    })
    const end = time

    let nextIndex = startIndex
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

  private async loadPianoSamples(context: AudioContext): Promise<void> {
    try {
      const loaded = await Promise.all(
        Object.entries(PIANO_SAMPLES).map(async ([midi, name]) => {
          const response = await fetch(`${import.meta.env.BASE_URL}samples/piano/${name}.mp3`)
          if (!response.ok) throw new Error(`Couldn't load piano sample ${name}`)
          return [Number(midi), await context.decodeAudioData(await response.arrayBuffer())] as const
        }),
      )
      // Switch over only once every sample is ready, so a melody never mixes the two sounds.
      this.samples = new Map(loaded)
    } catch {
      // Keep the synth voice.
    }
  }

  private scheduleVoice(midi: number, start: number, duration: number): AudioScheduledSourceNode[] {
    return this.samples.size > 0 ? this.schedulePiano(midi, start, duration) : this.scheduleSynth(midi, start, duration)
  }

  private schedulePiano(midi: number, start: number, duration: number): AudioScheduledSourceNode[] {
    const { context, output } = this.ensureContext()
    let nearest = [...this.samples.keys()][0]
    for (const sampled of this.samples.keys()) {
      if (Math.abs(sampled - midi) < Math.abs(nearest - midi)) nearest = sampled
    }

    const source = context.createBufferSource()
    source.buffer = this.samples.get(nearest) as AudioBuffer
    source.playbackRate.value = 2 ** ((midi - nearest) / 12)

    // The sample decays on its own like a struck string; the envelope only damps it when
    // the note ends, so repeated notes stay distinct.
    const envelope = context.createGain()
    const releaseAt = start + Math.max(duration * LEGATO, 0.08)
    envelope.gain.setValueAtTime(PIANO_LEVEL, start)
    envelope.gain.setTargetAtTime(0, releaseAt, PIANO_RELEASE)

    source.connect(envelope).connect(output)
    source.start(start)
    source.stop(releaseAt + PIANO_RELEASE * 6)
    source.onended = () => envelope.disconnect()
    return [source]
  }

  private scheduleSynth(midi: number, start: number, duration: number): AudioScheduledSourceNode[] {
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
