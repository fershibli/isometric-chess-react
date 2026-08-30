import './ViewControls.css'

const PITCHES = [
  { value: 0.42, label: 'Low' },
  { value: 0.56, label: 'Mid' },
  { value: 0.7, label: 'High' },
]

export default function ViewControls({ rotation, pitch, onRotate, onPitch }) {
  return (
    <div className="view" role="group" aria-label="Board view">
      <div className="view__group">
        <button
          type="button"
          className="view__button"
          onClick={() => onRotate(rotation - 1)}
          aria-label="Rotate board counter-clockwise"
        >
          <span aria-hidden="true">&#8634;</span>
        </button>
        <button
          type="button"
          className="view__button"
          onClick={() => onRotate(rotation + 1)}
          aria-label="Rotate board clockwise"
        >
          <span aria-hidden="true">&#8635;</span>
        </button>
      </div>
      <div className="view__group" role="group" aria-label="Camera angle">
        {PITCHES.map((option) => (
          <button
            key={option.label}
            type="button"
            className="view__button view__button--text"
            aria-pressed={pitch === option.value}
            onClick={() => onPitch(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
