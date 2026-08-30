import { LEVELS } from '../../chess/engine'
import './OpponentControls.css'

const SIDES = [
  { value: null, label: '2 players', hint: 'Both sides played on this screen.' },
  { value: 'b', label: 'Play White', hint: 'You have White, the engine answers as Black.' },
  { value: 'w', label: 'Play Black', hint: 'You have Black, the engine opens as White.' },
]

const ORDER = ['casual', 'club', 'sharp']

export default function OpponentControls({ engineSide, level, thinking, onSide, onLevel }) {
  const current = SIDES.find((option) => option.value === engineSide) ?? SIDES[0]

  return (
    <section className="opponent" aria-label="Opponent">
      <h2 className="panel__heading">Opponent</h2>

      <div className="opponent__row" role="group" aria-label="Who plays">
        {SIDES.map((option) => (
          <button
            key={option.label}
            type="button"
            className="opponent__button"
            aria-pressed={engineSide === option.value}
            onClick={() => onSide(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {engineSide ? (
        <div className="opponent__row" role="group" aria-label="Engine strength">
          {ORDER.map((key) => (
            <button
              key={key}
              type="button"
              className="opponent__button"
              aria-pressed={level === key}
              onClick={() => onLevel(key)}
            >
              {LEVELS[key].label}
            </button>
          ))}
        </div>
      ) : null}

      <p className="opponent__hint" aria-live="polite">
        {thinking ? (
          <span className="opponent__thinking">Engine is thinking</span>
        ) : (
          current.hint
        )}
      </p>
    </section>
  )
}
