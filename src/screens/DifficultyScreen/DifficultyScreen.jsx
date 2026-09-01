import { useState } from 'react'
import Shell from '../Shell/Shell'
import { DEFAULT_LEVEL, LEVELS } from '../../chess/engine'

const ORDER = ['casual', 'club', 'sharp']

const NOTES = {
  casual: 'Looks one move ahead and picks freely among the near-best replies.',
  club: 'Two moves deep with a quiet search. Punishes anything you hang.',
  sharp: 'Three moves deep and takes its time. It will not miss a tactic.',
}

const SIDES = [
  { value: 'w', label: 'White', hint: 'You open.' },
  { value: 'b', label: 'Black', hint: 'The machine opens.' },
  { value: 'random', label: 'Random', hint: 'Decided at the board.' },
]

export default function DifficultyScreen({ onStart, onBack }) {
  const [level, setLevel] = useState(DEFAULT_LEVEL)
  const [side, setSide] = useState('w')

  function start() {
    const mine = side === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : side
    // The engine takes whichever colour is left.
    onStart({ level, engineSide: mine === 'w' ? 'b' : 'w' })
  }

  return (
    <Shell
      eyebrow="Play the machine"
      title="How hard?"
      hint="The opponent runs in this tab — no accounts, no network."
      onBack={onBack}
      backLabel="Main menu"
    >
      <div className="field">
        <div className="field__label">
          <h2 className="heading">Strength</h2>
        </div>
        <div className="choice-row">
          {ORDER.map((key) => (
            <button
              key={key}
              type="button"
              className="btn"
              aria-pressed={level === key}
              onClick={() => setLevel(key)}
            >
              {LEVELS[key].label}
            </button>
          ))}
        </div>
        <p className="field__note">{NOTES[level]}</p>
      </div>

      <div className="field">
        <div className="field__label">
          <h2 className="heading">Your colour</h2>
        </div>
        <div className="choice-row">
          {SIDES.map((option) => (
            <button
              key={option.value}
              type="button"
              className="btn"
              aria-pressed={side === option.value}
              onClick={() => setSide(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="field__note">{SIDES.find((option) => option.value === side).hint}</p>
      </div>

      <button type="button" className="btn btn--primary big-btn" onClick={start}>
        <span className="big-btn__glyph" aria-hidden="true">
          ♞
        </span>
        <span>
          <span className="big-btn__label">Start the game</span>
          <span className="big-btn__hint">{`${LEVELS[level].label} · you play ${
            side === 'random' ? 'either colour' : side === 'w' ? 'White' : 'Black'
          }`}</span>
        </span>
      </button>
    </Shell>
  )
}
