import './PlayingBars.css'

/** Small bouncing bars that show a button's melody is playing. */
export function PlayingBars() {
  return (
    <span className="playing-bars" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}
