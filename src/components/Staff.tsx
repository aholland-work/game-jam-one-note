import { diatonicStep, parsePitch, type Note } from '../music/notation'
import './Staff.css'

interface StaffProps {
  notes: Note[]
  beatsPerBar: number
  gapIndex: number
  /** How many notes, from the start, sit at their real pitch. The rest sit on the middle line. */
  revealedCount: number
  /** Draw the missing note instead of the "?" slot. */
  showAnswer: boolean
  answerTone?: 'found' | 'missed'
  activeIndex: number | null
}

const WIDTH = 760
const SYSTEM_HEIGHT = 120
const BARS_PER_SYSTEM = 4
const CLEF_WIDTH = 52
const MARGIN = 8
const HALF_SPACE = 5
// Staff steps (see diatonicStep): bottom line E4 = 30, middle line B4 = 34, top line F5 = 38.
const BOTTOM_LINE = 30
const MIDDLE_LINE = 34
const TOP_LINE = 38

export function Staff({
  notes,
  beatsPerBar,
  gapIndex,
  revealedCount,
  showAnswer,
  answerTone = 'found',
  activeIndex,
}: StaffProps) {
  const beatsPerSystem = beatsPerBar * BARS_PER_SYSTEM
  const beatWidth = (WIDTH - MARGIN * 2 - CLEF_WIDTH) / beatsPerSystem
  const totalBeats = notes.reduce((sum, note) => sum + note.beats, 0)
  const totalBars = Math.ceil(totalBeats / beatsPerBar)
  const systemCount = Math.ceil(totalBars / BARS_PER_SYSTEM)
  const staffLeft = MARGIN + CLEF_WIDTH

  const yFor = (system: number, step: number) =>
    system * SYSTEM_HEIGHT + 80 - (step - BOTTOM_LINE) * HALF_SPACE

  const placed = notes.map((note, index) => {
    const beat = notes.slice(0, index).reduce((sum, previous) => sum + previous.beats, 0)
    const system = Math.floor(beat / beatsPerSystem)
    const x = staffLeft + (beat - system * beatsPerSystem + 0.4) * beatWidth
    return { note, index, system, x }
  })

  return (
    <svg
      className="staff"
      viewBox={`0 0 ${WIDTH} ${systemCount * SYSTEM_HEIGHT + 10}`}
      role="img"
      aria-label="The melody written on a music staff"
    >
      {Array.from({ length: systemCount }, (_, system) => {
        const barsHere = Math.min(BARS_PER_SYSTEM, totalBars - system * BARS_PER_SYSTEM)
        const right = staffLeft + barsHere * beatsPerBar * beatWidth
        const top = yFor(system, TOP_LINE)
        const bottom = yFor(system, BOTTOM_LINE)
        const isLast = system === systemCount - 1
        return (
          <g key={system} className="staff-lines">
            {[30, 32, 34, 36, 38].map((step) => (
              <line key={step} x1={MARGIN} x2={right} y1={yFor(system, step)} y2={yFor(system, step)} />
            ))}
            <text className="staff-clef" x={MARGIN} y={bottom + 13}>
              {'\u{1D11E}'}
            </text>
            {Array.from({ length: barsHere }, (_, bar) => {
              const x = staffLeft + (bar + 1) * beatsPerBar * beatWidth
              const final = isLast && bar === barsHere - 1
              return final ? (
                <g key={bar}>
                  <line x1={x - 5} x2={x - 5} y1={top} y2={bottom} />
                  <line className="staff-final" x1={x - 1.5} x2={x - 1.5} y1={top} y2={bottom} />
                </g>
              ) : (
                <line key={bar} x1={x} x2={x} y1={top} y2={bottom} />
              )
            })}
          </g>
        )
      })}

      {placed.map(({ note, index, system, x }) => {
        if (index === gapIndex && !showAnswer) {
          return (
            <g key={index} className={`staff-gap${activeIndex === index ? ' is-active' : ''}`}>
              <rect x={x - 11} y={yFor(system, 42)} width={22} height={HALF_SPACE * 16} rx={4} />
              <text x={x} y={yFor(system, 43)} textAnchor="middle">
                ?
              </text>
            </g>
          )
        }
        if (note.pitch === null) {
          return (
            <text key={index} className="staff-rest" x={x} y={yFor(system, MIDDLE_LINE) + 8} textAnchor="middle">
              {'\u{1D13D}'}
            </text>
          )
        }
        const isAnswer = index === gapIndex
        const revealed = isAnswer || index < revealedCount
        return (
          <NoteGlyph
            key={index}
            note={note}
            x={x}
            y={yFor(system, diatonicStep(note.pitch))}
            middleY={yFor(system, MIDDLE_LINE)}
            ledgerY={(step) => yFor(system, step)}
            revealed={revealed}
            className={[
              'staff-note',
              activeIndex === index && 'is-active',
              isAnswer && `is-answer is-${answerTone}`,
            ]
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
  ledgerY: (step: number) => number
  revealed: boolean
  className: string
}

/**
 * Draws one note at its real pitch. While hidden, the whole glyph is shifted onto the
 * middle line and pitch clues (ledger lines, sharps and flats) are faded out; revealing
 * it animates the shift away.
 */
function NoteGlyph({ note, x, y, middleY, ledgerY, revealed, className }: NoteGlyphProps) {
  const pitch = note.pitch as string
  const step = diatonicStep(pitch)
  const { accidental } = parsePitch(pitch)
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

  return (
    <g className={className} style={{ transform: revealed ? undefined : `translateY(${middleY - y}px)` }}>
      <g className="staff-pitch-clue" style={{ opacity: revealed ? 1 : 0 }}>
        {ledgers.map((s) => (
          <line key={s} className="staff-ledger" x1={x - 10} x2={x + 10} y1={ledgerY(s)} y2={ledgerY(s)} />
        ))}
        {accidental && (
          <text className="staff-accidental" x={x - 15} y={y + 5} textAnchor="middle">
            {accidental === '#' ? '♯' : '♭'}
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
        const d = stemUp
          ? `M${stemX} ${startY} q8 7 6 18`
          : `M${stemX} ${startY} q8 -7 6 -18`
        return <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={1.6} />
      })}
      {dotted && <circle cx={x + 10} cy={onLine ? y - HALF_SPACE / 2 - 1 : y} r={1.8} fill="currentColor" />}
    </g>
  )
}
