import { diatonicStep, parsePitch, type Note } from '../music/notation'
import './Staff.css'

interface StaffProps {
  notes: Note[]
  beatsPerBar: number
  /** Length of a pickup (anacrusis) before the first full bar, in beats. */
  pickupBeats?: number
  gapIndex: number
  /** How many notes, from the start, sit at their real pitch. The rest sit on the middle line. */
  revealedCount: number
  /** Draw the missing note instead of the "?" slot. */
  showAnswer: boolean
  answerTone?: 'found' | 'missed'
  activeIndex: number | null
}

const WIDTH = 760
const HEIGHT = 130
const CLEF_WIDTH = 52
const MARGIN = 8
const NOTE_INSET = 14
// Engraving-style spacing: longer notes get more room, but not proportionally more.
const noteSpace = (beats: number) => 14 + 26 * Math.sqrt(beats)
const ACCIDENTAL_SPACE = 12
const BAR_SPACE = 10
const HALF_SPACE = 5
// Staff steps (see diatonicStep): bottom line E4 = 30, middle line B4 = 34, top line F5 = 38.
const BOTTOM_LINE = 30
const MIDDLE_LINE = 34
const TOP_LINE = 38

const ACCIDENTAL_GLYPHS = { '#': '♯', b: '♭', natural: '♮' } as const
type Accidental = keyof typeof ACCIDENTAL_GLYPHS

const yFor = (step: number) => 90 - (step - BOTTOM_LINE) * HALF_SPACE

/**
 * Accidentals as written on the staff: a sharp, flat or natural is shown only when it
 * changes what the same line or space meant earlier in the bar.
 */
function writtenAccidentals(notes: Note[], barOf: (index: number) => number): (Accidental | null)[] {
  let bar = -1
  let inBar = new Map<string, Accidental>()
  return notes.map((note, index) => {
    if (barOf(index) !== bar) {
      bar = barOf(index)
      inBar = new Map()
    }
    if (note.pitch === null) return null
    const { letter, accidental, octave } = parsePitch(note.pitch)
    const position = `${letter}${octave}`
    const current: Accidental = accidental || 'natural'
    const previous = inBar.get(position) ?? 'natural'
    inBar.set(position, current)
    return current === previous ? null : current
  })
}

export function Staff({
  notes,
  beatsPerBar,
  pickupBeats = 0,
  gapIndex,
  revealedCount,
  showAnswer,
  answerTone = 'found',
  activeIndex,
}: StaffProps) {
  const staffLeft = MARGIN + CLEF_WIDTH
  const staffRight = WIDTH - MARGIN

  const startBeats = notes.map((_, index) =>
    notes.slice(0, index).reduce((sum, previous) => sum + previous.beats, 0),
  )
  const barOf = (index: number) => {
    const beat = startBeats[index] + 0.001
    if (pickupBeats === 0) return Math.floor(beat / beatsPerBar)
    return beat < pickupBeats ? 0 : 1 + Math.floor((beat - pickupBeats) / beatsPerBar)
  }
  const accidentals = writtenAccidentals(notes, barOf)

  // Lay notes out in abstract units, then scale to fit the staff. Each note gets room for
  // its accidental, and each new bar adds a little space around its bar line.
  const units: number[] = []
  const barLineUnits: number[] = []
  let cursor = 0
  notes.forEach((note, index) => {
    if (index > 0 && barOf(index) !== barOf(index - 1)) {
      barLineUnits.push(cursor + BAR_SPACE / 2)
      cursor += BAR_SPACE
    }
    if (accidentals[index]) cursor += ACCIDENTAL_SPACE
    units.push(cursor)
    cursor += noteSpace(note.beats)
  })
  const scale = (staffRight - staffLeft - NOTE_INSET) / cursor
  const xForUnit = (unit: number) => staffLeft + unit * scale
  const noteX = units.map((unit) => xForUnit(unit) + NOTE_INSET)

  return (
    <svg className="staff" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="The melody written on a music staff">
      <g className="staff-lines">
        {[30, 32, 34, 36, 38].map((step) => (
          <line key={step} x1={MARGIN} x2={staffRight} y1={yFor(step)} y2={yFor(step)} />
        ))}
        <text className="staff-clef" x={MARGIN} y={yFor(BOTTOM_LINE) + 13}>
          {'\u{1D11E}'}
        </text>
        {barLineUnits.map((unit) => (
          <line key={unit} x1={xForUnit(unit) + NOTE_INSET / 2} x2={xForUnit(unit) + NOTE_INSET / 2} y1={yFor(TOP_LINE)} y2={yFor(BOTTOM_LINE)} />
        ))}
        <line x1={staffRight - 5} x2={staffRight - 5} y1={yFor(TOP_LINE)} y2={yFor(BOTTOM_LINE)} />
        <line
          className="staff-final"
          x1={staffRight - 1.5}
          x2={staffRight - 1.5}
          y1={yFor(TOP_LINE)}
          y2={yFor(BOTTOM_LINE)}
        />
      </g>

      {notes.map((note, index) => {
        const x = noteX[index]
        if (index === gapIndex && !showAnswer) {
          return (
            <g key={index} className={`staff-gap${activeIndex === index ? ' is-active' : ''}`}>
              <rect x={x - 11} y={yFor(42)} width={22} height={HALF_SPACE * 16} rx={4} />
              <text x={x} y={yFor(43)} textAnchor="middle">
                ?
              </text>
            </g>
          )
        }
        if (note.pitch === null) {
          return <Rest key={index} beats={note.beats} x={x} />
        }
        const isAnswer = index === gapIndex
        const next = notes[index + 1]
        const tieToX = note.tie && next ? noteX[index + 1] : null
        return (
          <NoteGlyph
            // Re-mount the answer when its pitch changes so it drops in again.
            key={isAnswer ? `${index}-${note.pitch}` : index}
            note={note}
            x={x}
            y={yFor(diatonicStep(note.pitch))}
            middleY={yFor(MIDDLE_LINE)}
            accidental={accidentals[index]}
            tieToX={tieToX}
            revealed={isAnswer || index < revealedCount}
            className={['staff-note', activeIndex === index && 'is-active', isAnswer && `is-answer is-${answerTone}`]
              .filter(Boolean)
              .join(' ')}
          />
        )
      })}
    </svg>
  )
}

