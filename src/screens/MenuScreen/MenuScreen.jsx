import Shell from '../Shell/Shell'
import './MenuScreen.css'

const ENTRIES = [
  {
    key: 'local',
    glyph: '♟',
    label: 'Local match',
    hint: 'Two players sharing this screen.',
    primary: true,
  },
  { key: 'engine', glyph: '♞', label: 'Play the machine', hint: 'Pick a strength and a colour.' },
  { key: 'online', glyph: '♜', label: 'Online match', hint: 'Trade a code, then play peer to peer.' },
  { key: 'settings', glyph: '♝', label: 'Settings', hint: 'Water, trails, camera.' },
]

export default function MenuScreen({ onChoose }) {
  return (
    <Shell eyebrow="Wood, water and eight ranks" title="Isometric Chess">
      <div className="menu-crest" aria-hidden="true">
        {['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'].map((glyph, index) => (
          <span key={index} className="menu-crest__piece" style={{ '--i': index }}>
            {glyph}
          </span>
        ))}
      </div>

      <nav className="menu-list" aria-label="Main menu">
        {ENTRIES.map((entry) => (
          <button
            key={entry.key}
            type="button"
            className={`btn big-btn${entry.primary ? ' btn--primary' : ''}`}
            onClick={() => onChoose(entry.key)}
          >
            <span className="big-btn__glyph" aria-hidden="true">
              {entry.glyph}
            </span>
            <span>
              <span className="big-btn__label">{entry.label}</span>
              <span className="big-btn__hint">{entry.hint}</span>
            </span>
          </button>
        ))}
      </nav>
    </Shell>
  )
}
