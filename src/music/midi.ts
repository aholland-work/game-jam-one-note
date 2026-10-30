export interface MidiNote {
  pitch: number
  channel: number
  /** Start and end in ticks. */
  start: number
  end: number
}

export interface MidiFile {
  ticksPerQuarter: number
  /** Notes per track, in the order they start. */
  tracks: MidiNote[][]
}

/**
 * Reads the notes out of a Standard MIDI File. Only what the song checks need: note
 * on/off per track. Tempo, controllers and other events are skipped.
 */
export function parseMidi(data: Uint8Array): MidiFile {
  let pos = 0
  const text = (length: number) => String.fromCharCode(...data.subarray(pos, (pos += length)))
  const u16 = () => (data[pos++] << 8) | data[pos++]
  const u32 = () => ((data[pos++] << 24) | (data[pos++] << 16) | (data[pos++] << 8) | data[pos++]) >>> 0
  // Note: `pos += varLength()` would read pos before varLength moves it; use skip() instead.
  const skip = (length: number) => (pos += length)
  const varLength = () => {
    let value = 0
    let byte: number
    do {
      byte = data[pos++]
      value = (value << 7) | (byte & 0x7f)
    } while (byte & 0x80)
    return value
  }

  if (text(4) !== 'MThd') throw new Error('Not a MIDI file')
  const headerLength = u32()
  const headerEnd = pos + headerLength
  u16() // format
  const trackCount = u16()
  const division = u16()
  if (division & 0x8000) throw new Error('SMPTE time division is not supported')
  pos = headerEnd

  const tracks: MidiNote[][] = []
  for (let t = 0; t < trackCount; t++) {
    if (text(4) !== 'MTrk') throw new Error(`Track ${t} is missing`)
    const trackLength = u32()
    const end = pos + trackLength
    const notes: MidiNote[] = []
    // Open notes per channel and pitch, oldest first: when a pitch is struck again before the
    // earlier one is released, the next note-off belongs to the earlier one.
    const open = new Map<number, { start: number; channel: number; pitch: number }[]>()
    let tick = 0
    let status = 0
    while (pos < end) {
      tick += varLength()
      // Meta and system-exclusive events carry their own length and don't change the
      // running status that channel messages may rely on.
      if (data[pos] === 0xff) {
        pos += 2 // 0xFF and the meta type
        skip(varLength())
        continue
      }
      if (data[pos] === 0xf0 || data[pos] === 0xf7) {
        pos++
        skip(varLength())
        continue
      }
      if (data[pos] & 0x80) status = data[pos++]
      const kind = status & 0xf0
      const channel = status & 0x0f
      const a = data[pos++]
      const b = kind === 0xc0 || kind === 0xd0 ? 0 : data[pos++]
      const key = channel * 128 + a
      if (kind === 0x90 && b > 0) {
        open.set(key, [...(open.get(key) ?? []), { start: tick, channel, pitch: a }])
      } else if (kind === 0x80 || kind === 0x90) {
        const [started, ...rest] = open.get(key) ?? []
        if (started) {
          notes.push({ ...started, end: tick })
          open.set(key, rest)
        }
      }
    }
    pos = end
    tracks.push(notes.sort((x, y) => x.start - y.start || y.pitch - x.pitch))
  }
  return { ticksPerQuarter: division, tracks }
}