interface NoteGlyphProps {
  note: Note
  x: number
  /** Where the note sits at its real pitch. */
  y: number
  middleY: number
  accidental: Accidental | null
  /** Where the next note sits, when this one is tied to it. */
  tieToX: number | null
  revealed: boolean
  className: string
}

/**
 * Draws one note at its real pitch. While hidden, the whole glyph is shifted onto the
 * middle line and pitch clues (ledger lines, accidentals) are faded out; revealing it
 * animates the shift away.
 */
function NoteGlyph({ note, x, y, middleY, accidental, tieToX, revealed, className }: NoteGlyphProps) {
  const step = diatonicStep(note.pitch as string)
  const stemUp = !revealed || step < MIDDLE_LINE
  const hollow = note.beats >= 2
  const dotted = [0.75, 1.5, 3].includes(note.beats)
  const flags = note.beats === 0.25 ? 2 : note.beats < 1 ? 1 : 0
  const onLine = (step - BOTTOM_LINE) % 2 === 0

  const ledgers: number[] = []
  for (let s = BOTTOM_LINE - 2; s >= step; s -= 2) ledgers.push(s)
  for (let s = TOP_LINE + 2; s <= step; s += 2) ledgers.push(s)

  // Everything below is drawn at the real pitch, so stems and flags are relative to y.
  const stemX = stemUp ? x + 5.6 : x - 5.6
  const stemEnd = stemUp ? y - 30 : y + 30
  const tieY = stemUp ? y + 7 : y - 7
  const tieBow = stemUp ? 6 : -6

  return (
    <g className={className} style={{ transform: revealed ? undefined : `translateY(${middleY - y}px)` }}>
      <g className="staff-pitch-clue" style={{ opacity: revealed ? 1 : 0 }}>
        {ledgers.map((s) => (
          <line key={s} className="staff-ledger" x1={x - 10} x2={x + 10} y1={yFor(s)} y2={yFor(s)} />
        ))}
        {accidental && (
          <text className="staff-accidental" x={x - 15} y={y + 5} textAnchor="middle">
            {ACCIDENTAL_GLYPHS[accidental]}
          </text>
        )}
      </g>
      <ellipse
        cx={x}
        cy={y}
        rx={6.2}
        ry={4.4}
        transform={`rotate(-20 ${x} ${y})`}
        fill={hollow ? 'none' : 'currentColor'}
        stroke="currentColor"
        strokeWidth={1.6}
      />
      {note.beats < 4 && <line x1={stemX} x2={stemX} y1={y} y2={stemEnd} stroke="currentColor" strokeWidth={1.4} />}
      {Array.from({ length: flags }, (_, i) => {
        const startY = stemEnd + (stemUp ? i * 7 : -i * 7)
        const d = stemUp ? `M${stemX} ${startY} q8 7 6 18` : `M${stemX} ${startY} q8 -7 6 -18`
        return <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={1.6} />
      })}
      {dotted && <circle cx={x + 10} cy={onLine ? y - HALF_SPACE / 2 - 1 : y} r={1.8} fill="currentColor" />}
      {tieToX !== null && (
        <path
          d={`M${x + 4} ${tieY} Q${(x + tieToX) / 2} ${tieY + tieBow} ${tieToX - 4} ${tieY}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.3}
        />
      )}
    </g>
  )
}

/**
 * Rests drawn as shapes: the music-symbol font characters are missing on many systems.
 * Eighth and sixteenth rests are a slanted stem with one or two flags.
 */
function Rest({ beats, x }: { beats: number; x: number }) {
  const middle = yFor(MIDDLE_LINE)
  if (beats >= 2) {
    // Whole rest hangs below the fourth line; half rest sits on the middle line.
    const y = beats >= 4 ? yFor(36) : middle - 4
    return <rect className="staff-rest" x={x - 6} y={y} width={12} height={4} />
  }
  if (beats >= 1) {
    return (
      <path
        className="staff-rest-stroke"
        d={`M${x - 2} ${middle - 12} l5 6 l-5 6 l5 6 q-6 -2 -4 5`}
        fill="none"
        strokeWidth={2.2}
      />
    )
  }
  const flags = beats <= 0.25 ? 2 : 1
  return (
    <g className="staff-rest-stroke" strokeWidth={1.4} fill="none">
      <line x1={x + 3} y1={middle - 6} x2={x - 2} y2={middle + 10} />
      {Array.from({ length: flags }, (_, i) => {
        const y = middle - 6 + i * 7
        return (
          <g key={i}>
            <circle className="staff-rest" cx={x - 3} cy={y} r={2} />
            <path d={`M${x - 3} ${y + 1} q3 2 ${6 - i * 2.2} -1`} />
          </g>
        )
      })}
    </g>
  )
}
