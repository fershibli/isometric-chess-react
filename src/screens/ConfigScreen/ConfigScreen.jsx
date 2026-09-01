import Shell from '../Shell/Shell'
import { PITCH_LEVELS, WATER_LEVELS } from '../../app/settings'

function Toggle({ label, note, value, onChange }) {
  return (
    <div className="field" role="group" aria-label={label}>
      <div className="field__label">
        <h2 className="heading">{label}</h2>
      </div>
      <div className="choice-row">
        <button type="button" className="btn" aria-pressed={value} onClick={() => onChange(true)}>
          On
        </button>
        <button type="button" className="btn" aria-pressed={!value} onClick={() => onChange(false)}>
          Off
        </button>
      </div>
      <p className="field__note">{note}</p>
    </div>
  )
}

function Choice({ label, note, options, value, onChange }) {
  return (
    <div className="field" role="group" aria-label={label}>
      <div className="field__label">
        <h2 className="heading">{label}</h2>
      </div>
      <div className="choice-row">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            className="btn"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="field__note">{note}</p>
    </div>
  )
}

export default function ConfigScreen({ settings, onChange, onReset, onBack }) {
  return (
    <Shell
      eyebrow="Settings"
      title="The table"
      hint="Saved in this browser. Nothing leaves the device."
      onBack={onBack}
      backLabel="Main menu"
    >
      <Choice
        label="Water"
        note="The board is a shallow pool. This is how much it moves when a piece lands."
        options={WATER_LEVELS}
        value={settings.water}
        onChange={(water) => onChange({ water })}
      />
      <Choice
        label="Camera"
        note="How far the board is tilted away from you."
        options={PITCH_LEVELS}
        value={settings.pitch}
        onChange={(pitch) => onChange({ pitch })}
      />
      <Toggle
        label="Move trails"
        note="Arcs from the piece you are holding to every square it can reach."
        value={settings.trails}
        onChange={(trails) => onChange({ trails })}
      />
      <Toggle
        label="Coordinates"
        note="Files and ranks along the two near edges."
        value={settings.coordinates}
        onChange={(coordinates) => onChange({ coordinates })}
      />

      <button type="button" className="btn btn--ghost" onClick={onReset}>
        Restore defaults
      </button>
    </Shell>
  )
}
